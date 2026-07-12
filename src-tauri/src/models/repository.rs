use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Repository {
    pub id: String,
    pub path: String,
    pub remote_url: Option<String>,
    pub current_account_id: Option<String>,
    pub current_account_name: Option<String>,
    pub provider: Option<String>,
    pub last_opened: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub changes: i64,
    pub staged: i64,
    pub unstaged: i64,
    pub is_clean: bool,
    pub ahead: i64,
    pub behind: i64,
}
