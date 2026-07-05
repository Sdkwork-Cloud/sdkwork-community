use axum::Extension;
use sdkwork_iam_context_service::IamAppContext;
use sdkwork_iam_web_adapter::iam_app_context_from_web_principal;
use sdkwork_web_core::{DefaultWebRequestContextResolver, WebRequestContext, WebRequestContextResolver};

#[derive(Debug, Clone)]
pub struct RuntimeSubject {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub user_id: String,
    pub display_name: String,
}

pub fn runtime_subject_from_iam(context: &IamAppContext) -> Result<RuntimeSubject, String> {
    let tenant_id = required_text(&context.tenant_id, "tenant_id")?;
    let user_id = required_text(&context.user_id, "user_id")?;
    let display_name = user_id.clone();
    let organization_id = context
        .organization_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned);
    Ok(RuntimeSubject {
        tenant_id,
        organization_id,
        user_id,
        display_name,
    })
}

pub fn runtime_subject_from_extension(
    context: Option<Extension<IamAppContext>>,
) -> Result<RuntimeSubject, String> {
    let Some(Extension(context)) = context else {
        return Err("authenticated runtime context is required".to_owned());
    };
    runtime_subject_from_iam(&context)
}

pub fn tenant_id_from_web_context(context: Option<&WebRequestContext>) -> Option<String> {
    context
        .and_then(|ctx| ctx.tenant_id().map(str::to_owned))
        .filter(|value| !value.trim().is_empty())
}

pub async fn runtime_subject_from_web_context(
    context: Option<&WebRequestContext>,
) -> Result<RuntimeSubject, String> {
    if let Some(context) = context {
        if let Some(tenant_id) = tenant_id_from_web_context(Some(context)) {
            let user_id = context
                .user_id()
                .map(str::to_owned)
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| "anonymous".to_owned());
            return Ok(RuntimeSubject {
                tenant_id,
                organization_id: context.organization_id().map(str::to_owned),
                user_id: user_id.clone(),
                display_name: user_id,
            });
        }
    }
    default_runtime_subject()
}

pub fn default_runtime_subject() -> Result<RuntimeSubject, String> {
    let tenant_id = std::env::var("COMMUNITY_DEFAULT_TENANT_ID")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| "COMMUNITY_DEFAULT_TENANT_ID is required for public community access".to_owned())?;
    Ok(RuntimeSubject {
        tenant_id,
        organization_id: None,
        user_id: "public".to_owned(),
        display_name: "Public".to_owned(),
    })
}

pub async fn optional_runtime_subject_from_headers(
    runtime_context: Option<Extension<IamAppContext>>,
    auth_token: Option<&str>,
    access_token: Option<&str>,
) -> Option<RuntimeSubject> {
    if let Ok(subject) = runtime_subject_from_extension(runtime_context) {
        return Some(subject);
    }
    let auth_token = auth_token?.trim();
    let access_token = access_token?.trim();
    if auth_token.is_empty() || access_token.is_empty() {
        return None;
    }
    let resolver = DefaultWebRequestContextResolver::default();
    let principal = resolver
        .resolve_dual_token(auth_token, access_token)
        .await
        .ok()?;
    runtime_subject_from_iam(&iam_app_context_from_web_principal(&principal)).ok()
}

fn required_text(value: &str, field_name: &'static str) -> Result<String, String> {
    let value = value.trim();
    if value.is_empty() {
        return Err(format!("authenticated runtime context {field_name} is required"));
    }
    Ok(value.to_owned())
}
