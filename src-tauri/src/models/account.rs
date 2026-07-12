use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub provider: String,
    pub display_name: String,
    pub username: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub token_reference: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAccountInput {
    pub provider: String,
    pub display_name: String,
    pub username: String,
    pub email: String,
    pub token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAccountInput {
    pub display_name: Option<String>,
    pub username: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
}
