-- Store technician accounts with the role label shown throughout the system.
-- Keep the legacy value available during the data update, then remove it.
ALTER TABLE users
  MODIFY COLUMN role ENUM('Administrator', 'Secretary', 'IT Support', 'Technician', 'Employee')
  NOT NULL DEFAULT 'Employee';

UPDATE users
SET role = 'Technician'
WHERE role = 'IT Support';

ALTER TABLE users
  MODIFY COLUMN role ENUM('Administrator', 'Secretary', 'Technician', 'Employee')
  NOT NULL DEFAULT 'Employee';
