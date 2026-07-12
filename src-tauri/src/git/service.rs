use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::repository::GitStatus;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::process::{Command, Stdio};

/// The global Git identity detected from `git config --global`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalGitConfig {
    pub name: Option<String>,
    pub email: Option<String>,
}


/// Service for interacting with the user's installed Git CLI.
/// Never implements Git internally — always delegates to the system Git.
pub struct GitService;

impl GitService {
    /// Get the git command path, respecting user-configured git path.
    fn git_command(database: Option<&Database>) -> String {
        if let Some(db) = database {
            if let Ok(settings) = crate::settings::service::SettingsService::get_all(db) {
                if let Some(git_path) = settings.git_path {
                    if !git_path.is_empty() {
                        return git_path;
                    }
                }
            }
        }
        "git".to_string()
    }

    /// Check if Git is installed and return its version.
    pub fn check_installation(database: Option<&Database>) -> AppResult<String> {
        let cmd = Self::git_command(database);
        let output = Command::new(&cmd)
            .arg("--version")
            .output()
            .map_err(|_| AppError::Git("Git is not installed or not found in PATH".into()))?;

        if !output.status.success() {
            return Err(AppError::Git("Git command failed".into()));
        }

        let version = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();

        Ok(version)
    }

    /// Detect the currently configured global Git identity.
    /// Reads `git config --global user.name` and `user.email`.
    pub fn detect_global_config() -> AppResult<GlobalGitConfig> {
        let name = Self::get_global_config("user.name")?;
        let email = Self::get_global_config("user.email")?;
        Ok(GlobalGitConfig { name, email })
    }

    /// Run `git config --global <key>` and return the value, or None if not set.
    fn get_global_config(key: &str) -> AppResult<Option<String>> {
        let output = Command::new("git")
            .args(["config", "--global", key])
            .output()?;

        if output.status.success() {
            let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Ok(Some(value))
        } else {
            Ok(None)
        }
    }

    /// Execute `git config --global` to set user name.
    pub fn set_user_name(name: &str) -> AppResult<()> {
        let output = Command::new("git")
            .args(["config", "--global", "user.name", name])
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Git(format!("Failed to set user.name: {}", stderr)));
        }

        Ok(())
    }

    /// Execute `git config --global` to set user email.
    pub fn set_user_email(email: &str) -> AppResult<()> {
        let output = Command::new("git")
            .args(["config", "--global", "user.email", email])
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Git(format!("Failed to set user.email: {}", stderr)));
        }

        Ok(())
    }

    /// Switch the Git identity in a specific repository.
    pub fn switch_account(repo_path: &str, name: &str, email: &str) -> AppResult<()> {
        let local_name = Command::new("git")
            .args(["-C", repo_path, "config", "user.name", name])
            .output()?;

        if !local_name.status.success() {
            let stderr = String::from_utf8_lossy(&local_name.stderr);
            return Err(AppError::Git(format!(
                "Failed to set local user.name: {}",
                stderr
            )));
        }

        let local_email = Command::new("git")
            .args(["-C", repo_path, "config", "user.email", email])
            .output()?;

        if !local_email.status.success() {
            let stderr = String::from_utf8_lossy(&local_email.stderr);
            return Err(AppError::Git(format!(
                "Failed to set local user.email: {}",
                stderr
            )));
        }

        Ok(())
    }

    /// Get the status of a Git repository.
    pub fn get_status(repo_path: &str) -> AppResult<GitStatus> {
        // Get current branch
        let branch_output = Command::new("git")
            .args(["-C", repo_path, "rev-parse", "--abbrev-ref", "HEAD"])
            .output()?;

        let branch = if branch_output.status.success() {
            String::from_utf8_lossy(&branch_output.stdout).trim().to_string()
        } else {
            "unknown".to_string()
        };

        // Get status --porcelain for change counts
        let status_output = Command::new("git")
            .args(["-C", repo_path, "status", "--porcelain"])
            .output()?;

        let status_text = if status_output.status.success() {
            String::from_utf8_lossy(&status_output.stdout).to_string()
        } else {
            String::new()
        };

        let staged = status_text
            .lines()
            .filter(|line| !line.is_empty() && !line.starts_with(|c: char| c.is_whitespace()))
            .count() as i64;

        let unstaged = status_text
            .lines()
            .filter(|line| line.starts_with(' ') || line.starts_with("?"))
            .count() as i64;

        let changes = staged + unstaged;
        let is_clean = changes == 0;

        // Get ahead/behind counts
        let rev_output = Command::new("git")
            .args(["-C", repo_path, "rev-list", "--left-right", "--count", "HEAD...@{u}"])
            .output();

        let (ahead, behind) = match rev_output {
            Ok(output) if output.status.success() => {
                let counts = String::from_utf8_lossy(&output.stdout);
                let parts: Vec<&str> = counts.trim().split('\t').collect();
                if parts.len() == 2 {
                    (
                        parts[0].parse::<i64>().unwrap_or(0),
                        parts[1].parse::<i64>().unwrap_or(0),
                    )
                } else {
                    (0, 0)
                }
            }
            _ => (0, 0),
        };

        Ok(GitStatus {
            branch,
            changes,
            staged,
            unstaged,
            is_clean,
            ahead,
            behind,
        })
    }

    /// Scan a directory for Git repositories.
    pub fn detect_repos(root_path: &str) -> AppResult<Vec<String>> {
        let mut repos = Vec::new();

        // Check if the root itself is a git repo
        let git_dir = std::path::Path::new(root_path).join(".git");
        if git_dir.exists() {
            repos.push(root_path.to_string());
            return Ok(repos);
        }

        // Scan immediate subdirectories
        if let Ok(entries) = std::fs::read_dir(root_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() && path.join(".git").exists() {
                    if let Some(path_str) = path.to_str() {
                        repos.push(path_str.to_string());
                    }
                }
            }
        }

        Ok(repos)
    }

    /// Get the remote origin URL for a repository.
    pub fn get_remote_url(repo_path: &str) -> AppResult<Option<String>> {
        let output = Command::new("git")
            .args(["-C", repo_path, "config", "--get", "remote.origin.url"])
            .output()?;

        if output.status.success() {
            let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Ok(Some(url))
        } else {
            Ok(None)
        }
    }

    /// Determine the Git provider from a remote URL.
    pub fn detect_provider(remote_url: &str) -> Option<String> {
        if remote_url.contains("github.com") {
            Some("github".to_string())
        } else if remote_url.contains("gitlab.com") {
            Some("gitlab".to_string())
        } else if remote_url.contains("bitbucket.org") {
            Some("bitbucket".to_string())
        } else {
            None
        }
    }

    /// Configure Git to use the given token for GitHub HTTPS authentication.
    /// This:
    /// 1. Ensures Git's credential helper is set (manager-core on Windows)
    /// 2. Clears any previously stored GitHub credentials
    /// 3. Stores the new token so `git push` works without prompts
    pub fn configure_github_credentials(username: &str, token: &str) -> AppResult<()> {
        // 1. Ensure a credential helper is configured
        let helper_check = Command::new("git")
            .args(["config", "--global", "credential.helper"])
            .output();

        let has_helper = helper_check
            .ok()
            .map(|o| o.status.success())
            .unwrap_or(false);

        if !has_helper {
            // On Windows, manager-core uses Windows Credential Manager
            let _ = Command::new("git")
                .args(["config", "--global", "credential.helper", "manager-core"])
                .output();
        }

        // 2. Clear any existing GitHub credentials
        let reject_input = "protocol=https\nhost=github.com\n\n";
        if let Ok(mut child) = Command::new("git")
            .args(["credential", "reject"])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
        {
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(reject_input.as_bytes());
            }
            let _ = child.wait();
        }

        // 3. Store the new credentials
        let approve_input = format!(
            "protocol=https\nhost=github.com\nusername={}\npassword={}\n\n",
            username, token
        );

        if let Ok(mut child) = Command::new("git")
            .args(["credential", "approve"])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
        {
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(approve_input.as_bytes());
            }
            if let Ok(status) = child.wait() {
                if status.success() {
                    tracing::info!(
                        "GitHub credentials configured for user: {}",
                        username
                    );
                }
            }
        }

        Ok(())
    }

    /// Clear all stored GitHub credentials from Git's credential helper.
    pub fn clear_github_credentials() -> AppResult<()> {
        let reject_input = "protocol=https\nhost=github.com\n\n";
        if let Ok(mut child) = Command::new("git")
            .args(["credential", "reject"])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
        {
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(reject_input.as_bytes());
            }
            let _ = child.wait();
        }
        Ok(())
    }
}
