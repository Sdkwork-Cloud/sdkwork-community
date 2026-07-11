//! Gateway bootstrap for sdkwork-community.

use axum::Router;

pub struct ApplicationAssembly {
    pub router: Router,
}

pub fn assemble_application_router() -> ApplicationAssembly {
    ApplicationAssembly {
        router: Router::new(),
    }
}
