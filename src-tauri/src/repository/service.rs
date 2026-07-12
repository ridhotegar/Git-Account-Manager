use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::repository::Repository;
use chrono::Utc;
use uuid::Uuid;

pub struct RepositoryService;

impl RepositoryService {
    /// Get all tracked repositories.
    pub fn get_all(database: &Database) -> AppResult<Vec<Repository>> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let mut stmt = conn.prepare(
            "SELECT r.id, r.path, r.remote_url, r.current_account_id,
                    a.display_name as current_account_name,
                    r.provider, r.last_opened, r.created_at
             FROM repositories r
             LEFT JOIN accounts a ON r.current_account_id = a.id
             ORDER BY r.last_opened DESC NULLS LAST",
        )?;

        let repos = stmt
            .query_map([], |row| {
                Ok(Repository {
                    id: row.get(0)?,
                    path: row.get(1)?,
                    remote_url: row.get(2)?,
                    current_account_id: row.get(3)?,
                    current_account_name: row.get(4)?,
                    provider: row.get(5)?,
                    last_opened: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(repos)
    }

    /// Scan a directory and add it as a tracked repository.
    pub fn scan_path(database: &Database, path: &str) -> AppResult<Repository> {
        let git_dir = std::path::Path::new(path).join(".git");
        if !git_dir.exists() {
            return Err(AppError::Validation(format!(
                "Not a Git repository: {}",
                path
            )));
        }

        // Get remote URL
        let remote_url = crate::git::service::GitService::get_remote_url(path).ok().flatten();

        // Detect provider from remote URL
        let provider = remote_url
            .as_ref()
            .and_then(|url| crate::git::service::GitService::detect_provider(url));

        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        conn.execute(
            "INSERT INTO repositories (id, path, remote_url, provider, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(path) DO UPDATE SET
                remote_url = excluded.remote_url,
                provider = excluded.provider",
            rusqlite::params![id, path, remote_url, provider, now],
        )?;

        drop(conn);
        let repos = Self::get_all(database)?;
        repos
            .into_iter()
            .find(|r| r.path == path)
            .ok_or_else(|| AppError::Unknown("Failed to retrieve scanned repository".into()))
    }

    /// Get a single repository by ID.
    pub fn get_by_id(database: &Database, id: &str) -> AppResult<Repository> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let mut stmt = conn.prepare(
            "SELECT r.id, r.path, r.remote_url, r.current_account_id,
                    a.display_name as current_account_name,
                    r.provider, r.last_opened, r.created_at
             FROM repositories r
             LEFT JOIN accounts a ON r.current_account_id = a.id
             WHERE r.id = ?1",
        )?;

        let repo = stmt
            .query_row([id], |row| {
                Ok(Repository {
                    id: row.get(0)?,
                    path: row.get(1)?,
                    remote_url: row.get(2)?,
                    current_account_id: row.get(3)?,
                    current_account_name: row.get(4)?,
                    provider: row.get(5)?,
                    last_opened: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })
            .map_err(|_| AppError::NotFound(format!("Repository {} not found", id)))?;

        Ok(repo)
    }

    /// Update the repository's assigned account by ID.
    pub fn assign_account(database: &Database, repo_id: &str, account_id: &str) -> AppResult<()> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        conn.execute(
            "UPDATE repositories SET current_account_id = ?1 WHERE id = ?2",
            rusqlite::params![account_id, repo_id],
        )?;

        Ok(())
    }

    /// Delete a tracked repository from the database.
    pub fn delete(database: &Database, id: &str) -> AppResult<()> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let affected = conn.execute("DELETE FROM repositories WHERE id = ?1", [id])?;
        if affected == 0 {
            return Err(AppError::NotFound(format!("Repository {} not found", id)));
        }

        Ok(())
    }

    /// Permanently delete the local folder from disk.
    pub fn delete_local_folder(path: &str) -> AppResult<()> {
        let dir = std::path::Path::new(path);
        if !dir.exists() {
            return Ok(());
        }
        std::fs::remove_dir_all(dir).map_err(|e| {
            AppError::Io(e)
        })?;
        tracing::info!("Deleted local folder: {}", path);
        Ok(())
    }

    /// Delete the repository on GitHub/GitLab via their API.
    /// Requires the repo to have a remote URL and an account with a stored token.
    pub async fn delete_remote_repo(database: &Database, repo_id: &str) -> AppResult<()> {
        let repo = Self::get_by_id(database, repo_id)?;

        let remote_url = repo.remote_url.ok_or_else(|| {
            AppError::Validation("No remote URL configured for this repository".into())
        })?;

        let account_id = repo.current_account_id.ok_or_else(|| {
            AppError::Validation("No account assigned to this repository".into())
        })?;

        let account = crate::accounts::service::AccountService::get_by_id(database, &account_id)?;

        let token_ref = account.token_reference.ok_or_else(|| {
            AppError::Validation("Assigned account has no stored token".into())
        })?;

        let token = crate::credential::service::CredentialService::get_github_token(&token_ref)?;

        // Parse owner/repo from the remote URL
        let (owner, repo_name) = Self::parse_remote_url(&remote_url)?;

        let api_url = match account.provider.as_str() {
            "github" => format!("https://api.github.com/repos/{}/{}", owner, repo_name),
            "gitlab" => format!("https://gitlab.com/api/v4/projects/{}/{}%2F{}",
                owner, owner, repo_name),
            _ => return Err(AppError::Validation(format!(
                "Remote delete not supported for provider: {}", account.provider
            ))),
        };

        let client = reqwest::Client::new();
        let response = client
            .delete(&api_url)
            .header("Authorization", format!("Bearer {}", token))
            .header("User-Agent", "GitAccountManager/0.1.0")
            .send()
            .await
            .map_err(|e| AppError::Oauth(format!("Failed to contact remote API: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(AppError::Oauth(format!(
                "Remote API returned {}: {}", status, body
            )));
        }

        tracing::info!("Deleted remote repository: {}/{}", owner, repo_name);
        Ok(())
    }

    /// Parse `owner/repo` from a Git remote URL.
    /// Supports HTTPS (https://github.com/owner/repo.git) and SSH (git@github.com:owner/repo.git).
    fn parse_remote_url(url: &str) -> AppResult<(String, String)> {
        let cleaned = url.trim_end_matches(".git");

        if let Some(pos) = cleaned.find("://") {
            // HTTPS format: https://github.com/owner/repo
            let after_proto = &cleaned[pos + 3..];
            // Skip the hostname (github.com/)
            if let Some(slash_pos) = after_proto.find('/') {
                let path = &after_proto[slash_pos + 1..];
                if let Some(slash_pos) = path.find('/') {
                    let owner = &path[..slash_pos];
                    let repo = &path[slash_pos + 1..];
                    if !owner.is_empty() && !repo.is_empty() {
                        return Ok((owner.to_string(), repo.to_string()));
                    }
                }
            }
        } else if let Some(pos) = cleaned.find('@') {
            // SSH format: git@github.com:owner/repo
            let after_at = &cleaned[pos + 1..];
            if let Some(colon_pos) = after_at.find(':') {
                let path = &after_at[colon_pos + 1..];
                if let Some(slash_pos) = path.find('/') {
                    let owner = &path[..slash_pos];
                    let repo = &path[slash_pos + 1..];
                    if !owner.is_empty() && !repo.is_empty() {
                        return Ok((owner.to_string(), repo.to_string()));
                    }
                }
            }
        }

        Err(AppError::Validation(format!(
            "Could not parse owner/repo from remote URL: {}", url
        )))
    }

    /// Update the repository's assigned account by file path.
    /// This is used by the switch_account command which only has the repo path.
    pub fn assign_account_by_path(
        database: &Database,
        repo_path: &str,
        account_id: &str,
    ) -> AppResult<()> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let affected = conn.execute(
            "UPDATE repositories SET current_account_id = ?1 WHERE path = ?2",
            rusqlite::params![account_id, repo_path],
        )?;

        if affected == 0 {
            tracing::warn!(
                "No repository found at path: {} — account assignment not persisted",
                repo_path
            );
        }

        Ok(())
    }
}
