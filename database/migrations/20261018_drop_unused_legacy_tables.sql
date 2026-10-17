-- Remove legacy tables that the current application does not read or write.
-- The supplied database export still contains records in both tables; keep the
-- original export as a backup before applying this migration.
DROP TABLE IF EXISTS `incident_sub_assignments`;
DROP TABLE IF EXISTS `notifications`;
