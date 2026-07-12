use crate::models::repository::Repository;
use crate::repository::service::RepositoryService;
use crate::services::AppState;
use tauri::State;

#[tauri::command]
pub fn get_repositories(state: State<'_, AppState>) -> Result<Vec<Repository>, String> {
    RepositoryService::get_all(&state.database).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn scan_repository(
    state: State<'_, AppState>,
    path: String,
) -> Result<Repository, String> {
    RepositoryService::scan_path(&state.database, &path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_repository(state: State<'_, AppState>, id: String) -> Result<(), String> {
    RepositoryService::delete(&state.database, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_repo_folder(path: String) -> Result<(), String> {
    RepositoryService::delete_local_folder(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_remote_repo(state: State<'_, AppState>, repo_id: String) -> Result<(), String> {
    RepositoryService::delete_remote_repo(&state.database, &repo_id)
        .await
        .map_err(|e| e.to_string())
}
