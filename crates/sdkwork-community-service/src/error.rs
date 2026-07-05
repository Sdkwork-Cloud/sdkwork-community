#[derive(Debug, thiserror::Error)]
pub enum CommunityServiceError {
    #[error("validation: {0}")]
    Validation(String),
    #[error("not-found: {0}")]
    NotFound(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("unauthorized: {0}")]
    Unauthorized(String),
    #[error("storage: {0}")]
    Storage(String),
}

impl CommunityServiceError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::Validation(_) => "validation",
            Self::NotFound(_) => "not-found",
            Self::Conflict(_) => "conflict",
            Self::Unauthorized(_) => "unauthorized",
            Self::Storage(_) => "internal",
        }
    }

    pub fn message(&self) -> &str {
        match self {
            Self::Validation(message)
            | Self::NotFound(message)
            | Self::Conflict(message)
            | Self::Unauthorized(message)
            | Self::Storage(message) => message,
        }
    }
}
