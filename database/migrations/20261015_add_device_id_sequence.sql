-- Allocate new numeric device IDs without changing existing device primary keys.
-- The API locks the single sequence row while creating each device.
CREATE TABLE device_id_sequence (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  nextID INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO device_id_sequence (id, nextID)
SELECT 1, COALESCE(MAX(deviceID), 0) + 1
FROM devices;
