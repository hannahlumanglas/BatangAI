# BatangAI

BatangAI is an incident reporting and IT support system for Batangas City. It
uses React and TypeScript for the web app, PHP for the API, and MySQL for
application data. XAMPP is used for local development and InfinityFree for
shared hosting.

## Project layout

```text
api/                    PHP endpoints
database/snapshots/     SQL snapshot
database/migrations/    SQL schema changes
docs/                   Deployment and operations guides
scripts/                Database and device-monitoring utilities
src/                    React app, pages, components, hooks, and styles
uploads/profile_photos/  Uploaded profile photos
```

## Local development with XAMPP

1. Install Node.js and XAMPP. The local API command uses PHP from
   `C:\xampp\php` so it loads XAMPP's `mysqli` extension.
2. Start Apache and MySQL in XAMPP. Import the database snapshot and required
   migrations using phpMyAdmin; see [Database setup](database/README.md).
3. Copy `api/.env.local.example` to `api/.env.local` and set your local MySQL
   database name and credentials. This file is ignored by Git.
4. Run `npm install` once. In separate VS Code terminals run `npm run api:dev`
   and `npm run dev`.
5. Open the Vite URL shown in the terminal.

## InfinityFree deployment

Build the frontend with `npm run build`, then follow the
[InfinityFree deployment guide](docs/DEPLOYMENT.md). The hosting account must
provide PHP with MySQLi and a MySQL database. Configure the PHP API using a
private `api/.env.local` file on the host. Never put database passwords or API
keys in frontend `VITE_` variables.

For local network device monitoring, see
[Remote device monitoring](docs/REMOTE_DEVICE_MONITORING.md). Incident-analysis
configuration is described in [Gemini setup](docs/GEMINI_SETUP.md).

Server security settings are configured through environment values:
`SESSION_LIFETIME_SECONDS` (300 seconds to 7 days), `PASSWORD_MIN_LENGTH`
(8–128 characters), and `PASSWORD_REQUIRE_UPPERCASE`,
`PASSWORD_REQUIRE_LOWERCASE`, `PASSWORD_REQUIRE_NUMBER`, and
`PASSWORD_REQUIRE_SPECIAL` (`true` or `false`). Defaults preserve the current
password requirements and eight-hour session.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run api:dev` | Start the local PHP API |
| `npm run build` | Type-check and build the frontend into `dist/` |
| `npm run lint` | Run ESLint |
| `npm run device-monitor` | Run the network-side device-monitoring agent |

Keep database exports, credentials, environment files, and uploaded private
data out of version control.
