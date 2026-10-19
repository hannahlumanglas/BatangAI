import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { PersonName } from '../../components/PersonName';
import { IncidentDetailModal, } from '../../components/IncidentDetailModal';
import { AdminNotifications } from './AdminNotifications';
import { getCurrentUserId, getCurrentUserName, getCurrentUserRole, getRoleDisplayName, getAuthSession, getProfilePhotoUrl, signOut, } from '../../auth';
import './Dashboard.css';
import './ManageandAssign.css';
import { API_BASE_URL } from '../../apiConfig';
import { useSystemOptions } from '../../hooks/useSystemOptions';
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
        search: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "10.5", cy: "10.5", r: "5.5" }), _jsx("path", { d: "m15 15 4 4" })] })),
        eye: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" }), _jsx("path", { d: "M18 8v6M15 11h6" })] })),
        close: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }),
        phone: (_jsx("path", { d: "M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" })),
        mail: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }), _jsx("path", { d: "m4 6 8 7 8-7" })] })),
        sparkle: (_jsx(_Fragment, { children: _jsx("path", { d: "M12 3.5c.5 2.6 1.3 4.4 2.5 5.6 1.2 1.2 3 2 5.6 2.5-2.6.5-4.4 1.3-5.6 2.5-1.2 1.2-2 3-2.5 5.6-.5-2.6-1.3-4.4-2.5-5.6-1.2-1.2-3-2-5.6-2.5 2.6-.5 4.4-1.3 5.6-2.5 1.2-1.2 2-3 2.5-5.6Z" }) })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
const navigation = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    {
        label: 'All Incidents',
        icon: 'incidents',
        path: '/admin/incidents',
    },
    {
        label: 'Manage & Assign',
        icon: 'assign',
        path: '/admin/manage-assign',
    },
    { label: 'My Assignments', icon: 'assign', path: '/admin/my-assignments' },
    {
        label: 'Device Monitoring',
        icon: 'devices',
        path: '/admin/device-monitoring',
    },
    {
        label: 'User Management',
        icon: 'users',
        path: '/admin/user-management',
    },
    {
        label: 'Generate Reports',
        icon: 'reports',
        path: '/admin/generate-reports',
    },
    {
        label: 'Profile',
        icon: 'profile',
        path: '/admin/profile',
    },
];
const statusTagClass = {
    Pending: 'pending-tag',
    'In Progress': 'progress-tag',
    Resolved: 'resolved-tag',
};
const severityTagClass = {
    High: 'high-tag',
    Medium: 'medium-tag',
    Low: 'low-tag',
};
const THEME_STORAGE_KEY = 'batangai-theme';
function readStoredTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
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
    const toggleTheme = () => {
        setTheme(current => current === 'dark' ? 'light' : 'dark');
    };
    return { theme, toggleTheme };
}
function ThemeToggle({ theme, onToggle, }) {
    const isDark = theme === 'dark';
    return (_jsx("button", { type: "button", className: "theme-toggle-button", onClick: onToggle, "aria-label": isDark ? 'Switch to light mode' : 'Switch to dark mode', "aria-pressed": isDark, title: isDark ? 'Switch to light mode' : 'Switch to dark mode', children: isDark ? (_jsxs("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "4.2" }), _jsx("path", { d: "M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" }) })) }));
}
/* ---------- Profile Menu ---------- */
function ProfileMenu({ name, role, avatar, avatarInitial, onLogout, profilePath = '/admin/profile', }) {
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
        navigate(profilePath);
    };
    return (_jsxs("div", { className: "profile-menu-root", ref: rootRef, children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(current => !current), "aria-haspopup": "menu", "aria-expanded": open, children: [_jsx("div", { className: "topbar-avatar", children: avatar ? (_jsx("img", { src: avatar, alt: "" })) : (avatarInitial) }), _jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("span", { children: getRoleDisplayName(role) })] }), _jsx("span", { className: `profile-menu-chevron${open ? ' open' : ''}`, children: _jsx("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] }), "My Profile"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" })] }), "Settings"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] }), "Change Password"] }), _jsx("span", { className: "profile-menu-divider" }), _jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: () => {
                            setOpen(false);
                            onLogout();
                        }, children: [_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) }), "Logout"] })] }))] }));
}
/* ---------- Helpers ---------- */
function parseTroubleshooting(value) {
    if (!value) {
        return { steps: ['No self-help steps recorded.'], checkedSteps: [] };
    }
    const checkedMatch = value.match(/\[Employee checked self-help steps: ([^\]]*)\]/i);
    const checkedSteps = (checkedMatch?.[1] || '').split(',')
        .map(item => item.trim())
        .filter(item => item !== '')
        .map(Number)
        .filter(index => Number.isInteger(index) && index >= 0);
    const basicHelp = value.match(/Basic Self-Help:\s*([\s\S]*?)(?=\n\s*IT Troubleshooting Suggestions:|\n\s*\[Employee checked self-help steps:|$)/i)?.[1];
    if (basicHelp !== undefined) {
        const steps = basicHelp.split(/\r?\n/)
            .map(step => step.replace(/^\s*(\d+[.)]|[-*])\s*/, '').trim())
            .filter(Boolean);
        return { steps: steps.length ? steps : ['No self-help steps recorded.'], checkedSteps };
    }
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            const steps = parsed
                .map(item => String(item).trim())
                .filter(Boolean);
            if (steps.length > 0) {
                return { steps, checkedSteps: [] };
            }
        }
    }
    catch {
        // Not JSON. Continue with normal text parsing.
    }
    const steps = value
        .split(/\r?\n/)
        .map(step => step
        .replace(/^\s*(\d+[.)]|-|\*)\s*/, '')
        .trim())
        .filter(Boolean);
    return { steps: steps.length > 0 ? steps : ['No self-help steps recorded.'], checkedSteps: [] };
}
function formatDateTime(createdAt) {
    if (!createdAt) {
        return {
            date: '—',
            time: '—',
        };
    }
    const parsed = new Date(createdAt.replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) {
        return {
            date: createdAt,
            time: '',
        };
    }
    return {
        date: parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }),
        time: parsed.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }),
    };
}
function mapSeverity(value) {
    if (value === 'High')
        return 'High';
    if (value === 'Medium')
        return 'Medium';
    if (value === 'Low')
        return 'Low';
    return null;
}
function mapStatus(value) {
    if (value === 'In Progress') {
        return 'In Progress';
    }
    if (value === 'Resolved') {
        return 'Resolved';
    }
    return 'Pending';
}
function mapIncident(item) {
    const dateTime = formatDateTime(item.createdAt);
    const duration = item.durationMinutes !== null &&
        item.durationMinutes !== undefined &&
        String(item.durationMinutes).trim() !== ''
        ? `~${item.durationMinutes} minutes`
        : 'Not available';
    return {
        id: item.incidentID,
        incidentID: item.incidentID,
        reporter: item.employeeName || 'Unknown Reporter',
        reporterProfilePhoto: item.reporterProfilePhoto || null,
        reporterEmail: item.reporterEmail || null,
        employeeName: item.employeeName || 'Unknown Reporter',
        department: item.department || '—',
        severity: mapSeverity(item.severity),
        status: mapStatus(item.status),
        assigned: item.assigned || (item.assignedToName ? 'Yes' : 'No'),
        assignedToName: item.assignedToName || null,
        affectedIssue: item.affectedIssue || 'Not specified',
        classification: item.classification || null,
        keywords: item.keywords || null,
        connectionType: item.connectionType || null,
        createdAt: item.createdAt || null,
        issueCategory: item.issueCategory || null,
        resolutionNotes: item.resolutionNotes || null,
        resolvedAt: item.resolvedAt || null,
        resolvedBy: item.resolvedBy || null,
        durationMinutes: item.durationMinutes ?? null,
        summary: item.summary || null,
        troubleshooting: item.troubleshooting || null,
        assignedTo: item.assignedToName &&
            item.assignedToName.trim() !== ''
            ? item.assignedToName
            : null,
        assignedToUserId: item.assignedTo !== null &&
            item.assignedTo !== undefined
            ? String(item.assignedTo)
            : null,
        assignedToProfilePhoto: item.assignedToProfilePhoto || null,
        date: dateTime.date,
        time: dateTime.time,
        employeeId: item.employeeId || '—',
        location: item.location || '—',
        deviceType: item.deviceType || '—',
        connection: item.connectionType || '—',
        channel: 'Web Form',
        encodedBy: item.encodedBy ||
            item.employeeName ||
            'Unknown',
        description: item.description ||
            item.affectedIssue ||
            'No description provided.',
        aiClassification: item.classification ||
            item.issueCategory ||
            'Not classified',
        aiDuration: duration,
        aiSummary: item.summary ||
            'No AI summary available.',
        ...(() => {
            const selfHelp = parseTroubleshooting(item.troubleshooting);
            return { aiSteps: selfHelp.steps, aiCheckedSteps: selfHelp.checkedSteps };
        })(),
    };
}
/* ---------- Main Component ---------- */
function ManageAndAssign({ audience = 'administrator', }) {
    const { options: systemOptions } = useSystemOptions();
    const navigate = useNavigate();
    const isSecretary = audience === 'secretary';
    const isIT = audience === 'it';
    const roleNavigation = isSecretary
        ? navigation
            .filter(item => [
            'All Incidents',
            'Manage & Assign',
            'Profile',
        ].includes(item.label))
            .map(item => ({
            ...item,
            path: item.path.replace('/admin', '/secretary'),
        }))
        : isIT
            ? navigation
                .filter(item => [
                'All Incidents',
                'Manage & Assign',
                'Device Monitoring',
                'Profile',
            ].includes(item.label))
                .map(item => ({
                ...item,
                label: item.label === 'Manage & Assign'
                    ? 'My Assignments'
                    : item.label,
                path: item.label === 'Manage & Assign'
                    ? '/it/my-assignments'
                    : item.path.replace('/admin', '/it'),
            }))
            : navigation;
    /* ---------- Authenticated user ---------- */
    const session = getAuthSession();
    const currentUser = session?.user;
    const currentUserName = currentUser?.fullName ||
        getCurrentUserName();
    const currentUserRole = currentUser?.role ||
        getCurrentUserRole() ||
        (isSecretary
            ? 'Secretary'
            : isIT
                ? 'Technician'
                : 'Administrator');
    const profilePath = isSecretary
        ? '/secretary/profile'
        : isIT
            ? '/it/profile'
            : '/admin/profile';
    const user = {
        name: currentUserName,
        role: currentUserRole,
        initial: currentUserName
            .split(/\s+/)
            .map(part => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'U',
        profilePath,
    };
    const [profileAvatar, setProfileAvatar] = useState(() => getProfilePhotoUrl(currentUser?.profilePhoto, currentUser?.fullName, currentUser?.role));
    useEffect(() => {
        const updateProfilePhoto = () => {
            const updatedSession = getAuthSession();
            const updatedUser = updatedSession?.user;
            if (!updatedUser)
                return;
            setProfileAvatar(getProfilePhotoUrl(updatedUser.profilePhoto, updatedUser.fullName, updatedUser.role));
        };
        updateProfilePhoto();
        window.addEventListener('batangai-auth-updated', updateProfilePhoto);
        return () => {
            window.removeEventListener('batangai-auth-updated', updateProfilePhoto);
        };
    }, []);
    const currentUserId = getCurrentUserId();
    /* ---------- UI State ---------- */
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [incidents, setIncidents] = useState([]);
    const [itPersonnel, setItPersonnel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [severityFilter, setSeverityFilter] = useState('All Severities');
    const [assigningId, setAssigningId] = useState(null);
    const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
    const [viewingId, setViewingId] = useState(null);
    const [selectedSeverity, setSelectedSeverity] = useState('');
    const [savingAssignment, setSavingAssignment] = useState(false);
    const [savingSeverity, setSavingSeverity] = useState(false);
    /* ---------- Load Database Data ---------- */
    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [incidentsResponse, personnelResponse,] = await Promise.all([
                fetch(`${API_BASE_URL}/get_incidents.php?userID=${encodeURIComponent(String(currentUserId ?? ''))}`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/it_personnel.php`, { credentials: 'include' }),
            ]);
            if (!incidentsResponse.ok) {
                throw new Error('Unable to retrieve incidents from the server.');
            }
            if (!personnelResponse.ok) {
                throw new Error('Unable to retrieve technicians from the server.');
            }
            const incidentsData = await incidentsResponse.json();
            const personnelData = await personnelResponse.json();
            if (!incidentsData.success) {
                throw new Error(incidentsData.message ||
                    'Failed to load incidents.');
            }
            if (!personnelData.success) {
                throw new Error(personnelData.message ||
                    'Failed to load technicians.');
            }
            const apiIncidents = Array.isArray(incidentsData.incidents)
                ? incidentsData.incidents
                : [];
            const apiPersonnel = Array.isArray(personnelData.personnel)
                ? personnelData.personnel
                : [];
            setIncidents(apiIncidents.map(mapIncident));
            setItPersonnel(apiPersonnel);
        }
        catch (err) {
            console.error('Manage & Assign loading error:', err);
            setError(err instanceof Error
                ? err.message
                : 'Unable to connect to the server.');
            setIncidents([]);
            setItPersonnel([]);
        }
        finally {
            setLoading(false);
        }
    }, [currentUserId]);
    useEffect(() => {
        const timer = window.setTimeout(() => void loadData(), 0);
        return () => window.clearTimeout(timer);
    }, [loadData]);
    // A report can be submitted or assigned from another user's session.
    // Refresh the shared queue so each role sees the change without a manual reload.
    useEffect(() => {
        const refreshInterval = window.setInterval(() => {
            void loadData();
        }, 15000);
        return () => window.clearInterval(refreshInterval);
    }, [loadData]);
    /* ---------- Logout ---------- */
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    /* ---------- Technician View ---------- */
    const visibleIncidents = isIT
        ? incidents.filter(incident => currentUserId !== null &&
            String(incident.assignedToUserId || '') === String(currentUserId))
        : incidents;
    /* ---------- Statistics ---------- */
    const pendingCount = visibleIncidents.filter(i => i.status === 'Pending').length;
    const inProgressCount = visibleIncidents.filter(i => i.status === 'In Progress').length;
    const resolvedCount = visibleIncidents.filter(i => i.status === 'Resolved').length;
    /* ---------- Search ---------- */
    const filtered = visibleIncidents.filter(i => {
        const matchesStatus = statusFilter === 'All Statuses' ||
            i.status === statusFilter;
        const matchesSeverity = severityFilter === 'All Severities' ||
            i.severity === severityFilter;
        const q = search.trim().toLowerCase();
        const matchesSearch = q === '' ||
            i.id.toLowerCase().includes(q) ||
            i.reporter.toLowerCase().includes(q) ||
            i.department.toLowerCase().includes(q);
        return matchesStatus && matchesSeverity && matchesSearch;
    }).sort((a, b) => Number(b.severity === 'High') -
        Number(a.severity === 'High'));
    /* ---------- Assignment ---------- */
    const openAssign = (id) => {
        const incident = incidents.find(i => i.id === id);
        if (!incident || !incident.severity) {
            setError('Set a severity level before assigning a technician.');
            return;
        }
        setError('');
        setViewingId(null);
        setAssigningId(id);
        const existingAssignedId = incident?.assignedToUserId;
        if (existingAssignedId &&
            itPersonnel.some(person => String(person.userID) ===
                String(existingAssignedId))) {
            setSelectedPersonnelId(String(existingAssignedId));
        }
        else {
            setSelectedPersonnelId(itPersonnel.length > 0
                ? String(itPersonnel[0].userID)
                : '');
        }
    };
    const closeAssign = () => {
        if (savingAssignment)
            return;
        setAssigningId(null);
        setSelectedPersonnelId('');
    };
    const confirmAssign = async () => {
        if (!assigningId)
            return;
        const selectedPersonnel = itPersonnel.find(person => String(person.userID) ===
            String(selectedPersonnelId));
        if (!selectedPersonnel) {
            setError('Please select an assignee.');
            return;
        }
        setSavingAssignment(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/assign_incident.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    incidentID: assigningId,
                    assignedTo: selectedPersonnel.userID,
                    assignedToName: selectedPersonnel.fullName,
                    actorUserId: currentUserId,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message ||
                    'Failed to assign the incident.');
            }
            setIncidents(current => current.map(incident => incident.id === assigningId
                ? {
                    ...incident,
                    assignedTo: selectedPersonnel.fullName,
                    assignedToUserId: String(selectedPersonnel.userID),
                    // Assignment only puts the report in the selected IT user's
                    // queue. It becomes In Progress when that user takes action.
                    status: 'Pending',
                }
                : incident));
            setAssigningId(null);
            setSelectedPersonnelId('');
        }
        catch (err) {
            console.error('Assignment error:', err);
            setError(err instanceof Error
                ? err.message
                : 'Failed to assign incident.');
        }
        finally {
            setSavingAssignment(false);
        }
    };
    /* ---------- View Incident ---------- */
    const openView = (id) => {
        const incident = incidents.find(i => i.id === id);
        setSelectedSeverity(incident?.severity ?? '');
        setViewingId(id);
    };
    const closeView = () => {
        if (savingSeverity)
            return;
        setViewingId(null);
    };
    const viewingIncident = incidents.find(i => i.id === viewingId) ?? null;
    /* ---------- Severity ---------- */
    const updateSeverity = async (id, severity) => {
        setSavingSeverity(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/update_incident.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    incidentID: id,
                    severity,
                    actorUserId: getCurrentUserId(),
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message ||
                    'Failed to update severity.');
            }
            setIncidents(current => current.map(incident => incident.id === id
                ? {
                    ...incident,
                    severity,
                }
                : incident));
            setSelectedSeverity(severity);
        }
        catch (err) {
            console.error('Severity update error:', err);
            setError(err instanceof Error
                ? err.message
                : 'Failed to update severity.');
        }
        finally {
            setSavingSeverity(false);
        }
    };
    /* ---------- Render ---------- */
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": `${user.role} navigation`, children: roleNavigation.map(item => (_jsxs("button", { className: item.label ===
                                'Manage & Assign' ||
                                (isIT &&
                                    item.label ===
                                        'My Assignments')
                                ? 'is-active'
                                : '', type: "button", onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(c => !c), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: isIT
                                            ? 'My Assignments'
                                            : 'Manage & Assign Incidents' }), _jsx("p", { children: isIT
                                            ? 'View and manage the incident reports assigned to you.'
                                            : 'View all encoded incidents and assign IT personnel to unresolved reports.' })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: user.name, role: user.role, avatar: profileAvatar, avatarInitial: user.initial, profilePath: user.profilePath, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content", children: [error && (_jsx("div", { style: {
                                    marginBottom: '16px',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    fontSize: '14px',
                                }, children: error })), _jsxs("section", { className: "maa-stats", children: [_jsxs("article", { className: "maa-stat maa-stat--pending", children: [_jsx("i", { children: "\u25F7" }), _jsxs("div", { children: [_jsx("span", { children: "Pending" }), _jsx("strong", { children: pendingCount })] })] }), _jsxs("article", { className: "maa-stat maa-stat--progress", children: [_jsx("i", { children: "\u27F3" }), _jsxs("div", { children: [_jsx("span", { children: "In Progress" }), _jsx("strong", { children: inProgressCount })] })] }), _jsxs("article", { className: "maa-stat maa-stat--resolved", children: [_jsx("i", { children: "\u2713" }), _jsxs("div", { children: [_jsx("span", { children: "Resolved" }), _jsx("strong", { children: resolvedCount })] })] })] }), _jsxs("div", { className: "maa-toolbar-card", children: [_jsxs("label", { className: "maa-search", children: [_jsx(Icon, { name: "search" }), _jsx("input", { type: "text", placeholder: "Search incidents...", value: search, onChange: e => setSearch(e.target.value) })] }), _jsx("label", { className: "maa-status-filter", children: _jsxs("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), children: [_jsx("option", { children: "All Statuses" }), (systemOptions.incident_status ?? []).map(status => _jsx("option", { children: status }, status))] }) }), _jsx("label", { className: "maa-status-filter", children: _jsxs("select", { value: severityFilter, onChange: e => setSeverityFilter(e.target.value), children: [_jsx("option", { children: "All Severities" }), (systemOptions.severity ?? []).map(severity => _jsx("option", { children: severity }, severity))] }) })] }), _jsx("article", { className: "dashboard-card maa-table-card", children: _jsxs("table", { children: [_jsxs("colgroup", { children: [_jsx("col", { className: "maa-col-id" }), _jsx("col", { className: "maa-col-reporter" }), _jsx("col", { className: "maa-col-severity" }), _jsx("col", { className: "maa-col-status" }), _jsx("col", { className: "maa-col-assigned" }), _jsx("col", { className: "maa-col-actions" })] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "ID" }), _jsx("th", { scope: "col", children: "Client" }), _jsx("th", { scope: "col", className: "maa-heading-center", children: "Severity" }), _jsx("th", { scope: "col", className: "maa-heading-center", children: "Status" }), _jsx("th", { scope: "col", children: "Assigned To" }), _jsx("th", { scope: "col", className: "maa-heading-actions", "aria-label": "Actions" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "maa-empty", children: "Loading incidents..." }) })) : (_jsxs(_Fragment, { children: [filtered.map(i => (_jsxs("tr", { children: [_jsx("td", { className: "maa-cell-id", title: i.id, children: i.id }), _jsxs("td", { className: "maa-cell-client", children: [_jsx("strong", { children: _jsx(PersonName, { name: i.reporter, profilePhoto: i.reporterProfilePhoto, compact: true }) }), _jsx("small", { children: i.department })] }), _jsx("td", { className: "maa-cell-center", children: _jsx("span", { className: `tag ${i.severity ? severityTagClass[i.severity] : ''}`, children: i.severity ?? 'Not set' }) }), _jsx("td", { className: "maa-cell-center", children: _jsx("span", { className: `tag ${statusTagClass[i.status]}`, children: i.status }) }), _jsx("td", { className: "maa-cell-assigned", children: _jsx("span", { className: i.assignedTo
                                                                        ? 'maa-assigned'
                                                                        : 'maa-unassigned', children: i.assignedTo ? (_jsx(PersonName, { name: i.assignedTo, profilePhoto: i.assignedToProfilePhoto, compact: true })) : ('Unassigned') }) }), _jsx("td", { className: "maa-cell-actions", children: _jsxs("div", { className: "maa-actions", children: [_jsx("button", { type: "button", className: "maa-view-btn", "aria-label": `View ${i.id}`, onClick: () => openView(i.id), children: _jsx(Icon, { name: "eye" }) }), !isIT && i.status !== 'Resolved' && (_jsxs("button", { type: "button", className: "maa-assign-btn", onClick: () => openAssign(i.id), disabled: !i.severity, title: !i.severity
                                                                                ? 'Set a severity level before assigning a technician.'
                                                                                : undefined, children: [_jsx(Icon, { name: "assign" }), i.assignedTo
                                                                                    ? 'Reassign'
                                                                                    : 'Assign'] }))] }) })] }, i.id))), filtered.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "maa-empty", children: "No incidents match your search or filter." }) }))] })) })] }) })] })] }), assigningId && (_jsx("div", { className: "maa-modal-overlay", role: "dialog", "aria-modal": "true", onClick: closeAssign, children: _jsxs("div", { className: "maa-modal", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "maa-modal-header", children: [_jsx("h2", { children: "Assign Incident" }), _jsx("button", { type: "button", className: "maa-modal-close", "aria-label": "Close", onClick: closeAssign, disabled: savingAssignment, children: _jsx(Icon, { name: "close" }) })] }), _jsxs("p", { className: "maa-modal-sub", children: ["Assigning incident", ' ', _jsx("strong", { children: assigningId })] }), _jsxs("label", { className: "maa-modal-field", children: ["Assignee", _jsx("select", { value: selectedPersonnelId, onChange: e => setSelectedPersonnelId(e.target.value), disabled: savingAssignment ||
                                        itPersonnel.length === 0, children: itPersonnel.length === 0 ? (_jsx("option", { value: "", children: "No eligible assignees available" })) : (itPersonnel.map(person => (_jsxs("option", { value: String(person.userID), children: [person.fullName, " (", person.role === 'Administrator' ? 'Administrator' : 'Technician', ")"] }, String(person.userID))))) })] }), _jsxs("div", { className: "maa-modal-footer", children: [_jsx("button", { type: "button", className: "maa-btn-secondary", onClick: closeAssign, disabled: savingAssignment, children: "Cancel" }), _jsxs("button", { type: "button", className: "maa-btn-primary", onClick: () => void confirmAssign(), disabled: savingAssignment ||
                                        !selectedPersonnelId, children: [_jsx(Icon, { name: "assign" }), savingAssignment
                                            ? 'Assigning...'
                                            : 'Confirm Assignment'] })] })] }) })), viewingIncident && (_jsx(IncidentDetailModal, { incident: viewingIncident, onClose: closeView, showSelfHelpChecklist: true, footer: !isIT &&
                    viewingIncident.status !== 'Resolved' ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "maa-detail-action", children: ["Severity (required)", _jsxs("select", { value: selectedSeverity, "aria-required": "true", onChange: event => void updateSeverity(viewingIncident.id, event.target.value), disabled: savingSeverity, children: [_jsx("option", { value: "", disabled: true, children: "Select severity" }), (systemOptions.severity ?? []).map(severity => _jsx("option", { value: severity, children: severity }, severity))] })] }), _jsx("button", { type: "button", className: "btn-primary", onClick: () => openAssign(viewingIncident.id), disabled: savingSeverity || !viewingIncident.severity, title: !viewingIncident.severity
                                ? 'Set a severity level before assigning this incident.'
                                : undefined, children: viewingIncident.assignedTo
                                ? 'Reassign Assignee'
                                : 'Assign Assignee' })] })) : null }))] }));
}
export default ManageAndAssign;
