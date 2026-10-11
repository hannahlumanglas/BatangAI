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

CREATE TABLE IF NOT EXISTS device_ping_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  deviceID VARCHAR(40) NOT NULL,
  status ENUM('pending', 'complete') NOT NULL DEFAULT 'pending',
  reachable TINYINT(1) DEFAULT NULL,
  responseTimeMs VARCHAR(20) DEFAULT NULL,
  requestedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME DEFAULT NULL,
  INDEX idx_device_ping_pending (status, requestedAt),
  INDEX idx_device_ping_device (deviceID, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS device_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  deviceID VARCHAR(40) NOT NULL,
  deviceName VARCHAR(150) NOT NULL,
  ipAddress VARCHAR(45) NOT NULL,
  status ENUM('online', 'offline') NOT NULL,
  checkedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_status_history_time (checkedAt, id),
  INDEX idx_device_status_history_device (deviceID, checkedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
