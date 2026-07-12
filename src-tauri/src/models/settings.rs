use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub git_path: Option<String>,
    pub minimize_to_tray: bool,
    pub start_on_boot: bool,
    pub default_provider: String,
    pub github_client_id: Option<String>,
}
