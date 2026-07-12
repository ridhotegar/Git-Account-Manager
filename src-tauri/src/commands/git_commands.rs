use crate::accounts::service::AccountService;
use crate::git::service::{GitService, GlobalGitConfig};
use crate::models::repository::GitStatus;
use crate::repository::service::RepositoryService;
use crate::services::AppState;
use tauri::State;

#[tauri::command]
pub fn switch_account(
    state: State<'_, AppState>,
    repo_path: String,
    account_id: String,
) -> Result<(), String> {
    let account = AccountService::get_by_id(&state.database, &account_id)
        .map_err(|e| e.to_string())?;

    // Set local git config for the repo
    GitService::switch_account(&repo_path, &account.display_name, &account.email)
        .map_err(|e| e.to_string())?;

    // Persist the account assignment in the database so it shows in real-time
    if let Err(e) = RepositoryService::assign_account_by_path(&state.database, &repo_path, &account_id) {
        tracing::warn!("Failed to persist repo account assignment: {}", e);
    }

    Ok(())
}

#[tauri::command]
pub fn get_git_status(repo_path: String) -> Result<GitStatus, String> {
    GitService::get_status(&repo_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn check_git_installation(state: State<'_, AppState>) -> Result<String, String> {
    GitService::check_installation(Some(&state.database)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn detect_git_config() -> Result<GlobalGitConfig, String> {
    GitService::detect_global_config().map_err(|e| e.to_string())
}
