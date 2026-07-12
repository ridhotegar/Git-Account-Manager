/// Returns `true` if the app was built in portable mode
/// (e.g., `cargo tauri build --features portable`).
/// Portable mode disables installer-specific and system-integration features
/// such as "Start on Boot" and auto-start registration.
#[cfg(feature = "portable")]
#[tauri::command]
pub fn is_portable() -> bool {
    true
}

/// Non-portable builds always return false.
#[cfg(not(feature = "portable"))]
#[tauri::command]
pub fn is_portable() -> bool {
    false
}
