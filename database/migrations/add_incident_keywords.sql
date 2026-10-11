-- Safe to run on an existing database whether or not the column is present.
ALTER TABLE `incidents`
  ADD COLUMN IF NOT EXISTS `keywords` text DEFAULT NULL AFTER `classification`;
