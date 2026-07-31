use sdkwork_api_community_assembly::assemble_api_router;
use sdkwork_web_bootstrap::ComposedApiAssembly;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let contribution = assemble_api_router().await?;
    let composed = ComposedApiAssembly::try_compose("SDKWork Community API", vec![contribution])?;
    let manifest = composed.route_manifest.clone();
    let resolver = sdkwork_iam_web_adapter::iam_web_request_context_resolver_from_env().await;
    let framework =
        sdkwork_iam_web_adapter::build_web_framework_builder(resolver, manifest, Vec::new());
    let app = composed
        .into_hosted(framework)
        .router
        .layer(TraceLayer::new_for_http());

    let addr = std::env::var("COMMUNITY_API_BIND").unwrap_or_else(|_| "0.0.0.0:18094".to_owned());
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!(target = "community.bootstrap", %addr, "community api server listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    if tokio::signal::ctrl_c().await.is_err() {
        tracing::warn!(target = "community.runtime", "ctrl_c handler failed");
    }
}
