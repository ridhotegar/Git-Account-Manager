use crate::errors::{AppError, AppResult};
use serde::Deserialize;

const GITHUB_API_URL: &str = "https://api.github.com/user";
const USER_AGENT: &str = "GitAccountManager/0.1.0";

/// Minimal GitHub service used only for verifying Personal Access Tokens
/// via the GitHub API. The OAuth Device Flow has been removed.
pub struct OAuthService;

impl OAuthService {
    /// Fetch the authenticated user's GitHub profile using a Personal Access Token.
    pub async fn fetch_user_profile(token: &str) -> AppResult<GitHubUser> {
        let client = reqwest::Client::new();
        let response = client
            .get(GITHUB_API_URL)
            .header("Authorization", format!("Bearer {}", token))
            .header("User-Agent", USER_AGENT)
            .send()
            .await
            .map_err(|e| {
                AppError::Oauth(format!("Failed to fetch GitHub profile: {}", e))
            })?;

        if !response.status().is_success() {
            return Err(AppError::Oauth(format!(
                "GitHub API returned {} — check that your token is valid and has 'repo' + 'user' scopes",
                response.status()
            )));
        }

        let user: GitHubUser = response.json().await.map_err(|e| {
            AppError::Oauth(format!("Failed to parse GitHub response: {}", e))
        })?;

        Ok(user)
    }
}

/// GitHub user profile returned by the /user endpoint.
#[derive(Debug, Deserialize)]
pub struct GitHubUser {
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: String,
}
