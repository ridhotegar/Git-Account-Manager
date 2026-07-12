use crate::accounts::service::AccountService;
use crate::credential::service::CredentialService;
use crate::git::service::GitService;
use crate::models::account::{Account, CreateAccountInput, UpdateAccountInput};
use crate::services::AppState;
use tauri::State;

#[tauri::command]
pub fn get_accounts(state: State<'_, AppState>) -> Result<Vec<Account>, String> {
    AccountService::get_all(&state.database).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_account(
    state: State<'_, AppState>,
    data: CreateAccountInput,
) -> Result<Account, String> {
    AccountService::create(&state.database, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_account(
    state: State<'_, AppState>,
    id: String,
    data: UpdateAccountInput,
) -> Result<Account, String> {
    AccountService::update(&state.database, &id, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_account(state: State<'_, AppState>, id: String) -> Result<(), String> {
    AccountService::delete(&state.database, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_active_account(state: State<'_, AppState>, id: String) -> Result<Account, String> {
    AccountService::set_active(&state.database, &id).map_err(|e| e.to_string())
}

/// Set an account as the active global Git identity.
/// This updates the database AND runs `git config --global` to apply
/// the account's name and email system-wide.
#[tauri::command]
pub fn set_global_active_account(
    state: State<'_, AppState>,
    id: String,
) -> Result<Account, String> {
    // Fetch the account first
    let account = AccountService::get_by_id(&state.database, &id)
        .map_err(|e| e.to_string())?;

    // Set as active in the database
    let updated = AccountService::set_active(&state.database, &id)
        .map_err(|e| e.to_string())?;

    // Apply the identity globally via git config
    if let Err(e) = GitService::set_user_name(&account.display_name) {
        tracing::warn!("Failed to set global user.name: {}", e);
    }
    if let Err(e) = GitService::set_user_email(&account.email) {
        tracing::warn!("Failed to set global user.email: {}", e);
    }

    // Configure Git credentials so push authentication works with this account
    // Only for GitHub accounts — other providers use different auth methods
    if account.provider == "github" {
        if let Some(token_ref) = &account.token_reference {
            match CredentialService::get_github_token(token_ref) {
                Ok(token) => {
                    if let Err(e) = GitService::configure_github_credentials(&account.username, &token) {
                        tracing::warn!("Failed to configure GitHub credentials: {}", e);
                    }
                }
                Err(e) => {
                    tracing::warn!(
                        "Could not retrieve token for credential config: {}",
                        e
                    );
                }
            }
        }
    }

    tracing::info!("Global Git identity set to: {} <{}>", account.display_name, account.email);

    Ok(updated)
}
