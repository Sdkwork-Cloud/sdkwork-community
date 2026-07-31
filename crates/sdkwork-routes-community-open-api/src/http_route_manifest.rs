use sdkwork_web_core::{HttpMethod, HttpRoute, HttpRouteManifest};

const ROUTES: &[HttpRoute] = &[
    HttpRoute::public(
        HttpMethod::Get,
        "/community/v3/api/categories",
        "community",
        "categories.public.list",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/community/v3/api/feed",
        "community",
        "feed.public.list",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/community/v3/api/entries/{entryId}",
        "community",
        "entries.public.retrieve",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/community/v3/api/entries/by_slug/{slug}",
        "community",
        "entries.publicBySlug.retrieve",
    ),
];

pub fn gateway_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(ROUTES)
}
