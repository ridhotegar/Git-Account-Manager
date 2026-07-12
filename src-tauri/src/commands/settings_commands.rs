use crate::models::settings::AppSettings;
use crate::services::AppState;
use crate::settings::service::SettingsService;
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    SettingsService::get_all(&state.database).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_settings(
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    SettingsService::update_batch(&state.database, settings).map_err(|e| e.to_string())
}
