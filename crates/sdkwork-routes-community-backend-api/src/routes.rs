use std::sync::Arc;

use axum::extract::{Extension, Path, Query, State};
use axum::response::Response;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use sdkwork_community_service::{
    CommunityCategoryCommand, CommunityModerationCommand, CommunityService,
};
use sdkwork_community_storage_sqlx::CommunityFeedQuery;
use sdkwork_iam_context_service::IamAppContext;
use sdkwork_routes_community_common::{
    api_response::{map_service_error, success_command, success_item, success_items},
    dto::{map_category, map_entry},
    subject::runtime_subject_from_extension,
    web_bootstrap::wrap_router_with_web_framework_from_env,
};
use sdkwork_web_core::WebRequestContext;
use serde::Deserialize;

#[derive(Clone)]
struct BackendState {
    service: Arc<CommunityService>,
}

#[derive(Debug, Deserialize)]
struct FeedQueryParams {
    #[serde(rename = "categoryId")]
    category_id: Option<String>,
    kind: Option<String>,
    q: Option<String>,
    #[serde(rename = "reviewState")]
    review_state: Option<String>,
    tag: Option<String>,
    page: Option<i64>,
    page_size: Option<i64>,
}

pub fn build_backend_router(
    host: Arc<sdkwork_community_service_host::CommunityServiceHost>,
) -> Router {
    Router::new()
        .route("/backend/v3/api/community/categories", get(list_categories).post(create_category))
        .route(
            "/backend/v3/api/community/categories/{categoryId}",
            patch(update_category).delete(delete_category),
        )
        .route("/backend/v3/api/community/entries", get(list_entries))
        .route(
            "/backend/v3/api/community/entries/{entryId}/moderation",
            post(update_moderation),
        )
        .route(
            "/backend/v3/api/community/entries/{entryId}/feature",
            post(feature_entry),
        )
        .route(
            "/backend/v3/api/community/entries/{entryId}/pin",
            post(pin_entry),
        )
        .route("/backend/v3/api/community/entries/{entryId}", delete(delete_entry))
        .route(
            "/backend/v3/api/community/moderation/queue",
            get(list_moderation_queue),
        )
        .route(
            "/backend/v3/api/community/recommendations/rebuild",
            post(rebuild_recommendations),
        )
        .with_state(BackendState {
            service: host.service(),
        })
}

pub async fn build_backend_router_with_framework(
    host: Arc<sdkwork_community_service_host::CommunityServiceHost>,
) -> Router {
    wrap_router_with_web_framework_from_env(build_backend_router(host)).await
}

pub async fn gateway_mount(
    host: Arc<sdkwork_community_service_host::CommunityServiceHost>,
) -> Router {
    build_backend_router_with_framework(host).await
}

async fn list_categories(
    State(state): State<BackendState>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
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

async fn create_category(
    State(state): State<BackendState>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
    Json(body): Json<CommunityCategoryCommand>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state.service.create_category(&subject.tenant_id, body).await {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_category(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn update_category(
    State(state): State<BackendState>,
    Path(category_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
    Json(body): Json<CommunityCategoryCommand>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state
        .service
        .update_category(&subject.tenant_id, &category_id, body)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_category(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn delete_category(
    State(state): State<BackendState>,
    Path(category_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state
        .service
        .delete_category(&subject.tenant_id, &category_id)
        .await
    {
        Ok(item) => success_command(context.as_ref().map(|Extension(ctx)| ctx), item),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn list_entries(
    State(state): State<BackendState>,
    Query(params): Query<FeedQueryParams>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    let query = CommunityFeedQuery {
        category_id: params.category_id,
        kind: params.kind,
        q: params.q,
        review_state: params.review_state,
        tag: params.tag,
        page: params.page.unwrap_or(1),
        page_size: params.page_size.unwrap_or(50),
        approved_only: false,
    };
    match state.service.list_feed(&subject.tenant_id, query).await {
        Ok(items) => {
            let count = items.len() as i64;
            success_items(
                context.as_ref().map(|Extension(ctx)| ctx),
                items.into_iter().map(map_entry).collect(),
                params.page.unwrap_or(1),
                params.page_size.unwrap_or(50),
                Some(count),
            )
        }
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn update_moderation(
    State(state): State<BackendState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
    Json(body): Json<CommunityModerationCommand>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state
        .service
        .update_moderation(&subject.tenant_id, &entry_id, &subject.user_id, body)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn feature_entry(
    State(state): State<BackendState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state
        .service
        .set_featured(&subject.tenant_id, &entry_id, true)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn pin_entry(
    State(state): State<BackendState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state
        .service
        .set_pinned(&subject.tenant_id, &entry_id, true)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn delete_entry(
    State(state): State<BackendState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state
        .service
        .delete_entry(&subject.tenant_id, &entry_id)
        .await
    {
        Ok(item) => success_command(context.as_ref().map(|Extension(ctx)| ctx), item),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn list_moderation_queue(
    State(state): State<BackendState>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state.service.list_moderation_queue(&subject.tenant_id).await {
        Ok(items) => {
            let count = items.len() as i64;
            success_items(
                context.as_ref().map(|Extension(ctx)| ctx),
                items.into_iter().map(map_entry).collect(),
                1,
                count,
                Some(count),
            )
        }
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn rebuild_recommendations(
    State(state): State<BackendState>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match auth_subject(context.as_ref().map(|Extension(ctx)| ctx), iam) {
        Ok(subject) => subject,
        Err(response) => return response,
    };
    match state.service.rebuild_recommendations(&subject.tenant_id).await {
        Ok(item) => success_command(context.as_ref().map(|Extension(ctx)| ctx), item),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

#[allow(clippy::result_large_err)]
fn auth_subject(
    context: Option<&WebRequestContext>,
    iam: Option<Extension<IamAppContext>>,
) -> Result<
    sdkwork_routes_community_common::subject::RuntimeSubject,
    Response,
> {
    runtime_subject_from_extension(iam).map_err(|error| {
        map_service_error(
            context,
            sdkwork_community_service::CommunityServiceError::Unauthorized(error),
        )
    })
}
