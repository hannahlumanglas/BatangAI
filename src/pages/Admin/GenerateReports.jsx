import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { AdminNotifications } from './AdminNotifications';
import { getAuthSession, getRoleDisplayName, getProfilePhotoUrl, signOut, } from '../../auth';
import './Dashboard.css';
import './GenerateReports.css';
import { API_BASE_URL } from '../../apiConfig';
function Icon({ name }) {
    const paths = {
        dashboard: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
        incidents: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2" }), _jsx("path", { d: "M9 4.5h6M9 10h6M9 14h6M9 18h3" })] })),
        devices: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "13", rx: "1.5" }), _jsx("path", { d: "M8 21h8M12 17v4" })] })),
        users: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("circle", { cx: "17", cy: "9", r: "2" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" })] })),
        reports: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" }) })),
        profile: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] })),
        logout: (_jsx(_Fragment, { children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) })),
        menu: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M4 12h16M4 18h16" }) })),
        bell: (_jsx(_Fragment, { children: _jsx("path", { d: "M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" }) })),
        download: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M12 3v12m0 0 4-4m-4 4-4-4" }), _jsx("path", { d: "M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" })] })),
        print: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" }), _jsx("path", { d: "M7 14h10v7H7zM17 11h.01" })] })),
        check: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m8 12 2.7 2.7L16.5 9" })] })),
        alert: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 7v6M12 17h.01" })] })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" }), _jsx("path", { d: "M18 8v6M15 11h6" })] })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
const navigation = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { label: 'All Incidents', icon: 'incidents', path: '/admin/incidents' },
    { label: 'Manage & Assign', icon: 'assign', path: '/admin/manage-assign' },
    { label: 'My Assignments', icon: 'assign', path: '/admin/my-assignments' },
    { label: 'Device Monitoring', icon: 'devices', path: '/admin/device-monitoring' },
    { label: 'User Management', icon: 'users', path: '/admin/user-management' },
    { label: 'Generate Reports', icon: 'reports', path: '/admin/generate-reports' },
    { label: 'Profile', icon: 'profile', path: '/admin/profile' },
];
const reportTypes = [
    'All Incidents Report',
    'Resolved Incidents Report',
    'Pending Incidents Report',
    'Personnel Performance Report',
    'Office Incident History Report',
    'Device Online/Offline History Report',
];
const DEVICE_STATUS_HISTORY_URL = `${API_BASE_URL}/device_status_history.php`;
const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const years = ['2026', '2025', '2024', '2023'];
const MONTH_TO_INDEX = new Map(months.map((monthName, index) => [monthName, index + 1]));
function normalizeStatus(status) {
    return String(status ?? '').trim().toLowerCase();
}
function formatDate(value) {
    if (!value)
        return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    return date.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function getDateParts(value) {
    if (!value)
        return null;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        };
    }
    const match = String(value).match(/^(\d{4})-(\d{1,2})/);
    if (!match)
        return null;
    return {
        year: Number(match[1]),
        month: Number(match[2]),
    };
}
function matchesPeriod(dateValue, startMonth, endMonth, year) {
    const parts = getDateParts(dateValue);
    if (!parts)
        return false;
    if (String(parts.year) !== year) {
        return false;
    }
    const startMonthIndex = MONTH_TO_INDEX.get(startMonth) ?? 1;
    const endMonthIndex = MONTH_TO_INDEX.get(endMonth) ?? 12;
    return parts.month >= startMonthIndex && parts.month <= endMonthIndex;
}
function getIncidentDate(incident) {
    return incident.createdAt ?? null;
}
function getIncidentId(incident) {
    return String(incident.incidentID ?? incident.id ?? '');
}
function getEmployeeName(incident) {
    return String(incident.employeeName ??
        incident.userId ??
        'Unknown Employee');
}
function getDepartment(incident) {
    return String(incident.department ?? 'Unspecified');
}
function getAssignedPersonnel(incident) {
    return String(incident.assignedToName ??
        incident.assignedTo ??
        'Unassigned');
}
function getDuration(incident) {
    const duration = incident.durationMinutes;
    const value = duration === null || duration === undefined || String(duration).trim() === ''
        ? Number.NaN
        : Number(duration);
    if (Number.isFinite(value) && value >= 0 && (value > 0 || !incident.resolvedAt)) {
        return value;
    }
    const startTime = incident.startedAt ?? incident.createdAt;
    if (startTime && incident.resolvedAt) {
        const started = new Date(startTime);
        const resolved = new Date(incident.resolvedAt);
        if (!Number.isNaN(started.getTime()) && !Number.isNaN(resolved.getTime())) {
            return Math.max(0, Math.round((resolved.getTime() - started.getTime()) / 60000));
        }
    }
    return 0;
}
function downloadCsv(report) {
    const rows = [report.headers, ...report.rows];
    const csv = rows
        .map(row => row
        .map(value => {
        const text = String(value ?? '');
        const safeText = typeof value === 'string' && /^\s*[=+\-@]/.test(text)
            ? `'${text}`
            : text;
        return `"${safeText.replaceAll('"', '""')}"`;
    })
        .join(','))
        .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
function buildReport(reportType, incidents, startMonth, endMonth, year) {
    const periodLabel = `${startMonth}-to-${endMonth}-${year}`
        .replace(/\s+/g, '-')
        .toLowerCase();
    const slug = reportType
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const periodIncidents = incidents.filter(incident => matchesPeriod(getIncidentDate(incident), startMonth, endMonth, year));
    if (reportType === 'Resolved Incidents Report') {
        const resolved = periodIncidents.filter(incident => normalizeStatus(incident.status) === 'resolved');
        return {
            headers: [
                'Incident ID',
                'Employee',
                'Office',
                'Issue Category',
                'Severity',
                'Assigned Technician',
                'Created At',
                'Resolved At',
                'Duration (Minutes)',
                'Resolution Notes',
            ],
            rows: resolved.map(incident => [
                getIncidentId(incident),
                getEmployeeName(incident),
                getDepartment(incident),
                incident.issueCategory ?? incident.affectedIssue ?? '',
                incident.severity ?? '',
                getAssignedPersonnel(incident),
                formatDate(incident.createdAt),
                formatDate(incident.resolvedAt),
                getDuration(incident),
                incident.resolutionNotes ?? '',
            ]),
            filename: `${slug}-${periodLabel}.csv`,
        };
    }
    if (reportType === 'Pending Incidents Report') {
        const pending = periodIncidents.filter(incident => normalizeStatus(incident.status) === 'pending');
        return {
            headers: [
                'Incident ID',
                'Employee',
                'Office',
                'Issue Category',
                'Severity',
                'Status',
                'Assigned Technician',
                'Created At',
                'Description',
            ],
            rows: pending.map(incident => [
                getIncidentId(incident),
                getEmployeeName(incident),
                getDepartment(incident),
                incident.issueCategory ?? incident.affectedIssue ?? '',
                incident.severity ?? '',
                incident.status ?? 'Pending',
                getAssignedPersonnel(incident),
                formatDate(incident.createdAt),
                incident.description ?? incident.summary ?? '',
            ]),
            filename: `${slug}-${periodLabel}.csv`,
        };
    }
    if (reportType === 'Personnel Performance Report') {
        const personnelMap = new Map();
        periodIncidents.forEach(incident => {
            const personnel = getAssignedPersonnel(incident);
            if (!personnel ||
                personnel.toLowerCase() === 'unassigned') {
                return;
            }
            const current = personnelMap.get(personnel) ?? {
                assigned: 0,
                resolved: 0,
                totalDuration: 0,
            };
            current.assigned += 1;
            if (normalizeStatus(incident.status) === 'resolved') {
                current.resolved += 1;
                current.totalDuration += getDuration(incident);
            }
            personnelMap.set(personnel, current);
        });
        const rows = Array.from(personnelMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([personnel, data]) => [
            personnel,
            data.assigned,
            data.resolved,
            data.assigned > 0
                ? Math.round((data.resolved / data.assigned) * 100)
                : 0,
            data.resolved > 0
                ? Math.round(data.totalDuration / data.resolved)
                : 0,
        ]);
        return {
            headers: [
                'Technician',
                'Assigned Incidents',
                'Resolved Incidents',
                'Resolution Rate (%)',
                'Average Resolution Time (Minutes)',
            ],
            rows,
            filename: `${slug}-${periodLabel}.csv`,
        };
    }
    if (reportType ===
        'Office Incident History Report') {
        const departmentMap = new Map();
        periodIncidents.forEach(incident => {
            const department = getDepartment(incident);
            const current = departmentMap.get(department) ?? {
                total: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0,
            };
            current.total += 1;
            const status = normalizeStatus(incident.status);
            if (status === 'pending') {
                current.pending += 1;
            }
            if (status === 'in progress' ||
                status === 'in-progress') {
                current.inProgress += 1;
            }
            if (status === 'resolved') {
                current.resolved += 1;
            }
            departmentMap.set(department, current);
        });
        const rows = Array.from(departmentMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([department, data]) => [
            department,
            data.total,
            data.pending,
            data.inProgress,
            data.resolved,
        ]);
        return {
            headers: [
                'Office',
                'Total Incidents',
                'Pending',
                'In Progress',
                'Resolved',
            ],
            rows,
            filename: `${slug}-${periodLabel}.csv`,
        };
    }
    return {
        headers: [
            'Incident ID',
            'Employee',
            'Office',
            'Issue Category',
            'Severity',
            'Status',
            'Assigned Technician',
            'Created At',
            'Resolved At',
            'Duration (Minutes)',
        ],
        rows: periodIncidents.map(incident => [
            getIncidentId(incident),
            getEmployeeName(incident),
            getDepartment(incident),
            incident.issueCategory ??
                incident.affectedIssue ??
                '',
            incident.severity ?? '',
            incident.status ?? '',
            getAssignedPersonnel(incident),
            formatDate(incident.createdAt),
            formatDate(incident.resolvedAt),
            getDuration(incident),
        ]),
        filename: `${slug}-${periodLabel}.csv`,
    };
}
function buildDeviceStatusReport(events, periodLabel) {
    return {
        headers: ['Device ID', 'Device Name', 'IP Address', 'Status', 'Recorded At'],
        rows: events.map(event => [
            event.deviceID,
            event.deviceName,
            event.ipAddress,
            event.status === 'online' ? 'Online' : 'Offline',
            formatDate(event.checkedAt),
        ]),
        filename: `device-online-offline-history-${periodLabel}.csv`,
    };
}
const THEME_STORAGE_KEY = 'batangai-theme';
function readStoredTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' ||
        stored === 'dark') {
        return stored;
    }
    return 'light';
}
function useTheme() {
    const [theme, setTheme] = useState(readStoredTheme);
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);
    const toggleTheme = () => setTheme(current => current === 'dark'
        ? 'light'
        : 'dark');
    return {
        theme,
        toggleTheme,
    };
}
function ThemeToggle({ theme, onToggle, }) {
    const isDark = theme === 'dark';
    return (_jsx("button", { type: "button", className: "theme-toggle-button", onClick: onToggle, "aria-label": isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode', "aria-pressed": isDark, title: isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode', children: isDark ? (_jsxs("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "4.2" }), _jsx("path", { d: "M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" }) })) }));
}
function ProfileMenu({ name, role, avatar, onLogout, }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const rootRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handleClickOutside = (e) => {
            if (rootRef.current &&
                !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);
    const goToProfile = () => {
        setOpen(false);
        navigate('/admin/profile');
    };
    return (_jsxs("div", { className: "profile-menu-root", ref: rootRef, children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(current => !current), "aria-haspopup": "menu", "aria-expanded": open, children: [_jsx("div", { className: "topbar-avatar", children: avatar ? (_jsx("img", { src: avatar, alt: "" })) : (name
                            .split(/\s+/)
                            .map(part => part[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()) }), _jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("span", { children: getRoleDisplayName(role) })] }), _jsx("span", { className: `profile-menu-chevron${open ? ' open' : ''}`, children: _jsx("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] }), "My Profile"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => navigate('/admin/settings'), children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" })] }), "Settings"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] }), "Change Password"] }), _jsx("span", { className: "profile-menu-divider" }), _jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: () => {
                            setOpen(false);
                            onLogout();
                        }, children: [_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) }), "Logout"] })] }))] }));
}
function GenerateReports() {
    const navigate = useNavigate();
    const session = getAuthSession();
    const currentUser = session?.user;
    const currentUserName = currentUser?.fullName ||
        'Administrator';
    const currentUserRole = currentUser?.role ||
        'Administrator';
    const currentUserId = currentUser?.userID;
    const [profileAvatar, setProfileAvatar] = useState(() => getProfilePhotoUrl(currentUser?.profilePhoto, currentUser?.fullName, currentUser?.role));
    const { theme, toggleTheme } = useTheme();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [reportType, setReportType] = useState(reportTypes[0]);
    const [startMonth, setStartMonth] = useState(months[0]);
    const [endMonth, setEndMonth] = useState(months[months.length - 1]);
    const [year, setYear] = useState(years[0]);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');
    const [messageTone, setMessageTone] = useState('success');
    const [generatedReport, setGeneratedReport] = useState(null);
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    useEffect(() => {
        const updateProfilePhoto = () => {
            const updatedSession = getAuthSession();
            const updatedUser = updatedSession?.user;
            if (!updatedUser) {
                return;
            }
            setProfileAvatar(getProfilePhotoUrl(updatedUser.profilePhoto, updatedUser.fullName, updatedUser.role));
        };
        window.addEventListener('batangai-auth-updated', updateProfilePhoto);
        return () => {
            window.removeEventListener('batangai-auth-updated', updateProfilePhoto);
        };
    }, []);
    useEffect(() => {
        let active = true;
        const loadIncidents = async () => {
            try {
                setLoading(true);
                setMessage('');
                if (currentUserId === undefined ||
                    currentUserId === null ||
                    String(currentUserId).trim() === '') {
                    throw new Error('Your session is missing an account ID. Please log in again.');
                }
                const incidentsUrl = new URL(`${API_BASE_URL}/get_incidents.php`, window.location.origin);
                incidentsUrl.searchParams.set('userID', String(currentUserId));
                const response = await fetch(incidentsUrl);
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.message ||
                        'Unable to load incident records.');
                }
                if (active) {
                    setIncidents(Array.isArray(data.incidents)
                        ? data.incidents
                        : []);
                }
            }
            catch (error) {
                if (!active)
                    return;
                setIncidents([]);
                setMessageTone('error');
                setMessage(error instanceof Error
                    ? error.message
                    : 'Unable to load incident records.');
            }
            finally {
                if (active) {
                    setLoading(false);
                }
            }
        };
        void loadIncidents();
        return () => {
            active = false;
        };
    }, [currentUserId]);
    const handleGenerate = async () => {
        if (loading) {
            return;
        }
        setGenerating(true);
        setMessage('');
        setGeneratedReport(null);
        try {
            let report;
            if (reportType === 'Device Online/Offline History Report') {
                if (currentUserId === undefined || currentUserId === null || String(currentUserId).trim() === '') {
                    throw new Error('Your session is missing an account ID. Please log in again.');
                }
                const startMonthNumber = MONTH_TO_INDEX.get(startMonth) ?? 1;
                const endMonthNumber = MONTH_TO_INDEX.get(endMonth) ?? 12;
                const endDay = new Date(Date.UTC(Number(year), endMonthNumber, 0)).getUTCDate();
                const padded = (value) => String(value).padStart(2, '0');
                const startDate = `${year}-${padded(startMonthNumber)}-01`;
                const endDate = `${year}-${padded(endMonthNumber)}-${padded(endDay)}`;
                const historyUrl = new URL(DEVICE_STATUS_HISTORY_URL, window.location.origin);
                historyUrl.searchParams.set('userID', String(currentUserId));
                historyUrl.searchParams.set('startDate', startDate);
                historyUrl.searchParams.set('endDate', endDate);
                const response = await fetch(historyUrl);
                const data = await response.json();
                if (!response.ok || !data.success || !Array.isArray(data.events)) {
                    throw new Error(data.message || 'Unable to load device status history.');
                }
                const periodLabel = `${startMonth}-to-${endMonth}-${year}`
                    .replace(/\s+/g, '-')
                    .toLowerCase();
                report = buildDeviceStatusReport(data.events, periodLabel);
            }
            else {
                report = buildReport(reportType, incidents, startMonth, endMonth, year);
            }
            if (report.rows.length === 0) {
                setMessageTone('error');
                setMessage(`No records found for ${reportType.toLowerCase()} from ${startMonth} to ${endMonth} ${year}.`);
                return;
            }
            setGeneratedReport(report);
            setMessageTone('success');
            setMessage(`${report.filename} is ready to preview and print.`);
        }
        catch (error) {
            setMessageTone('error');
            setMessage(error instanceof Error
                ? error.message
                : 'Unable to generate the report.');
        }
        finally {
            setGenerating(false);
        }
    };
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": "Administrator navigation", children: navigation.map(item => (_jsxs("button", { className: item.label ===
                                'Generate Reports'
                                ? 'is-active'
                                : '', type: "button", onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(current => !current), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: "Generate Reports" }), _jsx("p", { children: "Generate incident reports from actual system records by type and period." })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: currentUserName, role: currentUserRole, avatar: profileAvatar, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content", children: [_jsxs("article", { className: "dashboard-card gr-card", children: [_jsxs("h2", { children: [_jsx(Icon, { name: "reports" }), "Report Configuration"] }), _jsxs("div", { className: "gr-grid", children: [_jsxs("label", { children: ["Report Type", _jsx("select", { value: reportType, onChange: e => setReportType(e.target.value), disabled: loading || generating, children: reportTypes.map(type => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("label", { children: ["From Month", _jsx("select", { value: startMonth, onChange: e => {
                                                            const nextStartMonth = e.target.value;
                                                            setStartMonth(nextStartMonth);
                                                            if ((MONTH_TO_INDEX.get(endMonth) ?? 12) < (MONTH_TO_INDEX.get(nextStartMonth) ?? 1)) {
                                                                setEndMonth(nextStartMonth);
                                                            }
                                                        }, disabled: loading || generating, children: months.map(monthName => (_jsx("option", { value: monthName, children: monthName }, monthName))) })] }), _jsxs("label", { children: ["To Month", _jsx("select", { value: endMonth, onChange: e => setEndMonth(e.target.value), disabled: loading || generating, children: months
                                                            .filter(monthName => (MONTH_TO_INDEX.get(monthName) ?? 0) >= (MONTH_TO_INDEX.get(startMonth) ?? 1))
                                                            .map(monthName => (_jsx("option", { value: monthName, children: monthName }, monthName))) })] }), _jsxs("label", { children: ["Year", _jsx("select", { value: year, onChange: e => setYear(e.target.value), disabled: loading || generating, children: years.map(yearValue => (_jsx("option", { value: yearValue, children: yearValue }, yearValue))) })] })] }), _jsxs("button", { type: "button", onClick: handleGenerate, disabled: loading || generating, className: "btn btn-primary gr-generate", style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 18px',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            background: '#2563eb',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s ease',
                                        }, children: [_jsx(Icon, { name: "reports" }), loading
                                                ? 'Loading Incident Records...'
                                                : generating
                                                    ? 'Preparing Preview...'
                                                    : 'Generate Report'] }), message && (_jsxs("p", { className: `gr-message${messageTone ===
                                            'error'
                                            ? ' gr-message--error'
                                            : ''}`, children: [_jsx(Icon, { name: messageTone ===
                                                    'error'
                                                    ? 'alert'
                                                    : 'check' }), message] })), !loading &&
                                        messageTone !==
                                            'error' &&
                                        incidents.length > 0 && (_jsxs("p", { className: "gr-message", children: [_jsx(Icon, { name: "check" }), incidents.length, " incident record", incidents.length === 1
                                                ? ''
                                                : 's', ' ', "loaded from the database."] }))] }), generatedReport && (_jsxs("article", { className: "dashboard-card gr-card gr-print-area", children: [_jsxs("h2", { children: [_jsx(Icon, { name: "reports" }), "Report Preview"] }), _jsxs("p", { className: "gr-message", children: ["Previewing ", generatedReport.filename, " \u2014 ", generatedReport.rows.length, " record", generatedReport.rows.length === 1 ? '' : 's', "."] }), _jsx("div", { className: "gr-preview-table-wrap", style: { overflowX: 'auto', marginTop: '16px' }, children: _jsxs("table", { className: "gr-preview-table", style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { children: generatedReport.headers.map(header => (_jsx("th", { style: {
                                                                textAlign: 'left',
                                                                padding: '10px',
                                                                borderBottom: '1px solid var(--border-color, #ddd)',
                                                                whiteSpace: 'nowrap',
                                                            }, children: header }, header))) }) }), _jsx("tbody", { children: generatedReport.rows.map((row, rowIndex) => (_jsx("tr", { children: row.map((cell, cellIndex) => (_jsx("td", { style: {
                                                                padding: '10px',
                                                                borderBottom: '1px solid var(--border-color, #eee)',
                                                                verticalAlign: 'top',
                                                            }, children: String(cell ?? '') }, `${generatedReport.filename}-${rowIndex}-${cellIndex}`))) }, `${generatedReport.filename}-${rowIndex}`))) })] }) }), _jsxs("button", { className: "incident-new gr-generate", type: "button", onClick: () => downloadCsv(generatedReport), style: { marginTop: '16px', marginRight: '12px' }, children: [_jsx(Icon, { name: "download" }), "Download CSV"] }), _jsxs("button", { className: "incident-new gr-generate", type: "button", onClick: () => window.print(), style: { marginTop: '16px' }, children: [_jsx(Icon, { name: "print" }), "Print Report"] })] }))] })] })] }));
}
export default GenerateReports;
