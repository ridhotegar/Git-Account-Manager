use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::settings::AppSettings;

pub struct SettingsService;

impl SettingsService {
    /// Get all application settings.
    pub fn get_all(database: &Database) -> AppResult<AppSettings> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
        let rows: Vec<(String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<Result<Vec<_>, _>>()?;

        let mut settings = AppSettings {
            theme: "system".to_string(),
            git_path: None,
            minimize_to_tray: true,
            start_on_boot: false,
            default_provider: "github".to_string(),
            github_client_id: None,
        };

        for (key, value) in rows {
            match key.as_str() {
                "theme" => settings.theme = value,
                "git_path" => {
                    settings.git_path = if value.is_empty() { None } else { Some(value) }
                }
                "minimize_to_tray" => settings.minimize_to_tray = value == "true",
                "start_on_boot" => settings.start_on_boot = value == "true",
                "default_provider" => settings.default_provider = value,
                "github_client_id" => {
                    settings.github_client_id = if value.is_empty() { None } else { Some(value) }
                }
                _ => {}
            }
        }

        Ok(settings)
    }

    /// Update a single setting.
    pub fn update(database: &Database, key: &str, value: &str) -> AppResult<()> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            rusqlite::params![key, value],
        )?;

        Ok(())
    }

    /// Update multiple settings at once.
    pub fn update_batch(database: &Database, settings: AppSettings) -> AppResult<AppSettings> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let updates = vec![
            ("theme", settings.theme.clone()),
            (
                "git_path",
                settings.git_path.clone().unwrap_or_default(),
            ),
            (
                "minimize_to_tray",
                settings.minimize_to_tray.to_string(),
            ),
            ("start_on_boot", settings.start_on_boot.to_string()),
            (
                "default_provider",
                settings.default_provider.clone(),
            ),
            (
                "github_client_id",
                settings.github_client_id.clone().unwrap_or_default(),
            ),
        ];

        for (key, value) in updates {
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?1, ?2)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                rusqlite::params![key, value],
            )?;
        }

        Ok(settings)
    }
}
