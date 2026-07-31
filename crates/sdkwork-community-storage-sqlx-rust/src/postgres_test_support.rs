use sdkwork_database_config::{DatabaseConfig, DatabaseEngine};
use sdkwork_database_sqlx::{DatabasePool, PoolContext};
use sdkwork_utils_rust::uuid;
use sqlx::postgres::PgPoolOptions;

const POSTGRES_TEST_URL_ENV: &str = "SDKWORK_DATABASE_TEST_POSTGRES_URL";

pub struct PostgresTestDatabase {
    pool: DatabasePool,
    admin_pool: sqlx::PgPool,
    schema: String,
}

impl PostgresTestDatabase {
    pub async fn from_env() -> Result<Option<Self>, String> {
        let url = match std::env::var(POSTGRES_TEST_URL_ENV) {
            Ok(value) if !value.trim().is_empty() => value,
            _ => return Ok(None),
        };
        if !matches!(
            DatabaseEngine::from_url(&url),
            Some(DatabaseEngine::Postgres)
        ) {
            return Err(format!(
                "{POSTGRES_TEST_URL_ENV} must contain a PostgreSQL URL"
            ));
        }

        let schema = format!("community_test_{}", uuid().replace('-', ""));
        if !schema
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_')
        {
            return Err("generated PostgreSQL test schema is not a safe identifier".to_owned());
        }

        let admin_pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&url)
            .await
            .map_err(|error| {
                format!("connect disposable PostgreSQL test database failed: {error}")
            })?;
        sqlx::query(&format!("CREATE SCHEMA \"{schema}\""))
            .execute(&admin_pool)
            .await
            .map_err(|error| format!("create isolated PostgreSQL test schema failed: {error}"))?;

        let connection_schema = schema.clone();
        let postgres_pool = PgPoolOptions::new()
            .max_connections(4)
            .after_connect(move |connection, _metadata| {
                let statement = format!("SET search_path TO \"{connection_schema}\"");
                Box::pin(async move {
                    sqlx::query(&statement).execute(connection).await?;
                    Ok(())
                })
            })
            .connect(&url)
            .await
            .map_err(|error| format!("connect isolated PostgreSQL test pool failed: {error}"))?;
        let config = DatabaseConfig {
            engine: DatabaseEngine::Postgres,
            url,
            max_connections: 4,
            ..Default::default()
        };

        Ok(Some(Self {
            pool: DatabasePool::Postgres(postgres_pool, PoolContext { config }),
            admin_pool,
            schema,
        }))
    }

    pub fn pool(&self) -> DatabasePool {
        self.pool.clone()
    }

    pub async fn close(self) -> Result<(), String> {
        self.pool.close().await;
        let drop_result = sqlx::query(&format!("DROP SCHEMA \"{}\" CASCADE", self.schema))
            .execute(&self.admin_pool)
            .await
            .map_err(|error| format!("drop isolated PostgreSQL test schema failed: {error}"));
        self.admin_pool.close().await;
        drop_result.map(|_| ())
    }
}
