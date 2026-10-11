CREATE TABLE IF NOT EXISTS department_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(150) NOT NULL UNIQUE,
  primaryUserID INT NOT NULL,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_department_assignments_primary (primaryUserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS department_assignment_subs (
  assignmentID BIGINT UNSIGNED NOT NULL,
  userID INT NOT NULL,
  PRIMARY KEY (assignmentID, userID),
  INDEX idx_department_assignment_sub_user (userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS incident_sub_assignments (
  incidentID VARCHAR(40) NOT NULL,
  userID INT NOT NULL,
  assignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (incidentID, userID),
  INDEX idx_incident_sub_assignments_user (userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
