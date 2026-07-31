//! Gateway bootstrap for sdkwork-community.

use axum::Router;
use sdkwork_community_service_host::CommunityServiceHost;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_web_bootstrap::{ApiAssemblyContribution, DatabasePoolReadinessCheck};
use sdkwork_web_core::HttpRouteManifest;
use serde_json::Value;
use std::sync::Arc;

pub type ApiAssembly = ApiAssemblyContribution;

pub async fn assemble_api_router() -> Result<ApiAssembly, String> {
    let host = Arc::new(CommunityServiceHost::from_env().await?);
    assemble_api_router_with_host(host)
}

pub async fn assemble_api_router_with_pool(pool: DatabasePool) -> Result<ApiAssembly, String> {
    let host = CommunityServiceHost::from_database_pool(pool).await?;
    assemble_api_router_with_host(host)
}

pub fn assemble_api_router_with_host(
    host: Arc<CommunityServiceHost>,
) -> Result<ApiAssembly, String> {
    let database_pool = host.database_pool().clone();
    let router = Router::new()
        .merge(sdkwork_routes_community_app_api::build_app_router(
            host.clone(),
        ))
        .merge(sdkwork_routes_community_backend_api::build_backend_router(
            host.clone(),
        ))
        .merge(sdkwork_routes_community_open_api::build_open_router(host));
    let route_manifest = combined_route_manifest();
    ApiAssemblyContribution::from_openapi_documents(
        "sdkwork-community",
        "SDKWork Community API",
        router,
        route_manifest,
        authored_openapi_documents()?,
        Vec::new(),
        Arc::new(DatabasePoolReadinessCheck::new(database_pool)),
    )
}

fn combined_route_manifest() -> HttpRouteManifest {
    let manifests = [
        sdkwork_routes_community_app_api::gateway_route_manifest(),
        sdkwork_routes_community_backend_api::gateway_route_manifest(),
        sdkwork_routes_community_open_api::gateway_route_manifest(),
    ];
    HttpRouteManifest::from_owned_routes(
        manifests
            .into_iter()
            .flat_map(|manifest| manifest.routes().to_vec())
            .collect(),
    )
}

fn authored_openapi_documents() -> Result<Vec<Value>, String> {
    [
        include_str!("../../../apis/app-api/community/openapi.json"),
        include_str!("../../../apis/backend-api/community/openapi.json"),
        include_str!("../../../apis/open-api/community/openapi.json"),
    ]
    .into_iter()
    .map(|document| {
        serde_json::from_str(document)
            .map_err(|error| format!("parse Community OpenAPI document failed: {error}"))
    })
    .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_web_core::HttpMethod;

    #[test]
    fn authored_openapi_matches_typed_route_permissions() {
        let documents = authored_openapi_documents().expect("authored OpenAPI documents");
        let manifest = combined_route_manifest();

        for route in manifest.routes() {
            let method = method_label(route.method);
            let operation = documents
                .iter()
                .find_map(|document| document["paths"][route.path][method].as_object())
                .unwrap_or_else(|| panic!("missing authored operation {method} {}", route.path));

            assert_eq!(
                operation.get("operationId").and_then(Value::as_str),
                Some(route.operation_id),
                "operation id drift for {method} {}",
                route.path,
            );
            assert_eq!(
                operation
                    .get("x-sdkwork-permission")
                    .and_then(Value::as_str),
                route.required_permission,
                "permission drift for {method} {}",
                route.path,
            );
        }
    }

    fn method_label(method: HttpMethod) -> &'static str {
        match method {
            HttpMethod::Delete => "delete",
            HttpMethod::Get => "get",
            HttpMethod::Patch => "patch",
            HttpMethod::Post => "post",
            HttpMethod::Put => "put",
        }
    }
}
