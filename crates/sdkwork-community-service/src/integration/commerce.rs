//! Commerce integration: membership package registration and order payment
//! verification through the sdkwork-membership and sdkwork-order backend APIs.
//!
//! The community module never creates or settles orders itself; it registers
//! circle membership tiers as purchasable membership packages (so
//! sdkwork-order can resolve `packageId` by external id) and, after the
//! mobile cashier reports a paid order, verifies the order status with the
//! order backend before activating the circle membership.

use std::sync::Arc;

use serde::Serialize;

/// Canonical backend credential headers (dual-token; the internal ingress
/// token is used when the backend surface requires internal-api routing).
const ACCESS_TOKEN_HEADER: &str = "Access-Token";
const AUTHORIZATION_HEADER: &str = "Authorization";

#[derive(Debug, Clone)]
pub struct CommerceIntegrationConfig {
    pub membership_backend_base_url: Option<String>,
    pub membership_backend_access_token: Option<String>,
    pub order_backend_base_url: Option<String>,
    pub order_backend_access_token: Option<String>,
}

impl CommerceIntegrationConfig {
    pub fn from_env() -> Self {
        Self {
            membership_backend_base_url: env("SDKWORK_MEMBERSHIP_BACKEND_API_BASE_URL"),
            membership_backend_access_token: env("SDKWORK_MEMBERSHIP_BACKEND_ACCESS_TOKEN"),
            order_backend_base_url: env("SDKWORK_ORDER_BACKEND_API_BASE_URL"),
            order_backend_access_token: env("SDKWORK_ORDER_BACKEND_ACCESS_TOKEN"),
        }
    }
}

fn env(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .filter(|value| !value.trim().is_empty())
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MembershipPackageRegistration {
    pub code: String,
    pub package_group_id: String,
    pub plan_id: String,
    pub name: String,
    pub price_amount: String,
    pub currency_code: String,
    pub duration_days: i64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisteredMembershipPackage {
    pub id: String,
    pub external_id: i64,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct CommerceIntegration {
    config: Arc<CommerceIntegrationConfig>,
    http: reqwest::Client,
}

impl CommerceIntegration {
    pub fn new(config: CommerceIntegrationConfig) -> Self {
        Self {
            config: Arc::new(config),
            http: reqwest::Client::new(),
        }
    }

    pub fn config(&self) -> &CommerceIntegrationConfig {
        &self.config
    }

    fn backend_headers(&self, access_token: &str) -> reqwest::header::HeaderMap {
        let mut headers = reqwest::header::HeaderMap::new();
        if let Ok(value) = reqwest::header::HeaderValue::from_str(access_token) {
            headers.insert(ACCESS_TOKEN_HEADER, value.clone());
            let bearer = format!("Bearer {access_token}");
            if let Ok(value) = reqwest::header::HeaderValue::from_str(&bearer) {
                headers.insert(AUTHORIZATION_HEADER, value);
            }
        }
        headers
    }

    /// Registers a purchasable membership package on the membership backend
    /// and returns the assigned external id (the `packageId` sdkwork-order
    /// resolves when creating a membership order).
    pub async fn register_membership_package(
        &self,
        registration: MembershipPackageRegistration,
    ) -> Result<RegisteredMembershipPackage, String> {
        let base_url = self
            .config
            .membership_backend_base_url
            .clone()
            .ok_or_else(|| {
                "membership backend is not configured (SDKWORK_MEMBERSHIP_BACKEND_API_BASE_URL)"
                    .to_owned()
            })?;
        let access_token = self
            .config
            .membership_backend_access_token
            .clone()
            .ok_or_else(|| {
                "membership backend credential is not configured (SDKWORK_MEMBERSHIP_BACKEND_ACCESS_TOKEN)"
                    .to_owned()
            })?;

        let url = format!(
            "{}/backend/v3/api/memberships/packages",
            base_url.trim_end_matches('/')
        );
        let response = self
            .http
            .post(&url)
            .headers(self.backend_headers(&access_token))
            .json(&registration)
            .send()
            .await
            .map_err(|error| format!("membership package registration request failed: {error}"))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!(
                "membership package registration rejected ({status}): {}",
                body.chars().take(300).collect::<String>()
            ));
        }

        let payload: serde_json::Value = response.json().await.map_err(|error| {
            format!("membership package registration response parse failed: {error}")
        })?;
        let item = payload.get("data").unwrap_or(&payload);
        let external_id = item
            .get("externalId")
            .or_else(|| item.get("external_id"))
            .and_then(|value| value.as_i64())
            .ok_or_else(|| {
                "membership package registration did not return externalId".to_owned()
            })?;
        Ok(RegisteredMembershipPackage {
            id: item
                .get("id")
                .and_then(|value| value.as_str())
                .unwrap_or_default()
                .to_owned(),
            external_id,
            name: item
                .get("name")
                .and_then(|value| value.as_str())
                .unwrap_or_default()
                .to_owned(),
        })
    }

    /// Verifies that an order has been paid by querying the order backend.
    /// Returns true only when the order status indicates a settled payment.
    pub async fn verify_order_paid(&self, order_id: &str) -> Result<bool, String> {
        let base_url = self.config.order_backend_base_url.clone().ok_or_else(|| {
            "order backend is not configured (SDKWORK_ORDER_BACKEND_API_BASE_URL)".to_owned()
        })?;
        let access_token = self
            .config
            .order_backend_access_token
            .clone()
            .ok_or_else(|| {
                "order backend credential is not configured (SDKWORK_ORDER_BACKEND_ACCESS_TOKEN)"
                    .to_owned()
            })?;

        let url = format!(
            "{}/backend/v3/api/orders/{}",
            base_url.trim_end_matches('/'),
            urlencode(order_id)
        );
        let response = self
            .http
            .get(&url)
            .headers(self.backend_headers(&access_token))
            .send()
            .await
            .map_err(|error| format!("order verification request failed: {error}"))?;

        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(false);
        }
        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!(
                "order verification rejected ({status}): {}",
                body.chars().take(300).collect::<String>()
            ));
        }

        let payload: serde_json::Value = response
            .json()
            .await
            .map_err(|error| format!("order verification response parse failed: {error}"))?;
        let item = payload.get("data").unwrap_or(&payload);
        let status = item
            .get("status")
            .and_then(|value| value.as_str())
            .unwrap_or_default();
        Ok(is_paid_order_status(status))
    }
}

fn urlencode(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(byte as char)
            }
            _ => {
                encoded.push_str(&format!("%{byte:02X}"));
            }
        }
    }
    encoded
}

/// Order statuses that indicate a settled, paid order (order backend uses
/// `paid` / `completed` style states; the app API payment-success query
/// reports `paid: true` for the same transitions).
fn is_paid_order_status(status: &str) -> bool {
    matches!(
        status,
        "paid"
            | "completed"
            | "settled"
            | "success"
            | "finished"
            | "payment_success"
            | "payment-success"
    )
}
