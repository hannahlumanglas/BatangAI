-- Run this on the destination MySQL database after importing the production
-- InfinityFree database dump.
ALTER TABLE users MODIFY profilePhoto VARCHAR(2048) NULL;

CREATE TABLE IF NOT EXISTS remember_tokens (
  tokenHash CHAR(64) NOT NULL PRIMARY KEY,
  userID INT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_remember_tokens_user (userID),
  INDEX idx_remember_tokens_expiry (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
