use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::account::{Account, CreateAccountInput, UpdateAccountInput};
use chrono::Utc;
use uuid::Uuid;

pub struct AccountService;

impl AccountService {
    pub fn get_all(database: &Database) -> AppResult<Vec<Account>> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let mut stmt = conn.prepare(
            "SELECT id, provider, display_name, username, email, avatar_url,
                    token_reference, is_active, created_at, updated_at
             FROM accounts
             ORDER BY created_at DESC",
        )?;

        let accounts = stmt
            .query_map([], |row| {
                Ok(Account {
                    id: row.get(0)?,
                    provider: row.get(1)?,
                    display_name: row.get(2)?,
                    username: row.get(3)?,
                    email: row.get(4)?,
                    avatar_url: row.get(5)?,
                    token_reference: row.get(6)?,
                    is_active: row.get::<_, i32>(7)? != 0,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(accounts)
    }

    pub fn get_by_id(database: &Database, id: &str) -> AppResult<Account> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let account = conn
            .query_row(
                "SELECT id, provider, display_name, username, email, avatar_url,
                        token_reference, is_active, created_at, updated_at
                 FROM accounts WHERE id = ?1",
                [id],
                |row| {
                    Ok(Account {
                        id: row.get(0)?,
                        provider: row.get(1)?,
                        display_name: row.get(2)?,
                        username: row.get(3)?,
                        email: row.get(4)?,
                        avatar_url: row.get(5)?,
                        token_reference: row.get(6)?,
                        is_active: row.get::<_, i32>(7)? != 0,
                        created_at: row.get(8)?,
                        updated_at: row.get(9)?,
                    })
                },
            )
            .map_err(|_| AppError::NotFound(format!("Account {} not found", id)))?;

        Ok(account)
    }

    pub fn create(database: &Database, input: CreateAccountInput) -> AppResult<Account> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO accounts (id, provider, display_name, username, email, avatar_url, token_reference, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                id,
                input.provider,
                input.display_name,
                input.username,
                input.email,
                None::<String>,
                input.token,
                now,
                now
            ],
        )?;

        Ok(Account {
            id,
            provider: input.provider,
            display_name: input.display_name,
            username: input.username,
            email: input.email,
            avatar_url: None,
            token_reference: input.token,
            is_active: false,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update(database: &Database, id: &str, input: UpdateAccountInput) -> AppResult<Account> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let now = Utc::now().to_rfc3339();

        if let Some(name) = &input.display_name {
            conn.execute(
                "UPDATE accounts SET display_name = ?1, updated_at = ?2 WHERE id = ?3",
                rusqlite::params![name, now, id],
            )?;
        }

        if let Some(username) = &input.username {
            conn.execute(
                "UPDATE accounts SET username = ?1, updated_at = ?2 WHERE id = ?3",
                rusqlite::params![username, now, id],
            )?;
        }

        if let Some(email) = &input.email {
            conn.execute(
                "UPDATE accounts SET email = ?1, updated_at = ?2 WHERE id = ?3",
                rusqlite::params![email, now, id],
            )?;
        }

        if let Some(avatar) = &input.avatar_url {
            conn.execute(
                "UPDATE accounts SET avatar_url = ?1, updated_at = ?2 WHERE id = ?3",
                rusqlite::params![avatar, now, id],
            )?;
        }

        drop(conn);
        Self::get_by_id(database, id)
    }

    pub fn delete(database: &Database, id: &str) -> AppResult<()> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let affected = conn.execute("DELETE FROM accounts WHERE id = ?1", [id])?;
        if affected == 0 {
            return Err(AppError::NotFound(format!("Account {} not found", id)));
        }

        Ok(())
    }

    pub fn set_active(database: &Database, id: &str) -> AppResult<Account> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        // Deactivate all accounts first
        conn.execute("UPDATE accounts SET is_active = 0", [])?;

        // Activate the target account
        let now = Utc::now().to_rfc3339();
        let affected = conn.execute(
            "UPDATE accounts SET is_active = 1, updated_at = ?1 WHERE id = ?2",
            rusqlite::params![now, id],
        )?;

        if affected == 0 {
            return Err(AppError::NotFound(format!("Account {} not found", id)));
        }

        drop(conn);
        Self::get_by_id(database, id)
    }

    pub fn get_active(database: &Database) -> AppResult<Option<Account>> {
        let conn = database.connection.lock().map_err(|e| {
            AppError::Unknown(format!("Failed to acquire database lock: {}", e))
        })?;

        let result = conn.query_row(
            "SELECT id, provider, display_name, username, email, avatar_url,                        token_reference, is_active, created_at, updated_at
                 FROM accounts WHERE is_active = 1 LIMIT 1",
            [],
            |row| {
                Ok(Account {
                    id: row.get(0)?,
                    provider: row.get(1)?,
                    display_name: row.get(2)?,
                    username: row.get(3)?,
                    email: row.get(4)?,
                    avatar_url: row.get(5)?,
                    token_reference: row.get(6)?,
                    is_active: row.get::<_, i32>(7)? != 0,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        );

        match result {
            Ok(account) => Ok(Some(account)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(AppError::Database(e)),
        }
    }
}
