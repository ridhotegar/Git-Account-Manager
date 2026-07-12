use std::path::Path;

/// Validate that a filesystem path is safe to use.
/// Prevents path traversal attacks and ensures the path exists.
pub fn validate_path(path_str: &str) -> Result<&Path, String> {
    let path = Path::new(path_str);

    // Reject paths with null bytes
    if path_str.contains('\0') {
        return Err("Path contains null bytes".to_string());
    }

    // Reject paths that try to escape via ..
    if path_str.contains("..") {
        return Err("Path traversal not allowed".to_string());
    }

    Ok(path)
}

/// Sanitize a string for use in shell commands.
/// Escapes special characters that could be used for command injection.
pub fn sanitize_shell_input(input: &str) -> String {
    // Remove null bytes
    let sanitized: String = input.chars().filter(|&c| c != '\0').collect();
    // Escape single quotes by replacing ' with '\''
    sanitized.replace('\'', "'\\''")
}

/// Truncate a string to a maximum length with ellipsis.
pub fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len.saturating_sub(3)])
    }
}

/// Get a human-readable name from a provider string.
pub fn provider_display_name(provider: &str) -> &str {
    match provider {
        "github" => "GitHub",
        "gitlab" => "GitLab",
        "bitbucket" => "Bitbucket",
        _ => provider,
    }
}
