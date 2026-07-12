pub mod accounts;
pub mod commands;
pub mod credential;
pub mod database;
pub mod errors;
pub mod git;
pub mod models;
pub mod oauth;
pub mod repository;
pub mod services;
pub mod settings;
pub mod utils;

use services::AppState;
use tracing_subscriber::EnvFilter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    // Initialize database
    let database = database::init_database()
        .expect("Failed to initialize database");

    let app_state = AppState::new(database);

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::account_commands::get_accounts,
            commands::account_commands::create_account,
            commands::account_commands::update_account,
            commands::account_commands::delete_account,
            commands::account_commands::set_active_account,
            commands::account_commands::set_global_active_account,
            commands::repository_commands::get_repositories,
            commands::repository_commands::scan_repository,
            commands::repository_commands::delete_repository,
            commands::repository_commands::delete_repo_folder,
            commands::repository_commands::delete_remote_repo,
            commands::git_commands::switch_account,
            commands::git_commands::get_git_status,
            commands::git_commands::check_git_installation,
            commands::portable_commands::is_portable,
            commands::settings_commands::get_settings,
            commands::settings_commands::update_settings,
            commands::auth_commands::verify_and_store_github_token,
            commands::auth_commands::store_credential,
            commands::git_commands::detect_git_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Git Account Manager");
}
