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
   Optionally set `GEMINI_API_KEY` to enable incident analysis.
4. Create a Vercel Blob store and add its `BLOB_READ_WRITE_TOKEN` to the
   project environment variables.
5. Deploy a preview first and verify login, incident reporting, assignment,
   status updates, user administration, device records, and photo uploads
   before changing the production domain.

## Data migration and cutover

1. Export the production database from InfinityFree using phpMyAdmin. Keep the
   export private; it contains account and incident information.
2. Import that dump into the managed MySQL database. Then run
   `database/vercel_migration.sql` on the destination database.
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
domain. The Vercel device-monitoring function cannot ping private/LAN devices,
because serverless functions do not run inside the city network; it reports
ping as unavailable rather than claiming a device is offline.

Never send account passwords, database credentials, or API keys in chat. Add
them only in the Vercel project environment settings.
