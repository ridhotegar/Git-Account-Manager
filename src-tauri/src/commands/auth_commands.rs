use crate::credential::service::CredentialService;
use crate::oauth::service::OAuthService;
use serde::Serialize;

/// Result of verifying and storing a GitHub personal access token.
#[derive(Debug, Clone, Serialize)]
pub struct VerifiedTokenResult {
    pub login: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: String,
    pub token_reference: String,
}

/// Store an access token for any provider in the OS credential manager.
/// Returns the token reference key to use when creating an account.
#[tauri::command]
pub fn store_credential(
    provider: String,
    username: String,
    token: String,
) -> Result<String, String> {
    let key = format!("{}_token_{}", provider, username);
    CredentialService::store(&key, &token).map_err(|e| e.to_string())?;
    tracing::info!("Token stored for {} user {}", provider, username);
    Ok(key)
}

/// Verify a GitHub Personal Access Token against the GitHub API and store it
/// in the OS credential manager. Returns the authenticated user's info.
#[tauri::command]
pub async fn verify_and_store_github_token(
    token: String,
) -> Result<VerifiedTokenResult, String> {
    // Verify the token by fetching the user's GitHub profile
    let user = OAuthService::fetch_user_profile(&token)
        .await
        .map_err(|e| {
            format!(
                "Token verification failed: {}. Make sure it's a valid GitHub Personal Access Token with 'repo' and 'user' scopes.",
                e
            )
        })?;

    // Store the token in the OS credential manager
    let token_ref = CredentialService::store_github_token(&user.login, &token)
        .map_err(|e| format!("Failed to store token securely: {}", e))?;

    tracing::info!("GitHub token verified and stored for user: {}", user.login);

    Ok(VerifiedTokenResult {
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        token_reference: token_ref,
    })
}
