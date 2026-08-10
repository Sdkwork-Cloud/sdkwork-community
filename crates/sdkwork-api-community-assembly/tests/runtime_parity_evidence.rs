use std::path::PathBuf;
use std::sync::Arc;

use axum::body::{to_bytes, Body};
use axum::http::{HeaderName, Method, Request, StatusCode};
use axum::Extension;
use sdkwork_api_community_assembly::assemble_api_router_runtime;
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment, IamAppContext};
use sdkwork_web_bootstrap::{mount_openapi_json, OpenApiMount};
use sdkwork_web_contract::{
    route_inventory_from_openapi, route_inventory_from_routes, ApiRouteInventoryEntry, HttpMethod,
};
use serde_json::{json, Value};
use tower::ServiceExt;

const EVIDENCE_OUTPUT_ENV: &str = "SDKWORK_API_RUNTIME_PARITY_EVIDENCE_OUTPUT";
const TRACE_HEADER: HeaderName = HeaderName::from_static("x-sdkwork-trace-id");

#[tokio::test]
#[ignore = "requires an explicit, initialized PostgreSQL integration profile"]
async fn runtime_parity_evidence() {
    let output = PathBuf::from(
        std::env::var(EVIDENCE_OUTPUT_ENV)
            .unwrap_or_else(|_| panic!("{EVIDENCE_OUTPUT_ENV} is required")),
    );
    std::env::set_var("SDKWORK_DATABASE_AUTO_MIGRATE", "false");
    std::env::set_var("SDKWORK_DATABASE_SEED_ON_BOOT", "false");

    let runtime = assemble_api_router_runtime()
        .await
        .expect("assemble Community runtime parity probe");
    let manifest = runtime.contribution.route_manifest.clone();
    let expected = route_inventory_from_routes(manifest.routes());
    assert!(
        !expected.is_empty(),
        "Community runtime must serve API routes"
    );

    let openapi = Arc::new(runtime.contribution.openapi.clone());
    let router = runtime
        .contribution
        .router
        .layer(Extension(probe_iam_context()));
    let router = mount_openapi_json(
        router,
        &[OpenApiMount {
            path: "/openapi.json",
            document: openapi,
        }],
    );

    for route in manifest.routes() {
        let response = router
            .clone()
            .oneshot(probe_request(route.method, route.path))
            .await
            .unwrap_or_else(|error| panic!("probe {} failed: {error}", route.operation_id));
        assert!(
            response.headers().contains_key(&TRACE_HEADER),
            "assembled handler is not mounted for {} {}",
            method_label(route.method),
            route.path,
        );
    }

    let served_response = router
        .clone()
        .oneshot(
            Request::get("/openapi.json")
                .body(Body::empty())
                .expect("runtime OpenAPI request"),
        )
        .await
        .expect("serve runtime OpenAPI");
    assert_eq!(served_response.status(), StatusCode::OK);
    let served_body = to_bytes(served_response.into_body(), usize::MAX)
        .await
        .expect("read runtime OpenAPI body");
    let served_openapi: Value =
        serde_json::from_slice(&served_body).expect("parse runtime OpenAPI body");
    let served_inventory =
        route_inventory_from_openapi(&served_openapi).expect("runtime OpenAPI inventory");
    assert_eq!(served_inventory, expected);

    let sdk_authority_inventory = sdk_authority_inventory();
    assert_eq!(sdk_authority_inventory, expected);

    let evidence = json!({
        "schemaVersion": 1,
        "kind": "sdkwork.api-runtime-parity-evidence",
        "application": "sdkwork-community",
        "profile": "standalone",
        "apiMode": "served",
        "sources": {
            "executableRouter": {
                "kind": "runtime-probe",
                "location": "cargo:test/runtime_parity_evidence"
            },
            "boundManifest": {
                "kind": "framework-bound-manifest",
                "location": "crates/sdkwork-api-community-assembly:combined-route-manifest"
            },
            "servedOpenapi": {
                "kind": "runtime-http-openapi",
                "location": "http://127.0.0.1:18094/openapi.json"
            },
            "sdkAuthority": {
                "kind": "sdk-generation-authority",
                "location": "apis/{app-api,backend-api,open-api}/community/openapi.json"
            }
        },
        "inventories": {
            "executableRouter": expected,
            "boundManifest": route_inventory_from_routes(manifest.routes()),
            "servedOpenapi": served_inventory,
            "sdkAuthority": sdk_authority_inventory
        }
    });
    let payload = format!(
        "{}\n",
        serde_json::to_string_pretty(&evidence).expect("serialize runtime parity evidence")
    );
    std::fs::write(&output, payload).expect("write runtime parity evidence");

    drop(router);
    runtime.database_pool.close().await;
}

fn probe_iam_context() -> IamAppContext {
    IamAppContext::new(
        "runtime-parity-probe-tenant",
        None,
        "runtime-parity-probe-user",
        "runtime-parity-probe-session",
        "sdkwork-community-runtime-parity-probe",
        Environment::Dev,
        DeploymentMode::Local,
        AuthLevel::Password,
        Vec::new(),
        Vec::new(),
    )
}

fn probe_request(method: HttpMethod, template_path: &str) -> Request<Body> {
    let method = axum_method(method);
    let uri = template_path
        .replace("{categoryId}", "runtime-parity-missing-category")
        .replace("{memberId}", "runtime-parity-missing-member")
        .replace("{groupId}", "runtime-parity-missing-group")
        .replace("{entryId}", "runtime-parity-missing-entry")
        .replace("{slug}", "runtime-parity-missing-slug");
    let body = probe_body(&method, template_path);
    let mut builder = Request::builder().method(method).uri(uri);
    if !body.is_empty() {
        builder = builder.header("content-type", "application/json");
    }
    builder
        .body(if body.is_empty() {
            Body::empty()
        } else {
            Body::from(body)
        })
        .expect("runtime parity probe request")
}

fn probe_body(method: &Method, path: &str) -> &'static str {
    if *method == Method::PATCH && path.contains("/members/") {
        return r#"{"role":"admin"}"#;
    }
    if *method == Method::PATCH && path.contains("/groups/") {
        return r#"{"name":"runtime parity probe","platform":"wechat"}"#;
    }
    if *method == Method::PATCH && path.contains("/categories/") {
        return r#"{"slug":"","title":"runtime parity probe"}"#;
    }
    if *method == Method::PATCH && path.contains("/entries/") {
        return r#"{"categoryId":"","kind":"discussion","title":"","tags":[]}"#;
    }
    if *method != Method::POST {
        return "";
    }
    if path.ends_with("/categories") {
        return r#"{"slug":"","title":"runtime parity probe"}"#;
    }
    if path.ends_with("/join") {
        return "{}";
    }
    if path.ends_with("/groups") {
        return r#"{"name":"runtime parity probe","platform":"wechat"}"#;
    }
    if path.ends_with("/entries") {
        return r#"{"categoryId":"","kind":"discussion","title":"","tags":[]}"#;
    }
    if path.ends_with("/comments") {
        return r#"{"body":""}"#;
    }
    if path.ends_with("/reactions") {
        return r#"{"reactionType":"","active":false}"#;
    }
    if path.ends_with("/moderation") {
        return r#"{"reviewState":"approved","reason":"runtime parity probe"}"#;
    }
    "{}"
}

fn sdk_authority_inventory() -> Vec<ApiRouteInventoryEntry> {
    let mut inventory = Vec::new();
    for document in [
        include_str!("../../../apis/app-api/community/openapi.json"),
        include_str!("../../../apis/backend-api/community/openapi.json"),
        include_str!("../../../apis/open-api/community/openapi.json"),
    ] {
        let document: Value = serde_json::from_str(document).expect("SDK authority OpenAPI");
        inventory.extend(
            route_inventory_from_openapi(&document).expect("SDK authority route inventory"),
        );
    }
    inventory.sort();
    inventory
}

fn axum_method(method: HttpMethod) -> Method {
    match method {
        HttpMethod::Delete => Method::DELETE,
        HttpMethod::Get => Method::GET,
        HttpMethod::Patch => Method::PATCH,
        HttpMethod::Post => Method::POST,
        HttpMethod::Put => Method::PUT,
    }
}

fn method_label(method: HttpMethod) -> &'static str {
    match method {
        HttpMethod::Delete => "DELETE",
        HttpMethod::Get => "GET",
        HttpMethod::Patch => "PATCH",
        HttpMethod::Post => "POST",
        HttpMethod::Put => "PUT",
    }
}
