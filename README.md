# BatangAI

BatangAI is an incident reporting and IT support system for Batangas City. It
uses JavaScript, HTML, and CSS for the frontend, PHP for the API, and MySQL
for application data. XAMPP and phpMyAdmin are used for local development and
database management.

## Project layout

```text
api/                    PHP endpoints and API environment template
database/               MySQL snapshot, migrations, and setup guide
docs/                   Deployment and service setup guides
public/                 Static files copied to the production build
scripts/                Database seed utility and instructions
src/                    React JavaScript app, pages, components, hooks, and styles
uploads/                User uploaded files
```

## Local development with XAMPP

1. Put the project folder at `F:\Desktop\BatangAI` and configure an Apache
   virtual host named `batangai.local` to use that folder as its document root.
   Enable `conf/extra/httpd-vhosts.conf` in `C:\xampp\apache\conf\httpd.conf`,
   then add this to `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:

   ```apache
   <VirtualHost *:80>
       ServerName batangai.local
       DocumentRoot "F:/Desktop/BatangAI"
       <Directory "F:/Desktop/BatangAI">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

   Add `127.0.0.1 batangai.local` to the Windows hosts file at
   `C:\Windows\System32\drivers\etc\hosts`, then restart Apache. The virtual
   host lets Apache use the project's `.htaccess` for the frontend and API.
2. Copy `api/.env.local.example` to `api/.env.local` and set the local MySQL
   database name and credentials.
3. Start Apache and MySQL in XAMPP. Import the database snapshot and required
   migrations using phpMyAdmin; see [Database setup](database/README.md).
4. Open `http://batangai.local` in your browser. Apache serves the ready-to-run
   frontend from `dist/` and the PHP endpoints from `api/`.

## InfinityFree deployment

Upload the included frontend bundle and PHP API by following the
[InfinityFree deployment guide](docs/DEPLOYMENT.md). The hosting account must
provide PHP with MySQLi and a MySQL database. Configure the PHP API using a
private `api/.env.local` file on the host. Never put database passwords or API
keys in frontend files.

For local network device monitoring, see
[Remote device monitoring](docs/REMOTE_DEVICE_MONITORING.md). Incident-analysis
configuration is described in [Gemini setup](docs/GEMINI_SETUP.md).

Server security settings are configured through environment values:
`SESSION_LIFETIME_SECONDS` (300 seconds to 7 days), `PASSWORD_MIN_LENGTH`
(8–128 characters), and `PASSWORD_REQUIRE_UPPERCASE`,
`PASSWORD_REQUIRE_LOWERCASE`, `PASSWORD_REQUIRE_NUMBER`, and
`PASSWORD_REQUIRE_SPECIAL` (`true` or `false`). Defaults preserve the current
password requirements and eight-hour session.

For synthetic training records, follow [Demo data instructions](scripts/DEMO_DATA.md).
Keep database exports, credentials, environment files, and uploaded private
data out of version control.
