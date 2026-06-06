pub const APP_API_PREFIX: &str = "/app/v3/api/community";
pub const BACKEND_API_PREFIX: &str = "/backend/v3/api/community";
pub const OPEN_API_PREFIX: &str = "/community/v3/api";

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HttpMethod {
    Delete,
    Get,
    Patch,
    Post,
    Put,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityHttpRoute {
    pub method: HttpMethod,
    pub path: &'static str,
    pub tag: &'static str,
    pub operation_id: &'static str,
}

impl CommunityHttpRoute {
    pub const fn new(
        method: HttpMethod,
        path: &'static str,
        tag: &'static str,
        operation_id: &'static str,
    ) -> Self {
        Self {
            method,
            path,
            tag,
            operation_id,
        }
    }
}

pub fn app_routes() -> Vec<CommunityHttpRoute> {
    vec![
        route(HttpMethod::Get, "/app/v3/api/community/categories", "categories.list"),
        route(HttpMethod::Get, "/app/v3/api/community/feed", "feed.list"),
        route(
            HttpMethod::Get,
            "/app/v3/api/community/entries/{entryId}",
            "entries.retrieve",
        ),
        route(
            HttpMethod::Get,
            "/app/v3/api/community/entries/{entryId}/recommendations",
            "entries.recommendations.list",
        ),
        route(HttpMethod::Post, "/app/v3/api/community/entries", "entries.create"),
        route(
            HttpMethod::Patch,
            "/app/v3/api/community/entries/{entryId}",
            "entries.update",
        ),
        route(
            HttpMethod::Get,
            "/app/v3/api/community/entries/{entryId}/publication_readiness",
            "entries.publicationReadiness.retrieve",
        ),
        route(
            HttpMethod::Get,
            "/app/v3/api/community/entries/{entryId}/comments",
            "comments.list",
        ),
        route(
            HttpMethod::Post,
            "/app/v3/api/community/entries/{entryId}/comments",
            "comments.create",
        ),
    ]
}

pub fn backend_routes() -> Vec<CommunityHttpRoute> {
    vec![
        route(
            HttpMethod::Get,
            "/backend/v3/api/community/categories",
            "categories.management.list",
        ),
        route(
            HttpMethod::Post,
            "/backend/v3/api/community/categories",
            "categories.create",
        ),
        route(
            HttpMethod::Patch,
            "/backend/v3/api/community/categories/{categoryId}",
            "categories.update",
        ),
        route(
            HttpMethod::Delete,
            "/backend/v3/api/community/categories/{categoryId}",
            "categories.delete",
        ),
        route(
            HttpMethod::Get,
            "/backend/v3/api/community/entries",
            "entries.management.list",
        ),
        route(
            HttpMethod::Post,
            "/backend/v3/api/community/entries/{entryId}/moderation",
            "entries.moderation.update",
        ),
        route(
            HttpMethod::Post,
            "/backend/v3/api/community/entries/{entryId}/feature",
            "entries.feature",
        ),
        route(
            HttpMethod::Post,
            "/backend/v3/api/community/entries/{entryId}/pin",
            "entries.pin",
        ),
        route(
            HttpMethod::Delete,
            "/backend/v3/api/community/entries/{entryId}",
            "entries.delete",
        ),
        route(
            HttpMethod::Get,
            "/backend/v3/api/community/moderation/queue",
            "moderation.queue.list",
        ),
        route(
            HttpMethod::Post,
            "/backend/v3/api/community/recommendations/rebuild",
            "recommendations.rebuild",
        ),
    ]
}

pub fn open_routes() -> Vec<CommunityHttpRoute> {
    vec![
        route(
            HttpMethod::Get,
            "/community/v3/api/categories",
            "categories.public.list",
        ),
        route(HttpMethod::Get, "/community/v3/api/feed", "feed.public.list"),
        route(
            HttpMethod::Get,
            "/community/v3/api/entries/{entryId}",
            "entries.public.retrieve",
        ),
        route(
            HttpMethod::Get,
            "/community/v3/api/entries/by_slug/{slug}",
            "entries.publicBySlug.retrieve",
        ),
    ]
}

pub fn all_routes() -> Vec<CommunityHttpRoute> {
    let mut routes = app_routes();
    routes.extend(backend_routes());
    routes.extend(open_routes());
    routes
}

pub fn required_dual_token_headers() -> [&'static str; 2] {
    ["Authorization", "Access-Token"]
}

pub fn required_api_key_headers() -> [&'static str; 1] {
    ["X-API-Key"]
}

fn route(method: HttpMethod, path: &'static str, operation_id: &'static str) -> CommunityHttpRoute {
    CommunityHttpRoute::new(method, path, "community", operation_id)
}
