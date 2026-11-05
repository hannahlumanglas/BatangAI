# Hostinger deployment

BatangAI serves a Vite-built React frontend and a PHP/MySQL API from the same
domain. Deploy the production build and API files to the domain's document root
(usually `public_html`).

## 1. Secure the production credentials

The database password that was previously committed has been rotated and
removed from the current GitHub branch history. Keep using the newly rotated
password. If the Gemini key that was in the local example file was real, revoke
it in Google Cloud and create a replacement.

Create a separate production database user with only the permissions needed for
the BatangAI database. Do not put credentials in the frontend, Git, screenshots,
or chat messages.

## 2. Prepare Hostinger

1. In hPanel, add or connect `batangai.net` to the Web Hosting plan. Point the
   domain to the hosting account as directed by hPanel; DNS propagation may
   take time.
2. Enable the free SSL certificate for the domain and use the HTTPS address.
3. In the website's PHP settings, select PHP 8.1 or later and verify that
   `mysqli` is enabled.
4. Create a MySQL database and user in hPanel. Copy the exact database host,
   name, username, and new password shown there. Do not assume the host is
   `localhost`.

## 3. Create and prepare the database

1. Open the database in hPanel's phpMyAdmin.
2. Import `database/snapshots/ai_nirts.sql` into the empty database. This
   snapshot contains application records; inspect it first and do not import
   its records if they are not appropriate for production.
3. Apply these migrations once, in this order:
   - `database/migrations/add_offices.sql`
   - `database/migrations/add_system_catalogs.sql`
   - `database/migrations/add_user_app_data.sql`
   - `database/migrations/allow_unset_incident_severity.sql`
   - `database/migrations/20261015_add_device_id_sequence.sql`

The snapshot already contains the incident `keywords` and `troubleshooting`
columns. Do not apply compatibility migrations or
`20261018_drop_unused_legacy_tables.sql` as part of this fresh setup.

## 4. Build the production frontend

From the repository root, run:

```powershell
npm ci
npm run build
```

The output is in `dist/`. Do not upload `.env.local`, `node_modules`, the
database dump, `.local-secrets`, or any local configuration file.

## 5. Upload the site files

In hPanel File Manager, open the document root for `batangai.net` (usually
`public_html`) and upload:

1. The **contents** of `dist/` (including `index.html` and `assets/`), not the
   `dist` directory itself.
2. The repository root `.htaccess` beside `index.html`.
3. The PHP files and `api/.htaccess` into `public_html/api/`. Do not upload
   `api/.env.local.example`.
4. `uploads/.htaccess` into `public_html/uploads/`. Ensure
   `public_html/uploads/profile_photos/` exists and is writable by PHP; use the
   narrowest permissions that work and do not set it to `777`.

The root `.htaccess` routes React page URLs to `index.html` while leaving real
API and asset files accessible.

## 6. Configure PHP privately

Create `public_html/api/.env.local` in hPanel File Manager. Add the values from
the database section above and the optional Gemini key:

```dotenv
DB_HOST=<Hostinger database host>
DB_NAME=<Hostinger database name>
DB_USER=<Hostinger database username>
DB_PASSWORD=<new Hostinger database password>
DB_PORT=3306
CORS_ALLOWED_ORIGINS=
GEMINI_API_KEY=<new Gemini key, or leave empty>
SESSION_LIFETIME_SECONDS=28800
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true
```

Keep the file private. The API `.htaccess` denies requests for dotfiles, but
still do not share or commit this file.

## 7. Smoke test

1. Visit `https://batangai.net/` and sign in with a valid account from the
   production database.
2. Open User Management, Incidents, and Device Monitoring. Check the browser's
   Network panel for failed `/api/` requests.
3. Test an incident submission and a profile-photo upload.
4. Confirm PHP errors are logged in hPanel rather than displayed to visitors.

Hostinger shared hosting may disable the PHP `exec` function or prevent access
to private LAN addresses. Device monitoring's server-side ping can therefore
be unavailable on shared hosting, and a public shared server cannot reach
office-only IPs unless it has an approved network path. Test this feature
separately before relying on it; a local monitoring agent or VPS on the office
network may be required.
