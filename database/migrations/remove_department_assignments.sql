-- Remove unused office-level technician defaults. Per-incident SUB assignments
-- remain stored in incident_sub_assignments.
DROP TABLE IF EXISTS department_assignment_subs;
DROP TABLE IF EXISTS department_assignments;
