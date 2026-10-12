# Database files

- `snapshots/` contains the legacy SQL snapshot, including its seed records.
- `migrations/` contains repeatable schema or catalog changes.

## Initial Vercel database setup

1. Import the source dump using `scripts/import-tidb-dump.mjs`. It applies
   `migrations/vercel_migration.sql` after the import.
2. Apply `migrations/add_sub_assignments.sql`.
3. Apply `migrations/add_offices.sql`.
4. Apply `migrations/add_system_catalogs.sql`.
5. Apply `migrations/add_user_app_data.sql` to persist authenticated user drafts and notification read state.

Use the compatibility migrations only when a deployment needs the specific
legacy schema adjustment named by that migration. Keep private database dumps
and credentials in the ignored `local-secrets/` directory, not in this folder.
