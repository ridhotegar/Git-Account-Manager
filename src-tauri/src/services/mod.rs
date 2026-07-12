use crate::database::Database;

/// Application state that is shared across all Tauri commands.
/// Uses dependency injection pattern for all services.
pub struct AppState {
    pub database: Database,
}

impl AppState {
    pub fn new(database: Database) -> Self {
        Self { database }
    }
}
