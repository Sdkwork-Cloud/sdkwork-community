use std::sync::Arc;

use axum::body::{to_bytes, Body};
use axum::http::{HeaderName, Method, Request, StatusCode};
use axum::Extension;
use sdkwork_community_service::CommunityCategoryCommand;
use sdkwork_community_service_host::CommunityServiceHost;
use sdkwork_community_storage_sqlx::PostgresTestDatabase;
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment, IamAppContext};
use sdkwork_routes_community_backend_api::build_backend_router;
use serde_json::Value;
use tower::ServiceExt;

fn test_iam_context(tenant_id: &str, user_id: &str) -> IamAppContext {
    IamAppContext::new(
        tenant_id,
        None,
        user_id,
        "session-http-test",
        "community-backend-http-test",
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
async fn backend_missing_iam_context_returns_401_problem_detail() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_backend_router(fixture.host.clone());
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/backend/v3/api/community/categories")
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
async fn backend_categories_returns_sdkwork_v3_success_envelope() {
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_backend_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "admin_1")));
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/backend/v3/api/community/categories")
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
async fn backend_router_mounts_every_openapi_operation_path() {
    let spec: Value = serde_json::from_str(include_str!(
        "../../../apis/backend-api/community/openapi.json"
    ))
    .expect("backend api spec");
    let Some(fixture) = seeded_host().await else {
        return;
    };
    let app = build_backend_router(fixture.host.clone())
        .layer(Extension(test_iam_context("100001", "admin_1")));

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

fn assert_route_mounted(response: &axum::http::Response<Body>, method: &str, path: &str) {
    assert!(
        response
            .headers()
            .contains_key(HeaderName::from_static("x-sdkwork-trace-id")),
        "Backend API route is not mounted: {method} {path}",
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
        .replace("{categoryId}", "category_product")
        .replace("{entryId}", "entry-1")
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
    if template_path.ends_with("/categories") && *method == Method::POST {
        return r#"{"slug":"ops","title":"Ops","enabled":true}"#.to_owned();
    }
    if template_path.contains("/moderation") && *method == Method::POST {
        return r#"{"reviewState":"approved"}"#.to_owned();
    }
    if template_path.contains("/categories/{categoryId}") && *method == Method::PATCH {
        return r#"{"slug":"product","title":"Updated category","enabled":true}"#.to_owned();
    }
    if *method == Method::POST {
        return "{}".to_owned();
    }
    "{}".to_owned()
}
