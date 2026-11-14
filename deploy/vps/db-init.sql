\getenv migration_password DB_MIGRATION_PASSWORD
\getenv app_password DB_APP_PASSWORD
CREATE ROLE brewlite_migrator LOGIN PASSWORD :'migration_password';
CREATE ROLE brewlite_app LOGIN PASSWORD :'app_password';
ALTER DATABASE brewlite OWNER TO brewlite_migrator;
ALTER SCHEMA public OWNER TO brewlite_migrator;
GRANT CONNECT ON DATABASE brewlite TO brewlite_app;
GRANT USAGE ON SCHEMA public TO brewlite_app;
ALTER DEFAULT PRIVILEGES FOR ROLE brewlite_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO brewlite_app;
ALTER DEFAULT PRIVILEGES FOR ROLE brewlite_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO brewlite_app;
