use axum::http::{HeaderName, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use sdkwork_community_service::CommunityServiceError;
use sdkwork_utils_rust::{
    PageInfo, PageMode, SdkWorkApiResponse, SdkWorkPageData, SdkWorkProblemDetail,
    SdkWorkResourceData, SdkWorkResultCode,
};
use sdkwork_web_core::WebRequestContext;

pub fn resolve_trace_id(context: Option<&WebRequestContext>) -> String {
    context
        .and_then(|ctx| ctx.trace_id.clone())
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(sdkwork_utils_rust::uuid)
}

pub fn success_item<T: serde::Serialize>(context: Option<&WebRequestContext>, item: T) -> Response {
    let trace_id = resolve_trace_id(context);
    let envelope = SdkWorkApiResponse::success(SdkWorkResourceData { item }, trace_id.clone());
    attach_trace_header((StatusCode::OK, Json(envelope)).into_response(), &trace_id)
}

pub fn success_items<T: serde::Serialize>(
    context: Option<&WebRequestContext>,
    items: Vec<T>,
    page: i64,
    page_size: i64,
    total_items: Option<i64>,
) -> Response {
    let trace_id = resolve_trace_id(context);
    let total_pages = total_items.map(|total| {
        if total == 0 {
            0
        } else {
            ((total + page_size - 1) / page_size) as i32
        }
    });
    let has_more = total_items.map(|total| page * page_size < total);
    let envelope = SdkWorkApiResponse::success(
        SdkWorkPageData {
            items,
            page_info: PageInfo {
                mode: PageMode::Offset,
                page: Some(page as i32),
                page_size: Some(page_size as i32),
                total_items: total_items.map(|value| value.to_string()),
                total_pages,
                next_cursor: None,
                has_more,
            },
        },
        trace_id.clone(),
    );
    attach_trace_header((StatusCode::OK, Json(envelope)).into_response(), &trace_id)
}

pub fn success_command<T: serde::Serialize>(
    context: Option<&WebRequestContext>,
    accepted: T,
) -> Response {
    let trace_id = resolve_trace_id(context);
    let envelope = SdkWorkApiResponse::success(accepted, trace_id.clone());
    attach_trace_header((StatusCode::OK, Json(envelope)).into_response(), &trace_id)
}

pub fn map_service_error(
    context: Option<&WebRequestContext>,
    error: CommunityServiceError,
) -> Response {
    let trace_id = resolve_trace_id(context);
    let (status, result_code) = match error.code() {
        "validation" => (StatusCode::BAD_REQUEST, SdkWorkResultCode::ValidationError),
        "invalid-parameter" => (StatusCode::BAD_REQUEST, SdkWorkResultCode::InvalidParameter),
        "not-found" => (StatusCode::NOT_FOUND, SdkWorkResultCode::NotFound),
        "conflict" => (StatusCode::CONFLICT, SdkWorkResultCode::Conflict),
        "unauthorized" => (
            StatusCode::UNAUTHORIZED,
            SdkWorkResultCode::AuthenticationRequired,
        ),
        _ => (
            StatusCode::INTERNAL_SERVER_ERROR,
            SdkWorkResultCode::InternalError,
        ),
    };
    let problem = SdkWorkProblemDetail::platform(result_code, error.message(), trace_id.clone());
    // Emit RFC 9457 `application/problem+json` so the host web framework
    // preserves the real business error instead of normalizing an
    // `application/json` 4xx into a generic 40002 "Malformed request".
    let response = (
        status,
        [(axum::http::header::CONTENT_TYPE, "application/problem+json")],
        Json(problem),
    )
        .into_response();
    attach_trace_header(response, &trace_id)
}

pub fn validation(context: Option<&WebRequestContext>, detail: impl Into<String>) -> Response {
    map_service_error(context, CommunityServiceError::Validation(detail.into()))
}

fn attach_trace_header(response: Response, trace_id: &str) -> Response {
    let mut response = response;
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response
            .headers_mut()
            .insert(HeaderName::from_static("x-sdkwork-trace-id"), value);
    }
    response
}
