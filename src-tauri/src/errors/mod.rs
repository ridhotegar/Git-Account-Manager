use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Git error: {0}")]
    Git(String),

    #[error("SSH error: {0}")]
    Ssh(String),

    #[error("OAuth error: {0}")]
    Oauth(String),

    #[error("Credential error: {0}")]
    Credential(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}

impl From<keyring::Error> for AppError {
    fn from(error: keyring::Error) -> Self {
        AppError::Credential(error.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
