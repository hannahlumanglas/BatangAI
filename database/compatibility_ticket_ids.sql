-- Convert the new database's numeric incident IDs to readable ticket IDs.
-- Notification links are migrated with the incidents and the foreign key is
-- restored afterward, preserving all existing incident and notification data.
ALTER TABLE notifications
  DROP FOREIGN KEY fk_notifications_incident;

ALTER TABLE incidents
  MODIFY incidentID VARCHAR(30) NOT NULL;

ALTER TABLE notifications
  MODIFY incidentID VARCHAR(30) DEFAULT NULL;

UPDATE notifications AS n
JOIN incidents AS i
  ON n.incidentID = CAST(i.incidentID AS CHAR)
SET n.incidentID = CONCAT(
  'INC-', DATE_FORMAT(i.createdAt, '%Y%m%d'), '-', LPAD(i.incidentID, 5, '0')
);

UPDATE incidents
SET incidentID = CONCAT(
  'INC-', DATE_FORMAT(createdAt, '%Y%m%d'), '-', LPAD(incidentID, 5, '0')
);

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_incident
  FOREIGN KEY (incidentID) REFERENCES incidents (incidentID)
  ON DELETE SET NULL ON UPDATE CASCADE;
