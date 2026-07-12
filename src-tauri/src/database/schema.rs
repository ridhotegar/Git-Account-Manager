use rusqlite::Connection;

/// Run all database migrations in order.
pub fn run_migrations(connection: &Connection) -> Result<(), rusqlite::Error> {
    // Create migrations tracking table
    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )?;

    // Check and run each migration
    let migrations: Vec<(&str, &str)> = vec![
        ("001_initial_schema", INITIAL_SCHEMA),
    ];

    for (name, sql) in migrations {
        let already_applied: bool = connection
            .query_row(
                "SELECT COUNT(*) > 0 FROM _migrations WHERE name = ?1",
                [name],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !already_applied {
            tracing::info!("Applying migration: {}", name);
            connection.execute_batch(sql)?;
            connection.execute(
                "INSERT INTO _migrations (name) VALUES (?1)",
                [name],
            )?;
        }
    }

    Ok(())
}

const INITIAL_SCHEMA: &str = "
    -- Accounts table
    CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL CHECK(provider IN ('github', 'gitlab', 'bitbucket', 'custom')),
        display_name TEXT NOT NULL,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        avatar_url TEXT,
        token_reference TEXT,
        ssh_key_reference TEXT,
        is_active INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Repositories table
    CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        remote_url TEXT,
        current_account_id TEXT,
        provider TEXT,
        last_opened TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (current_account_id) REFERENCES accounts(id) ON DELETE SET NULL
    );

    -- SSH Keys table
    CREATE TABLE IF NOT EXISTS ssh_keys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        public_key TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    -- Activity Logs table
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        account_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
    );

    -- Insert default settings if not exist
    INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'system');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('git_path', '');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('minimize_to_tray', 'true');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('start_on_boot', 'false');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('default_provider', 'github');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('github_client_id', '');
";
