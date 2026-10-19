# BatangAI demo data

`seed_demo_data.php` adds synthetic training data to the database configured in `api/.env.local` (or the process environment). Run from the project root with the XAMPP PHP runtime:

```powershell
C:\xampp\php\php.exe scripts/seed_demo_data.php
```

The seeder is repeatable: its reserved demo email addresses and `INC-DEMO-*` incident IDs prevent duplicate records on later runs. It inserts 500 Employees, 20 Secretaries (shown as Front Desk), and 5 Administrators, plus 1,000 incidents: 20 Pending, 15 In Progress, and 965 Resolved. Incident creation dates are distributed across each month from January 2022 through October 2026, and reports are spread across active offices. Assigned incidents use active, registered Technician or Administrator accounts already in the database; the seeder removes its old synthetic Technician accounts when they have no remaining references.

All seeded employee, Front Desk, and administrator records are fictional. Employee accounts use `emp.demo001@demo.batangascity.gov.ph` through `emp.demo500@demo.batangascity.gov.ph`; Front Desk use `sec.demo001@demo.batangascity.gov.ph` through `sec.demo020@demo.batangascity.gov.ph`; Admin use `adm.demo001@demo.batangascity.gov.ph` through `adm.demo005@demo.batangascity.gov.ph`.

The seeded accounts share the demo password `BatangAI!Demo2026`. These are local demo credentials; change them before using the database outside a demo environment.

## Role workflow

- **Employee:** submit incident reports and view their own incidents.
- **Secretary (Front Desk):** review all reports and assign actionable incidents to an active Technician; assignment leaves the incident Pending until the Technician takes action.
- **Technician (IT Personnel):** view assigned incidents, move Pending work to In Progress, add troubleshooting progress, and resolve it with notes.
- **Administrator:** manage users, incidents, offices, and assignments; can also submit reports and perform technician status updates.

These roles use the app's existing role checks and API permissions. The seeder stores role labels accepted by login (`Secretary`, `Technician`, `Administrator`, and `Employee`).
