use crate::errors::{AppError, AppResult};

const SERVICE_NAME: &str = "Git Account Manager";

/// Service for managing secrets in OS-native credential storage.
///
/// - Windows: Credential Manager
/// - macOS: Keychain
/// - Linux: Secret Service (libsecret)
pub struct CredentialService;

impl CredentialService {
    /// Store a secret in the OS credential manager.
    pub fn store(account: &str, secret: &str) -> AppResult<()> {
        let entry = keyring::Entry::new(SERVICE_NAME, account)?;
        entry.set_secret(secret.as_bytes())?;
        tracing::info!("Secret stored for account: {}", account);
        Ok(())
    }

    /// Retrieve a secret from the OS credential manager.
    pub fn get(account: &str) -> AppResult<String> {
        let entry = keyring::Entry::new(SERVICE_NAME, account)?;
        let secret_bytes = entry.get_secret()?;
        let secret = String::from_utf8(secret_bytes)
            .map_err(|e| AppError::Credential(format!("Invalid UTF-8 in secret: {}", e)))?;
        Ok(secret)
    }

    /// Delete a secret from the OS credential manager.
    pub fn delete(account: &str) -> AppResult<()> {
        let entry = keyring::Entry::new(SERVICE_NAME, account)?;
        entry.delete_credential()?;
        tracing::info!("Secret deleted for account: {}", account);
        Ok(())
    }

    /// Store a GitHub OAuth token.
    pub fn store_github_token(username: &str, token: &str) -> AppResult<String> {
        let key = format!("github_token_{}", username);
        Self::store(&key, token)?;
        Ok(key)
    }

    /// Get a stored GitHub OAuth token.
    pub fn get_github_token(reference: &str) -> AppResult<String> {
        Self::get(reference)
    }

}
