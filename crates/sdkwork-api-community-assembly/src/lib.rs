//! API assembly for sdkwork-community.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.
// SDKWORK-ASSEMBLY-LIB-CUSTOM

mod bootstrap;
mod generated;

pub use bootstrap::{
    assemble_api_router, assemble_api_router_runtime, assemble_api_router_with_host,
    assemble_api_router_with_pool, assemble_app_api_contribution,
    assemble_app_api_contribution_with_pool, assemble_backend_business_router,
    assemble_backend_business_router_from_env, assemble_backend_business_router_with_pool,
    app_api_route_manifest, ApiAssembly, BusinessRouterAssembly, CommunityApiRuntime,
};

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
