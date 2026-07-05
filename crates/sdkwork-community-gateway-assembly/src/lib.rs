use axum::Router;
use sdkwork_community_service_host::CommunityServiceHost;
use std::sync::Arc;

pub struct ApplicationAssembly {
    pub router: Router,
}

pub async fn assemble_application_router(
    host: Arc<CommunityServiceHost>,
) -> ApplicationAssembly {
    let mut router = Router::new();
    router = router.merge(sdkwork_routes_community_open_api::gateway_mount(host.clone()).await);
    router = router.merge(sdkwork_routes_community_app_api::gateway_mount(host.clone()).await);
    router = router.merge(sdkwork_routes_community_backend_api::gateway_mount(host).await);
    ApplicationAssembly { router }
}
