# InfinityFree deployment

The production site is a Vite-built React frontend served as static files,
with the existing PHP endpoints under `/api` and MySQL hosted by InfinityFree.

## 1. Prepare the InfinityFree account

1. Create a MySQL database in the hosting control panel. Copy the database
   host, database name, username, and password exactly as displayed there.
2. Import the SQL snapshot and migrations into that database using the
   provided phpMyAdmin; see [Database setup](../database/README.md).
3. Confirm the account supports the PHP version used by this project and the
   `mysqli` extension.

## 2. Configure the PHP API

1. On your computer, copy `api/.env.local.example` to `api/.env.local`.
2. Replace `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` with the
   InfinityFree database values. Keep `DB_PORT=3306` unless the control panel
   specifies another port. Set `GEMINI_API_KEY` only if incident analysis is
   enabled.
3. Keep `CORS_ALLOWED_ORIGINS` empty for same-origin production traffic.
4. Upload this configured file into the deployed `api/` folder using the
   hosting file manager or FTP. It is excluded from Git. Do not publish its
   contents or place credentials in the frontend.

## 3. Build and upload the site

1. From the project folder run `npm install`, then `npm run build`.
2. Upload the **contents** of `dist/` to the website document root (usually
   `htdocs/`). Do not upload the `dist` folder as a nested directory.
3. Upload the PHP files from `api/` and `api/.env.local` into `htdocs/api/`.
   Do not upload `.env.local.example`.
4. Upload the project's `uploads/` directory and ensure PHP can write to
   `uploads/profile_photos/`. Do not upload private SQL dumps or local secrets.
5. Ensure the root `.htaccess` is uploaded beside `index.html`. It serves
   existing PHP and static files directly and sends frontend routes to React.
6. Open the site over HTTPS and verify sign-in, an API-backed page, incident
   creation, and profile-photo upload.

## Database and file updates

Back up the MySQL database and `uploads/profile_photos/` before changing the
schema or replacing hosted files. Apply any required SQL migrations through
phpMyAdmin, then upload the new frontend build and PHP changes. Keep
`api/.env.local` private and outside source control.

## Hosting limits

InfinityFree shared hosting runs the PHP API and static frontend. Private
network device checks need to run from a computer connected to that network;
see [local device monitoring](REMOTE_DEVICE_MONITORING.md).
