-- Keep new incident reports unclassified until an administrator or secretary
-- assigns a severity.
ALTER TABLE `incidents`
  MODIFY `severity` enum('High','Medium','Low') DEFAULT NULL;
