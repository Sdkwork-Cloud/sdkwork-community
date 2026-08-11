//! API assembly for sdkwork-community.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.

mod bootstrap;
mod generated;

pub use bootstrap::{
    assemble_api_router, assemble_api_router_runtime, assemble_api_router_with_host,
    assemble_api_router_with_pool, assemble_app_api_contribution,
    assemble_app_api_contribution_with_pool, ApiAssembly, CommunityApiRuntime,
};

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
