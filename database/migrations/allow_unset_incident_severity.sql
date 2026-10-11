-- Keep new incident reports unclassified until an administrator or secretary
-- assigns a severity.
ALTER TABLE `incidents`
  MODIFY `severity` enum('Low','Medium','High','Critical') DEFAULT NULL;
