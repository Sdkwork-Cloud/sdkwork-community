use std::sync::Arc;

use axum::body::{to_bytes, Body};
use axum::http::{HeaderName, Method, Request, StatusCode};
use axum::Extension;
use sdkwork_community_service::CommunityCategoryCommand;
use sdkwork_community_service_host::CommunityServiceHost;
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

async fn seeded_host() -> Arc<CommunityServiceHost> {
    std::env::set_var("COMMUNITY_DEFAULT_TENANT_ID", "100001");
    let host = CommunityServiceHost::from_sqlite_memory()
        .await
        .expect("sqlite community host");
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
    host
}

async fn response_json(response: axum::response::Response) -> Value {
    let body = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("response body");
    serde_json::from_slice(&body).expect("json body")
}

#[tokio::test]
async fn app_missing_iam_context_returns_401_problem_detail() {
    let host = seeded_host().await;
    let app = build_app_router(host);
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
}

#[tokio::test]
async fn app_categories_returns_sdkwork_v3_success_envelope() {
    let host = seeded_host().await;
    let app = build_app_router(host).layer(Extension(test_iam_context("100001", "user_1")));
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
}

#[tokio::test]
async fn app_router_mounts_every_openapi_operation_path() {
    let spec: Value = serde_json::from_str(include_str!(
        "../../../apis/app-api/community/openapi.json"
    ))
    .expect("app api spec");
    let host = seeded_host().await;
    let app = build_app_router(host).layer(Extension(test_iam_context("100001", "user_1")));

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
}

fn assert_route_mounted(response: &axum::http::Response<Body>, method: &str, path: &str) {
    assert!(
        response.headers().contains_key(HeaderName::from_static("x-sdkwork-trace-id")),
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
    "{}".to_owned()
}
