# Vercel migration

The app currently uses a React/Vite frontend, PHP endpoints, MySQL, and local
profile-photo files. Vercel runs the frontend and the Node.js API functions in
this repository; MySQL and Blob are separate managed services connected to it.
The legacy PHP files remain available for the current InfinityFree deployment.

## Vercel project setup

1. Create a Vercel project from this Git repository. Keep the Vite defaults:
   build command `npm run build`, output directory `dist`, and install command
   `npm install`.
2. Create a managed MySQL database that accepts connections from Vercel and
   copy its connection URL into the Vercel environment variable `MYSQL_URL`.
   Do not add this value to `VITE_*` variables or commit it.
3. Set `SESSION_SECRET` to a random value with at least 32 characters.
   Set `DEVICE_MONITOR_TOKEN` to a separate random value with at least 32
   characters for the device monitoring agent. Optionally set `GEMINI_API_KEY`
   to enable incident analysis.
4. Create a Vercel Blob store and add its `BLOB_READ_WRITE_TOKEN` to the
   project environment variables.
5. Deploy a preview first and verify login, incident reporting, assignment,
   status updates, user administration, device records, and photo uploads
   before changing the production domain.

## Data migration and cutover

1. Export the production database from InfinityFree using phpMyAdmin. Keep the
   export private; it contains account and incident information.
2. Keep the SQL dump under the git-ignored `local-secrets` directory. Add the
   TiDB connection details to the git-ignored `local-secrets/tidb-credentials.json`
   file and download the TiDB-recommended CA certificate to
   `local-secrets/isrgrootx1.pem`. Run `node scripts/import-tidb-dump.mjs` to
   import the dump over a TLS-verified MySQL connection and apply
   `database/vercel_migration.sql`. The importer stops if the target database
   is not empty and never prints SQL data or credentials.
3. Download the current `uploads/profile_photos` directory from InfinityFree
   into this repository's `uploads/profile_photos` directory. Do not commit the
   downloaded files.
4. With `MYSQL_URL` pointing at the imported destination database and
   `BLOB_READ_WRITE_TOKEN` set, run
   `node scripts/migrate-profile-photos.mjs`. Review the migrated/missing
   counts before deploying.
5. Set the Vercel custom domain and update its DNS records as directed by
   Vercel. Keep InfinityFree available until the Vercel deployment and data
   have been verified.

Existing password hashes remain usable; accounts may need to sign in again
because the new Vercel host cannot reuse cookies issued for the InfinityFree
domain. Vercel serverless functions cannot ping private/LAN devices because
they do not run inside the city network. For remote monitoring, run the
BatangAI device agent on a computer that stays on inside the device network:

1. Install Node.js on an always-on computer inside the client's local network.
   It must have VLAN routes to the registered device IP addresses and
   permission to send ICMP ping requests; firewalls must allow those requests
   and replies.
2. Add the same `DEVICE_MONITOR_TOKEN` value to the agent computer's environment.
   Keep it private and do not commit it. The API accepts agent requests only
   with this bearer token.
3. Set `DEVICE_MONITOR_API_URL` on that computer to
   `https://<your-domain>/api/device_agent` and run `npm run device-monitor`
   from this repository. In PowerShell, set the values for the current session
   with `$env:DEVICE_MONITOR_API_URL = 'https://<your-domain>/api/device_agent'`
   and `$env:DEVICE_MONITOR_TOKEN = '<same secret as Vercel>'` before running
   the command. The agent checks only devices registered in BatangAI, reports
   their results to the API, and repeats every 15 seconds by default.
   `DEVICE_MONITOR_INTERVAL_MS` can change that interval (minimum 5 seconds).
4. Keep the agent running. The Device Monitoring page refreshes status every 15
   seconds, and its Ping button waits for the agent's next result. If the
   agent is stopped, a device's status becomes unknown after two minutes; if
   the agent cannot reach a device, it records the device as offline.
5. The Device Online/Offline History Report records the agent's first observed
   status for each device and each later status change. It cannot recreate
   status history from before monitoring was enabled.

The agent sends results to BatangAI over outbound HTTPS. The client's public IP
is not used to ping private device addresses, and the devices do not need to be
exposed to the internet. Vercel cannot ping those private addresses directly.

Never send account passwords, database credentials, or API keys in chat. Add
them only in the Vercel project environment settings.
