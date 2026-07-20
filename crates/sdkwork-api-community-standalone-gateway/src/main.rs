use std::sync::Arc;
use std::time::Duration;

use sdkwork_api_community_assembly::assemble_api_router;
use sdkwork_community_service_host::CommunityServiceHost;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_web_bootstrap::{
    service_router, ReadinessCheck, ReadinessFuture, ServiceRouterConfig,
};
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let host = match CommunityServiceHost::from_env().await {
        Ok(host) => Arc::new(host),
        Err(error) => {
            tracing::error!(target = "community.bootstrap", error = %error, "community service host bootstrap failed");
            return Err(error.into());
        }
    };

    let business = assemble_api_router(host.clone())
        .await
        .router
        .layer(TraceLayer::new_for_http());

    let readiness = Arc::new(CommunityReadiness {
        host: host.clone(),
    });
    let app = service_router(
        business,
        ServiceRouterConfig::default().with_readiness_check(readiness),
    );

    let addr = std::env::var("COMMUNITY_API_BIND").unwrap_or_else(|_| "0.0.0.0:18094".to_owned());
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!(target = "community.bootstrap", %addr, "community api server listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tokio::time::timeout(Duration::from_secs(30), host.database_pool().close())
        .await
        .map_err(|_| std::io::Error::other("database pool close timed out after 30s"))?;
    Ok(())
}

#[derive(Clone)]
struct CommunityReadiness {
    host: Arc<CommunityServiceHost>,
}

impl ReadinessCheck for CommunityReadiness {
    fn check(&self) -> ReadinessFuture<'_> {
        Box::pin(async move {
            let result = match self.host.database_pool() {
                DatabasePool::Postgres(pool, _) => {
                    sqlx::query_scalar::<_, i64>("SELECT 1").fetch_one(pool).await
                }
                DatabasePool::Sqlite(pool, _) => {
                    sqlx::query_scalar::<_, i64>("SELECT 1").fetch_one(pool).await
                }
            };
            result
                .map(|_| ())
                .map_err(|error| format!("database is not ready: {error}"))
        })
    }
}

async fn shutdown_signal() {
    if tokio::signal::ctrl_c().await.is_err() {
        tracing::warn!(target = "community.runtime", "ctrl_c handler failed");
    }
}
