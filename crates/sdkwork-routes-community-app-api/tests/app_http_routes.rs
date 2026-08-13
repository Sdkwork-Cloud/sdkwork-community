use std::sync::Arc;

use axum::body::{to_bytes, Body};
use axum::http::{HeaderName, Method, Request, StatusCode};
use axum::Extension;
use sdkwork_community_service::CommunityCategoryCommand;
use sdkwork_community_service_host::CommunityServiceHost;
use sdkwork_community_storage_sqlx::PostgresTestDatabase;
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment, IamAppContext};
use sdkwork_routes_community_app_api::build_app_router;
use serde_json::Value;
use tower::ServiceExt;

fn test_iam_context(tenant_id: &str, user_id: &str) -> IamAppContext {
    IamAppContext::new(
        tenant_id,
        None,
        user_id,
        "session-http-test",
        "community-app-http-test",
        Environment::Dev,
        DeploymentMode::Local,
        AuthLevel::Password,
        Vec::new(),
        Vec::new(),
    )
}

struct SeededHost {
    host: Arc<CommunityServiceHost>,
    database: PostgresTestDatabase,
}

impl SeededHost {
    async fn close(self) {
        drop(self.host);
        self.database
            .close()
            .await
            .expect("clean isolated PostgreSQL test schema");
    }
}

async fn seeded_host() -> Option<SeededHost> {
    std::env::set_var("COMMUNITY_DEFAULT_TENANT_ID", "100001");
    let Some(database) = PostgresTestDatabase::from_env()
        .await
        .expect("create isolated PostgreSQL test database")
    else {
        eprintln!(
            "skipping Community PostgreSQL route test; set SDKWORK_DATABASE_TEST_POSTGRES_URL"
        );
        return None;
    };
    let host = CommunityServiceHost::from_database_pool(database.pool())
        .await
        .expect("PostgreSQL community host");
    host.service()
        .create_category(
            "100001",
            CommunityCategoryCommand {
                slug: "product".to_owned(),
                title: "Product".to_owned(),
                description: Some("Product updates".to_owned()),
                priority: Some(1),
                enabled: Some(true),
            },
        )
        .await
        .expect("seed category");
    Some(SeededHost { host, database })
}

async fn response_json(response: axum::response::Response) -> Value {
    let body = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("response body");
    serde_json::from_slice(&body).expect("json body")
}

#[tokio::test]
async fn app_missing_iam_context_returns_401_problem_detail() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_app_router(fixture.host.clone());
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/app/v3/api/community/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("response");
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let json = response_json(response).await;
    assert_eq!(json["code"], 40101);
    fixture.close().await;
}

#[tokio::test]
async fn app_categories_returns_sdkwork_v3_success_envelope() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_app_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "user_1")));
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/app/v3/api/community/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("categories response");

    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    assert_eq!(payload["code"], 0);
    assert!(payload["traceId"].is_string());
    assert!(payload["data"]["items"].is_array());
    assert_eq!(payload["data"]["pageInfo"]["mode"], "offset");
    fixture.close().await;
}

#[tokio::test]
async fn app_feed_rejects_page_size_above_standard_maximum() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_app_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "user_1")));
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/app/v3/api/community/feed?page=1&page_size=201")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed response");

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let payload = response_json(response).await;
    assert_eq!(payload["code"], 40003);
    fixture.close().await;
}

#[tokio::test]
async fn app_feed_is_public_without_iam_context() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    // No IAM extension: public feed.list must fall back to the default tenant
    // and serve approved content instead of returning 401.
    let app = build_app_router(fixture.host.clone());
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/app/v3/api/community/feed?page=1&page_size=20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    assert_eq!(payload["code"], 0);
    assert!(payload["data"]["items"].is_array());
    assert_eq!(payload["data"]["pageInfo"]["page"], 1);
    fixture.close().await;
}

#[tokio::test]
async fn app_router_mounts_every_openapi_operation_path() {
    let spec: Value =
        serde_json::from_str(include_str!("../../../apis/app-api/community/openapi.json"))
            .expect("app api spec");
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_app_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "user_1")));

    for (template_path, methods) in spec["paths"].as_object().expect("paths") {
        for method_name in methods.as_object().expect("methods").keys() {
            if method_name == "parameters" {
                continue;
            }
            let response = app
                .clone()
                .oneshot(openapi_request(
                    method_from_openapi(method_name),
                    template_path,
                    &concrete_uri(template_path),
                ))
                .await
                .expect("route response");

            assert_route_mounted(&response, method_name, template_path);
        }
    }
    drop(app);
    fixture.close().await;
}

#[tokio::test]
async fn app_circle_flow_creates_joins_manages_members_and_groups() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_app_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "user_1")));

    // Create a circle (owner membership is created implicitly).
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/app/v3/api/community/categories")
                .header("content-type", "application/json")
                .body(Body::from(
                    r#"{"title":"AI 开发者联盟","description":"AI 交流","tags":["AI"]}"#,
                ))
                .unwrap(),
        )
        .await
        .expect("create circle response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    assert_eq!(payload["code"], 0);
    let category_id = payload["data"]["id"]
        .as_str()
        .expect("circle id")
        .to_owned();
    assert_eq!(payload["data"]["memberCount"], 1);
    assert_eq!(payload["data"]["ownerId"], "user_1");

    // Current member is the owner.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/members/current"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("current member response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["role"], "owner");

    // Join as another member.
    let second_app = build_app_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "user_2")));
    let response = second_app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/join"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("join circle response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    let member_id = payload["data"]["id"]
        .as_str()
        .expect("member id")
        .to_owned();

    // Member list has both members.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/members"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("members response");
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["items"].as_array().expect("items").len(), 2);

    // Owner promotes the member to admin.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/members/{member_id}"
                ))
                .header("content-type", "application/json")
                .body(Body::from(r#"{"role":"admin"}"#))
                .unwrap(),
        )
        .await
        .expect("update member response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["role"], "admin");

    // Create and list groups.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/app/v3/api/community/categories/{category_id}/groups"))
                .header("content-type", "application/json")
                .body(Body::from(
                    r#"{"name":"交流群","platform":"wechat","qrCodes":[{"url":"https://example.test/qr.png","description":"扫码加入"}]}"#,
                ))
                .unwrap(),
        )
        .await
        .expect("create group response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["name"], "交流群");
    assert_eq!(
        payload["data"]["qrCodes"][0]["url"],
        "https://example.test/qr.png"
    );

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/groups"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("groups response");
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["items"].as_array().expect("items").len(), 1);

    // Circle member count reflects the join.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/app/v3/api/community/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("categories response");
    let payload = response_json(response).await;
    let created = payload["data"]["items"]
        .as_array()
        .expect("items")
        .iter()
        .find(|item| item["id"] == category_id)
        .expect("created circle");
    assert_eq!(created["memberCount"], 2);

    fixture.close().await;
}

#[tokio::test]
async fn app_tier_management_flow_requires_owner_and_cruds_tiers() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_app_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "user_1")));

    // Create a paid circle owned by user_1.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/app/v3/api/community/categories")
                .header("content-type", "application/json")
                .body(Body::from(
                    r#"{"title":"付费测试圈","isPaid":true,"price":99}"#,
                ))
                .unwrap(),
        )
        .await
        .expect("create circle response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    let category_id = payload["data"]["id"]
        .as_str()
        .expect("circle id")
        .to_owned();

    // Create a tier (unpublished by default).
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/app/v3/api/community/categories/{category_id}/tiers"))
                .header("content-type", "application/json")
                .body(Body::from(r#"{"name":"高级会员","price":199,"durationDays":365,"benefits":["内容","群"]}"#))
                .unwrap(),
        )
        .await
        .expect("create tier response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    let tier_id = payload["data"]["id"].as_str().expect("tier id").to_owned();
    assert_eq!(payload["data"]["enabled"], false);

    // Unpublished tiers are hidden from the purchase surface.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/tiers"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("tiers list response");
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["items"].as_array().expect("items").len(), 0);

    // Owner management list includes unpublished tiers.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/tiers?includeDisabled=true"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("tiers management list response");
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["items"].as_array().expect("items").len(), 1);

    // Publishing requires the membership backend; without configuration the
    // request fails with an internal error instead of a silent success.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/tiers/{tier_id}/publish"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("publish tier response");
    assert!(
        response.status().is_server_error(),
        "publish without a membership backend must fail closed"
    );

    // Update the tier (price validation rejects negatives).
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/tiers/{tier_id}"
                ))
                .header("content-type", "application/json")
                .body(Body::from(r#"{"name":"高级会员","price":-1}"#))
                .unwrap(),
        )
        .await
        .expect("negative price tier response");
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/tiers/{tier_id}"
                ))
                .header("content-type", "application/json")
                .body(Body::from(r#"{"name":"高级会员","price":299}"#))
                .unwrap(),
        )
        .await
        .expect("update tier response");
    assert_eq!(response.status(), StatusCode::OK);
    let payload = response_json(response).await;
    assert_eq!(payload["data"]["price"], 299.0);

    // Non-manager members cannot create tiers.
    let stranger = build_app_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "user_9")));
    let response = stranger
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/tiers"
                ))
                .header("content-type", "application/json")
                .body(Body::from(r#"{"name":"越权等级","price":1}"#))
                .unwrap(),
        )
        .await
        .expect("stranger create tier response");
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    // Paid circles reject direct joins (membership purchase is required).
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/app/v3/api/community/categories/{category_id}/join"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("paid join response");
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    fixture.close().await;
}

fn assert_route_mounted(response: &axum::http::Response<Body>, method: &str, path: &str) {
    assert!(
        response
            .headers()
            .contains_key(HeaderName::from_static("x-sdkwork-trace-id")),
        "App API route is not mounted: {method} {path}",
    );
}

fn method_from_openapi(method_name: &str) -> Method {
    match method_name {
        "delete" => Method::DELETE,
        "get" => Method::GET,
        "patch" => Method::PATCH,
        "post" => Method::POST,
        "put" => Method::PUT,
        value => panic!("unsupported OpenAPI method: {value}"),
    }
}

fn concrete_uri(template_path: &str) -> String {
    template_path
        .replace("{entryId}", "entry-1")
        .replace("{slug}", "product-update")
        .replace("{categoryId}", "category-1")
        .replace("{memberId}", "member-1")
        .replace("{groupId}", "group-1")
}

fn openapi_request(method: Method, template_path: &str, uri: &str) -> Request<Body> {
    let needs_body = method == Method::POST || method == Method::PATCH || method == Method::PUT;
    let body = if needs_body {
        Body::from(sample_body(&method, template_path))
    } else {
        Body::empty()
    };
    let mut builder = Request::builder().method(method).uri(uri);
    if needs_body {
        builder = builder.header("content-type", "application/json");
    }
    builder.body(body).expect("request")
}

fn sample_body(method: &Method, template_path: &str) -> String {
    if template_path.ends_with("/entries") && *method == Method::POST {
        return r#"{"categoryId":"category_product","kind":"discussion","title":"Test","tags":[]}"#
            .to_owned();
    }
    if template_path.contains("/comments") && *method == Method::POST {
        return r#"{"body":"test comment"}"#.to_owned();
    }
    if template_path.contains("/reactions") && *method == Method::POST {
        return r#"{"reactionType":"like","active":true}"#.to_owned();
    }
    if template_path.contains("/entries/{entryId}") && *method == Method::PATCH {
        return r#"{"categoryId":"category_product","kind":"discussion","title":"Updated title","tags":[]}"#
            .to_owned();
    }
    if template_path.ends_with("/categories") && *method == Method::POST {
        return r#"{"title":"New circle","tags":[]}"#.to_owned();
    }
    if template_path.contains("/categories/{categoryId}") && *method == Method::PATCH {
        return r#"{"title":"Updated circle","tags":[]}"#.to_owned();
    }
    if template_path.contains("/members/{memberId}") && *method == Method::PATCH {
        return r#"{"role":"admin"}"#.to_owned();
    }
    if template_path.contains("/groups") && (*method == Method::POST || *method == Method::PATCH) {
        return r#"{"name":"Group","platform":"wechat"}"#.to_owned();
    }
    "{}".to_owned()
}
