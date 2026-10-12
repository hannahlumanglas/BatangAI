-- Remove device metrics that the app does not collect or display.
-- The live local database was audited first; these fields were NULL for all
-- four devices. IF EXISTS also supports fresh/legacy databases with drift.
ALTER TABLE devices
  DROP COLUMN IF EXISTS latencyMs,
  DROP COLUMN IF EXISTS port,
  DROP COLUMN IF EXISTS uptimeSeconds,
  DROP COLUMN IF EXISTS downloadMbps,
  DROP COLUMN IF EXISTS uploadMbps;
