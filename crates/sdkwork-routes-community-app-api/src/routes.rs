use std::sync::Arc;

use axum::extract::{Extension, Path, Query, State};
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use sdkwork_community_service::{
    CommunityCommentCommand, CommunityEntryCommand, CommunityReactionCommand, CommunityService,
};
use sdkwork_community_storage_sqlx::CommunityFeedQuery;
use sdkwork_iam_context_service::IamAppContext;
use sdkwork_routes_community_common::{
    api_response::{map_service_error, success_command, success_item, success_items},
    dto::{map_category, map_comment, map_entry},
    subject::runtime_subject_from_extension,
    web_bootstrap::wrap_router_with_web_framework_from_env,
};
use sdkwork_web_core::WebRequestContext;
use serde::Deserialize;

#[derive(Clone)]
struct AppState {
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

pub fn build_app_router(host: Arc<sdkwork_community_service_host::CommunityServiceHost>) -> Router {
    Router::new()
        .route("/app/v3/api/community/categories", get(list_categories))
        .route("/app/v3/api/community/feed", get(list_feed))
        .route("/app/v3/api/community/entries", post(create_entry))
        .route(
            "/app/v3/api/community/entries/{entryId}",
            get(retrieve_entry).patch(update_entry).delete(delete_entry),
        )
        .route(
            "/app/v3/api/community/entries/{entryId}/reactions",
            post(set_reaction),
        )
        .route(
            "/app/v3/api/community/entries/{entryId}/recommendations",
            get(list_recommendations),
        )
        .route(
            "/app/v3/api/community/entries/{entryId}/publication_readiness",
            get(publication_readiness),
        )
        .route(
            "/app/v3/api/community/entries/{entryId}/comments",
            get(list_comments).post(create_comment),
        )
        .with_state(AppState {
            service: host.service(),
        })
}

pub async fn build_app_router_with_framework(
    host: Arc<sdkwork_community_service_host::CommunityServiceHost>,
) -> Router {
    wrap_router_with_web_framework_from_env(build_app_router(host)).await
}

pub async fn gateway_mount(
    host: Arc<sdkwork_community_service_host::CommunityServiceHost>,
) -> Router {
    build_app_router_with_framework(host).await
}

async fn list_categories(
    State(state): State<AppState>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
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
    State(state): State<AppState>,
    Query(params): Query<FeedQueryParams>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    let query = CommunityFeedQuery {
        category_id: params.category_id,
        kind: params.kind,
        q: params.q,
        review_state: params.review_state,
        tag: params.tag,
        page: params.page.unwrap_or(1),
        page_size: params.page_size.unwrap_or(20),
        approved_only: true,
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

async fn create_entry(
    State(state): State<AppState>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
    Json(body): Json<CommunityEntryCommand>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .create_entry(
            &subject.tenant_id,
            &subject.user_id,
            &subject.display_name,
            body,
        )
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn retrieve_entry(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .retrieve_entry(&subject.tenant_id, &entry_id, false)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn update_entry(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
    Json(body): Json<CommunityEntryCommand>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .update_entry(&subject.tenant_id, &entry_id, body)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_entry(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn list_recommendations(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .list_recommendations(&subject.tenant_id, &entry_id)
        .await
    {
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

async fn publication_readiness(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .publication_readiness(&subject.tenant_id, &entry_id)
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), item),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn list_comments(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .list_comments(&subject.tenant_id, &entry_id)
        .await
    {
        Ok(items) => {
            let count = items.len() as i64;
            success_items(
                context.as_ref().map(|Extension(ctx)| ctx),
                items.into_iter().map(map_comment).collect(),
                1,
                count,
                Some(count),
            )
        }
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn create_comment(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
    Json(body): Json<CommunityCommentCommand>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .create_comment(
            &subject.tenant_id,
            &entry_id,
            &subject.user_id,
            &subject.display_name,
            body,
        )
        .await
    {
        Ok(item) => success_item(context.as_ref().map(|Extension(ctx)| ctx), map_comment(item)),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn set_reaction(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
    Json(body): Json<CommunityReactionCommand>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .set_reaction(
            &subject.tenant_id,
            &entry_id,
            &subject.user_id,
            body,
        )
        .await
    {
        Ok(item) => success_command(context.as_ref().map(|Extension(ctx)| ctx), item),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}

async fn delete_entry(
    State(state): State<AppState>,
    Path(entry_id): Path<String>,
    context: Option<Extension<WebRequestContext>>,
    iam: Option<Extension<IamAppContext>>,
) -> Response {
    let subject = match runtime_subject_from_extension(iam) {
        Ok(subject) => subject,
        Err(error) => {
            return map_service_error(
                context.as_ref().map(|Extension(ctx)| ctx),
                sdkwork_community_service::CommunityServiceError::Unauthorized(error),
            )
        }
    };
    match state
        .service
        .delete_entry_for_author(&subject.tenant_id, &subject.user_id, &entry_id)
        .await
    {
        Ok(item) => success_command(context.as_ref().map(|Extension(ctx)| ctx), item),
        Err(error) => map_service_error(context.as_ref().map(|Extension(ctx)| ctx), error),
    }
}
