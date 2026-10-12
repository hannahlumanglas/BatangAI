CREATE TABLE IF NOT EXISTS incident_sub_assignments (
  incidentID VARCHAR(40) NOT NULL,
  userID INT NOT NULL,
  assignedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (incidentID, userID),
  INDEX idx_incident_sub_assignments_user (userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
