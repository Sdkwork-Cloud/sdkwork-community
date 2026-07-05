use std::sync::Arc;

use axum::body::Body;
use axum::http::response::Response;
use axum::http::{HeaderName, Method, Request, StatusCode};
use sdkwork_community_service::CommunityCategoryCommand;
use sdkwork_community_service_host::CommunityServiceHost;
use sdkwork_routes_community_open_api::build_open_router;
use serde_json::Value;
use tower::util::ServiceExt;

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

#[tokio::test]
async fn open_router_mounts_every_openapi_operation_path() {
    let spec: Value = serde_json::from_str(include_str!(
        "../../../apis/open-api/community/openapi.json"
    ))
    .expect("open api spec");
    let host = seeded_host().await;
    let app = build_open_router(host);

    for (template_path, methods) in spec["paths"].as_object().expect("paths") {
        for method_name in methods.as_object().expect("methods").keys() {
            if method_name == "parameters" {
                continue;
            }
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .method(method_from_openapi(method_name))
                        .uri(concrete_uri(template_path))
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .expect("route response");

            assert_route_mounted(&response, method_name, template_path);
        }
    }
}

fn assert_route_mounted(response: &Response<Body>, method: &str, path: &str) {
    assert!(
        response.headers().contains_key(HeaderName::from_static("x-sdkwork-trace-id")),
        "OpenAPI route is not mounted: {method} {path}",
    );
}

#[tokio::test]
async fn open_categories_returns_sdkwork_v3_success_envelope() {
    let host = seeded_host().await;
    let app = build_open_router(host);
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/community/v3/api/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("categories response");

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("response body");
    let payload: Value = serde_json::from_slice(&body).expect("json body");
    assert_eq!(payload["code"], 0);
    assert!(payload["traceId"].is_string());
    assert!(payload["data"]["items"].is_array());
    assert_eq!(payload["data"]["pageInfo"]["mode"], "offset");
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
