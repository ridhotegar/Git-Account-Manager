pub mod schema;

use rusqlite::Connection;
use std::sync::Mutex;

pub struct Database {
    pub connection: Mutex<Connection>,
}

impl Database {
    pub fn new(connection: Connection) -> Self {
        Self {
            connection: Mutex::new(connection),
        }
    }
}

/// Initialize the SQLite database and run migrations.
pub fn init_database() -> Result<Database, rusqlite::Error> {
    let db_path = get_database_path();
    let connection = Connection::open(&db_path)?;

    // Enable WAL mode for better concurrent performance
    connection.execute_batch("PRAGMA journal_mode=WAL;")?;
    connection.execute_batch("PRAGMA foreign_keys=ON;")?;

    // Run schema migrations
    schema::run_migrations(&connection)?;

    tracing::info!("Database initialized at: {:?}", db_path);
    Ok(Database::new(connection))
}

/// Get the path for the SQLite database file.
fn get_database_path() -> std::path::PathBuf {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("git-account-manager");

    std::fs::create_dir_all(&data_dir).ok();
    data_dir.join("database.sqlite")
}
