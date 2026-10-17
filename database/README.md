# Database setup

BatangAI uses MySQL through the PHP `mysqli` extension. Use XAMPP phpMyAdmin
for local development and the phpMyAdmin supplied by InfinityFree for hosting.

## Import a database

1. Create an empty MySQL database in phpMyAdmin.
2. Import `snapshots/ai_nirts.sql`.
3. Apply the migrations required by the version you are deploying. For a fresh
   current setup, apply `migrations/add_offices.sql`,
   `migrations/add_system_catalogs.sql`, `migrations/add_user_app_data.sql`,
   and the dated incident/device migrations that are not already in the
   snapshot. Apply each migration only once.
4. Keep database exports private and out of version control.

The remaining migrations include historical or compatibility changes. Check
the target schema before applying those so a change is not applied twice.
Do not apply platform-specific historical migrations to the PHP deployment.

`migrations/20261018_drop_unused_legacy_tables.sql` removes the legacy
`notifications` and `incident_sub_assignments` tables, which the current app
does not read or write. Both tables contain records in the supplied export;
keep that export as a backup and apply this cleanup only if those historical
records are no longer needed. Apply any required compatibility migration that
touches `notifications` before this cleanup.
