<?php
/**
 * Add repeatable synthetic BatangAI demo records to the configured database.
 * Run from the repository root: php scripts/seed_demo_data.php
 */
require_once __DIR__ . '/../api/load_env.php';

foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as $setting) {
    if (getenv($setting) === false) {
        fwrite(STDERR, "Missing database setting: {$setting}\n");
        exit(1);
    }
}

$conn = new mysqli(getenv('DB_HOST'), getenv('DB_USER'), getenv('DB_PASSWORD'), getenv('DB_NAME'), (int)(getenv('DB_PORT') ?: 3306));
if ($conn->connect_error) {
    fwrite(STDERR, "Database connection failed.\n");
    exit(1);
}
$conn->set_charset('utf8mb4');

function requireTable(mysqli $conn, string $table): void {
    $safe = $conn->real_escape_string($table);
    $result = $conn->query("SHOW TABLES LIKE '{$safe}'");
    if (!$result || $result->num_rows === 0) throw new RuntimeException("Required table '{$table}' is missing; apply the database migrations first.");
}
function columns(mysqli $conn, string $table): array {
    $result = $conn->query("SHOW COLUMNS FROM `{$table}`");
    $names = [];
    while ($row = $result->fetch_assoc()) $names[$row['Field']] = true;
    return $names;
}
function syntheticName(int $n): string {
    $first = ['Amihan','Andres','Apolinario','Beatriz','Carmela','Clarissa','Daniel','Diana','Elias','Emilio','Felisa','Gabriel','Hannah','Isabel','Joaquin','Luningning','Marcelo','Nina','Rafael','Sofia','Teresa','Tomas','Victoria','Zenaida'];
    $last = ['Aguilar','Alcantara','Bautista','Castillo','De la Cruz','Dela Rosa','Domingo','Flores','Garcia','Hernandez','Luna','Mendoza','Mercado','Navarro','Ramos','Reyes','Rivera','Santos','Torres','Villanueva'];
    return $first[$n % count($first)] . ' ' . $last[intdiv($n, count($first)) % count($last)] . ' ' . chr(65 + ($n % 26)) . '.';
}

try {
    foreach (['users','incidents','offices'] as $table) requireTable($conn, $table);
    $uc = columns($conn, 'users');
    $ic = columns($conn, 'incidents');
    foreach (['userID','department','email','employeeId','fullName','password','role','status'] as $column) if (!isset($uc[$column])) throw new RuntimeException("users.{$column} is missing.");
    foreach (['incidentID','affectedIssue','createdAt','department','description','employeeName','issueCategory','location','status','userId','assigned'] as $column) if (!isset($ic[$column])) throw new RuntimeException("incidents.{$column} is missing.");

    $offices = [];
    $result = $conn->query('SELECT officeName FROM offices WHERE active = 1 ORDER BY sortOrder, officeID');
    while ($row = $result->fetch_assoc()) $offices[] = $row['officeName'];
    if (!$offices) throw new RuntimeException('No active offices found. Apply database/migrations/add_offices.sql first.');

    $registeredTechnicians = [];
    $personnelResult = $conn->query("SELECT userID, fullName FROM users WHERE LOWER(status)='active' AND UPPER(role) IN ('TECHNICIAN','IT PERSONNEL','IT SUPPORT','ADMINISTRATOR','ADMIN') AND employeeId NOT LIKE '%DEMO%' AND LOWER(email) NOT LIKE '%@demo.batangascity.gov.ph' ORDER BY CASE WHEN UPPER(role) IN ('TECHNICIAN','IT PERSONNEL','IT SUPPORT') THEN 0 ELSE 1 END, userID");
    while ($row = $personnelResult->fetch_assoc()) $registeredTechnicians[] = $row;
    if (!$registeredTechnicians) throw new RuntimeException('No active registered Technician or Administrator account is available for demo incident assignment.');

    $conn->begin_transaction();
    $passwordHash = password_hash('BatangAI!Demo2026', PASSWORD_DEFAULT);
    $insertUser = $conn->prepare("INSERT IGNORE INTO users (department,email,employeeId,fullName,password,role,status) VALUES (?,?,?,?,?,?,'Active')");
    $definitions = [
        ['EMP', 500, 'Employee'], ['SEC', 20, 'Secretary'], ['ADM', 5, 'Administrator'],
    ];
    foreach ($definitions as [$prefix, $count, $role]) {
        for ($i = 1; $i <= $count; $i++) {
            $number = str_pad((string)$i, 3, '0', STR_PAD_LEFT);
            $employeeId = $prefix . '-DEMO-' . $number;
            $email = strtolower($prefix) . '.demo' . $number . '@demo.batangascity.gov.ph';
            $name = $prefix === 'SEC' ? 'Front Desk ' . syntheticName($i + 3) : ($prefix === 'ADM' ? 'Demo Administrator ' . $number : syntheticName($i + 41));
            $department = $prefix === 'SEC' || $prefix === 'ADM' ? 'Information Technology Services Division [ITSD]' : $offices[($i - 1) % count($offices)];
            $insertUser->bind_param('ssssss', $department, $email, $employeeId, $name, $passwordHash, $role);
            if (!$insertUser->execute()) throw new RuntimeException('Unable to add demo users.');
        }
    }
    $insertUser->close();

    $lookup = $conn->prepare('SELECT userID,fullName,department,role FROM users WHERE employeeId=? LIMIT 1');
    $users = [];
    foreach ([['EMP',500]] as [$prefix,$count]) {
        for ($i=1; $i<=$count; $i++) {
            $employeeId = $prefix . '-DEMO-' . str_pad((string)$i,3,'0',STR_PAD_LEFT);
            $lookup->bind_param('s',$employeeId); $lookup->execute();
            $row = $lookup->get_result()->fetch_assoc();
            if (!$row) throw new RuntimeException("Could not find seeded account {$employeeId}.");
            $users[$prefix][] = $row;
        }
    }
    $lookup->close();

    $incidentFields = ['incidentID','affectedIssue','classification','keywords','connectionType','createdAt','department','description','deviceType','employeeName','issueCategory','location','resolvedAt','resolvedBy','severity','status','summary','userId','assigned','assignedAt','assignedTo','assignedToName','durationMinutes','resolutionNotes','startedAt'];
    foreach (['classification','keywords','connectionType','deviceType','resolvedAt','resolvedBy','severity','summary','assignedAt','assignedTo','assignedToName','durationMinutes','resolutionNotes','startedAt'] as $optional) if (!isset($ic[$optional])) $incidentFields = array_values(array_diff($incidentFields, [$optional]));
    $fieldSql = implode(',', array_map(fn($f) => '`'.$f.'`', $incidentFields));
    $placeholders = implode(',', array_fill(0,count($incidentFields),'?'));
    $insertIncident = $conn->prepare("INSERT IGNORE INTO incidents ({$fieldSql}) VALUES ({$placeholders})");
    if (!$insertIncident) throw new RuntimeException('Unable to prepare incident seed query.');
    $dateAssignments = ['`createdAt`=?'];
    foreach (['assignedAt'=>"IF(assigned='Yes',DATE_ADD(?, INTERVAL 1 HOUR),NULL)", 'startedAt'=>"IF(status IN ('In Progress','Resolved'),DATE_ADD(?, INTERVAL 2 HOUR),NULL)", 'resolvedAt'=>"IF(status='Resolved',DATE_ADD(?, INTERVAL 6 HOUR),NULL)"] as $column=>$expression) {
        if (isset($ic[$column])) $dateAssignments[] = "`{$column}`={$expression}";
    }
    $updateDate = $conn->prepare('UPDATE incidents SET '.implode(',',$dateAssignments).' WHERE incidentID=?');
    if (!$updateDate) throw new RuntimeException('Unable to prepare demo date update.');
    $assignmentSet = ["`assigned`='Yes'"];
    if (isset($ic['assignedTo'])) $assignmentSet[] = '`assignedTo`=?';
    if (isset($ic['assignedToName'])) $assignmentSet[] = '`assignedToName`=?';
    if (isset($ic['resolvedBy'])) $assignmentSet[] = "`resolvedBy`=IF(status='Resolved',?,resolvedBy)";
    $updateAssignee = $conn->prepare('UPDATE incidents SET '.implode(',',$assignmentSet)." WHERE incidentID=? AND (assigned='Yes' OR status IN ('In Progress','Resolved'))");
    if (!$updateAssignee) throw new RuntimeException('Unable to prepare registered assignee update.');
    $types = str_repeat('s',count($incidentFields));
    $categories = [
        ['Network Connectivity','Network Connectivity','Wi-Fi','Desktop Computer','network connection drops during file uploads','User reports intermittent connectivity while accessing shared office files.'],
        ['Hardware Malfunction','Hardware Malfunction','LAN','Printer','printer produces faint or misaligned output','Printed forms are faint and require inspection of toner and alignment.'],
        ['Software / Application Error','Software / Application Error','LAN','Desktop Computer','records application freezes while saving a form','Application becomes unresponsive during routine record updates.'],
        ['Email / Communication','Email / Communication','Wi-Fi','Laptop','email client repeatedly requests sign-in','Employee is prompted to authenticate again when opening the office mailbox.'],
        ['Server / System Downtime','Server / System Downtime','LAN','Desktop Computer','shared records system responds slowly','Several staff members report delayed responses from the shared records application.'],
        ['Security / Access Issue','Security / Access Issue','LAN','Desktop Computer','account cannot open an assigned shared folder','Access request needs verification against the employee’s current office responsibilities.'],
        ['Hardware Malfunction','Hardware Malfunction','LAN','Laptop','laptop battery drains unusually quickly','Device battery life has declined during normal office use.'],
        ['Network Connectivity','Network Connectivity','Wi-Fi','Tablet','wireless connection is unavailable in one meeting room','Wi-Fi signal is weak in a single meeting room; nearby rooms are unaffected.'],
    ];
    $baseDate = new DateTimeImmutable('2022-01-01 09:00:00');
    for ($i=1; $i<=1000; $i++) {
        $seq = str_pad((string)$i,4,'0',STR_PAD_LEFT);
        $reporter = $users['EMP'][($i * 37) % 500];
        $office = $reporter['department'];
        [$category,$classification,$connection,$device,$issue,$description] = $categories[($i-1) % count($categories)];
        $status = $i <= 20 ? 'Pending' : (($i >= 501 && $i <= 515) ? 'In Progress' : 'Resolved');
        $monthOffset = ($i * 17) % 58;
        $dayOffset = ($i * 7) % 19;
        $hourOffset = ($i * 11) % 9;
        $created = $baseDate->modify("+{$monthOffset} months")->modify("+{$dayOffset} days")->setTime(9 + $hourOffset, ($i * 13) % 60)->format('Y-m-d H:i:s');
        $severity = $i % 20 === 0 ? 'High' : ($i % 3 === 0 ? 'Low' : 'Medium');
        $assigned = $status === 'Pending' ? 0 : 1;
        $assignee = $registeredTechnicians[($i-1) % count($registeredTechnicians)];
        $assignedTo = $status === 'Pending' ? null : $assignee['userID'];
        $assignedName = $status === 'Pending' ? null : $assignee['fullName'];
        $assignedAt = $assigned ? date('Y-m-d H:i:s',strtotime($created) + 3600) : null;
        $startedAt = $status === 'In Progress' || $status === 'Resolved' ? date('Y-m-d H:i:s',strtotime($created) + 7200) : null;
        $resolvedAt = $status === 'Resolved' ? date('Y-m-d H:i:s',strtotime($created) + 21600) : null;
        $resolvedBy = $status === 'Resolved' ? $assignedTo : null;
        $duration = $status === 'Resolved' ? 120 + ($i % 361) : null;
        $notes = $status === 'Resolved' ? 'Synthetic demo resolution: verified the affected device, applied the appropriate configuration or repair, and confirmed service with the reporter.' : null;
        $summary = ucfirst($issue) . '.';
        $location = ['Main office, 1st floor','Main office, 2nd floor','Records room','Conference room A','Public service counter','Annex, 1st floor'][$i % 6];
        $recordValues = [
            'INC-DEMO-'.$seq,$issue,$classification,'["demo","'.strtolower(str_replace(' ','-',$category)).'"]',$connection,$created,$office,
            'Synthetic training report: '.$description.' This record is fictional and contains no real personal data.',
            $device,$reporter['fullName'],$category,$location,$resolvedAt,$resolvedBy,$severity,$status,$summary,(string)$reporter['userID'],$assigned,
            $assignedAt,$assignedTo,$assignedName,$duration,$notes,$startedAt,
        ];
        $record = array_combine([
            'incidentID','affectedIssue','classification','keywords','connectionType','createdAt','department','description','deviceType','employeeName','issueCategory','location','resolvedAt','resolvedBy','severity','status','summary','userId','assigned','assignedAt','assignedTo','assignedToName','durationMinutes','resolutionNotes','startedAt'
        ], $recordValues);
        $data = array_values(array_intersect_key($record,array_flip($incidentFields)));
        if (count($data) !== count($incidentFields)) throw new RuntimeException('Incident field mapping mismatch: '.count($incidentFields).' columns, '.count($data).' values.');
        $bind = [$types]; foreach ($data as $k => $v) $bind[] = &$data[$k];
        call_user_func_array([$insertIncident,'bind_param'],$bind);
        if (!$insertIncident->execute()) throw new RuntimeException('Unable to add demo incidents.');
        $dateValues = array_fill(0, count($dateAssignments), $created);
        $dateValues[] = 'INC-DEMO-'.$seq;
        $dateBind = [str_repeat('s',count($dateValues))]; foreach ($dateValues as $key => $value) $dateBind[] = &$dateValues[$key];
        call_user_func_array([$updateDate,'bind_param'],$dateBind);
        if (!$updateDate->execute()) throw new RuntimeException('Unable to distribute demo incident dates.');
        $assignmentValues = [];
        if (isset($ic['assignedTo'])) $assignmentValues[] = (string)$assignee['userID'];
        if (isset($ic['assignedToName'])) $assignmentValues[] = (string)$assignee['fullName'];
        if (isset($ic['resolvedBy'])) $assignmentValues[] = (string)$assignee['userID'];
        $assignmentValues[] = 'INC-DEMO-'.$seq;
        $assignmentBind = [str_repeat('s',count($assignmentValues))]; foreach ($assignmentValues as $key => $value) $assignmentBind[] = &$assignmentValues[$key];
        call_user_func_array([$updateAssignee,'bind_param'],$assignmentBind);
        if (!$updateAssignee->execute()) throw new RuntimeException('Unable to assign demo incidents to registered IT staff.');
    }
    $insertIncident->close();
    $updateDate->close();
    $updateAssignee->close();

    // Remove the synthetic Technician accounts previously created by this seeder
    // once their demo incidents have been reassigned to registered staff.
    $demoTechResult = $conn->query("SELECT userID FROM users WHERE employeeId LIKE 'ITS-DEMO-%'");
    $demoTechIds = [];
    while ($row = $demoTechResult->fetch_assoc()) $demoTechIds[] = (int)$row['userID'];
    if ($demoTechIds) {
        $idList = implode(',', $demoTechIds);
        $foreignKeys = $conn->query("SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME='users' AND REFERENCED_COLUMN_NAME='userID'");
        $remainingReferences = 0;
        while ($foreignKey = $foreignKeys->fetch_assoc()) {
            $table = str_replace('`','``',$foreignKey['TABLE_NAME']);
            $column = str_replace('`','``',$foreignKey['COLUMN_NAME']);
            $referenceCount = $conn->query("SELECT COUNT(*) AS n FROM `{$table}` WHERE `{$column}` IN ({$idList})")->fetch_assoc();
            $remainingReferences += (int)$referenceCount['n'];
        }
        if ($remainingReferences === 0) $conn->query("DELETE FROM users WHERE employeeId LIKE 'ITS-DEMO-%'");
    }
    $conn->commit();

    $counts = [];
    foreach (['Employee'=>500,'Secretary'=>20,'Administrator'=>5] as $role=>$expected) {
        $stmt = $conn->prepare("SELECT COUNT(*) AS n FROM users WHERE email LIKE ? AND role=?");
        $pattern = match($role) {'Employee'=>'emp.demo%@demo.batangascity.gov.ph','Secretary'=>'sec.demo%@demo.batangascity.gov.ph',default=>'adm.demo%@demo.batangascity.gov.ph'};
        $stmt->bind_param('ss',$pattern,$role); $stmt->execute(); $actual=(int)$stmt->get_result()->fetch_assoc()['n']; $stmt->close();
        $counts[$role]=$actual;
        if ($actual !== $expected) throw new RuntimeException("Expected {$expected} demo {$role} users, found {$actual}.");
    }
    $stmt=$conn->prepare("SELECT status,COUNT(*) AS n FROM incidents WHERE incidentID LIKE 'INC-DEMO-%' GROUP BY status"); $stmt->execute();
    $incidentCounts=[]; $res=$stmt->get_result(); while($row=$res->fetch_assoc()) $incidentCounts[$row['status']]=(int)$row['n']; $stmt->close();
    ksort($incidentCounts);
    if ($incidentCounts !== ['In Progress'=>15,'Pending'=>20,'Resolved'=>965]) throw new RuntimeException('Demo incident count validation failed: '.json_encode($incidentCounts));
    fwrite(STDOUT, "Demo seed complete. Users: 500 Employee, 20 Secretary (Front Desk), 5 Administrator. Incidents: ".json_encode($incidentCounts)." across January 2022 to October 2026, assigned to active registered Technicians/Administrators. Login password for all seeded accounts: BatangAI!Demo2026\n");
} catch (Throwable $error) {
    $conn->rollback();
    fwrite(STDERR, "Demo seed failed: {$error->getMessage()}\n");
    exit(1);
} finally {
    $conn->close();
}
