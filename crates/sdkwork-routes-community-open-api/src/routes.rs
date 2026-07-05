use std::sync::Arc;

use axum::extract::{Extension, Path, Query, State};
use axum::response::Response;
use axum::routing::get;
use axum::Router;
use sdkwork_community_service::CommunityService;
use sdkwork_community_storage_sqlx::CommunityFeedQuery;
use sdkwork_routes_community_common::{
    api_response::{map_service_error, success_item, success_items},
    dto::{map_category, map_entry},
    subject::runtime_subject_from_web_context,
    web_bootstrap::wrap_router_with_web_framework_from_env,
};
use sdkwork_web_core::WebRequestContext;
use serde::Deserialize;

#[derive(Clone)]
struct OpenState {
    service: Arc<CommunityService>,
}

#[derive(Debug, Deserialize)]
struct FeedQueryParams {
    category_id: Option<String>,
    kind: Option<String>,
    q: Option<String>,
    tag: Option<String>,
    page: Option<i64>,
    page_size: Option<i64>,
}

pub fn build_open_router(host: Arc<sdkwork_community_service_host::CommunityServiceHost>) -> Router {
    Router::new()
        .route("/community/v3/api/categories", get(list_categories))
        .route("/community/v3/api/feed", get(list_feed))
        .route(
            "/community/v3/api/entries/by_slug/{slug}",
            get(retrieve_entry_by_slug),
        )
        .route("/community/v3/api/entries/{entryId}", get(retrieve_entry))
        .with_state(OpenState {
            service: host.service(),
        })
}

pub async fn build_open_router_with_framework(
    host: Arc<sdkwork_community_service_host::CommunityServiceHost>,
) -> Router {
    wrap_router_with_web_framework_from_env(build_open_router(host)).await
}

pub async fn gateway_mount(
    host: Arc<sdkwork_community_service_host::CommunityServiceHost>,
) -> Router {
    build_open_router_with_framework(host).await
}

async fn list_categories(
    State(state): State<OpenState>,
    context: Option<axum::Extension<WebRequestContext>>,
) -> Response {
    let subject = match runtime_subject_from_web_context(context.as_ref().map(|Extension(ctx)| ctx)).await
    {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Validation(error),
            )
        }
    };
    match state.service.list_categories(&subject.tenant_id).await {
        Ok(items) => {
            let count = items.len() as i64;
            success_items(
                context.as_ref().map(|Extension(ctx)| ctx),
                items.into_iter().map(map_category).collect(),
                1,
                count,
                Some(count),
            )
        }
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn list_feed(
    State(state): State<OpenState>,
    Query(params): Query<FeedQueryParams>,
    context: Option<axum::Extension<WebRequestContext>>,
) -> Response {
    let subject = match runtime_subject_from_web_context(context.as_ref().map(|Extension(ctx)| ctx)).await
    {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Validation(error),
            )
        }
    };
    let query = CommunityFeedQuery {
        category_id: params.category_id,
        kind: params.kind,
        q: params.q,
        tag: params.tag,
        page: params.page.unwrap_or(1),
        page_size: params.page_size.unwrap_or(20),
        approved_only: true,
        ..CommunityFeedQuery::default()
    };
    match state.service.list_feed(&subject.tenant_id, query).await {
        Ok(items) => {
            let count = items.len() as i64;
            success_items(
                context.as_ref().map(|Extension(ctx)| ctx),
                items.into_iter().map(map_entry).collect(),
                params.page.unwrap_or(1),
                params.page_size.unwrap_or(20),
                Some(count),
            )
        }
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn retrieve_entry(
    State(state): State<OpenState>,
    Path(entry_id): Path<String>,
    context: Option<axum::Extension<WebRequestContext>>,
) -> Response {
    let subject = match runtime_subject_from_web_context(context.as_ref().map(|Extension(ctx)| ctx)).await
    {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Validation(error),
            )
        }
    };
    match state
        .service
        .retrieve_entry(&subject.tenant_id, &entry_id, true)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn retrieve_entry_by_slug(
    State(state): State<OpenState>,
    Path(slug): Path<String>,
    context: Option<axum::Extension<WebRequestContext>>,
) -> Response {
    let subject = match runtime_subject_from_web_context(context.as_ref().map(|Extension(ctx)| ctx)).await
    {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Validation(error),
            )
        }
    };
    match state
        .service
        .retrieve_entry_by_slug(&subject.tenant_id, &slug)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}
