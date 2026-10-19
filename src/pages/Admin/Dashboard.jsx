import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { AdminNotifications } from './AdminNotifications';
import { getAuthSession, getProfilePhotoUrl, signOut, } from '../../auth';
import './Dashboard.css';
import { API_BASE_URL } from '../../apiConfig';
function Icon({ name, }) {
    const paths = {
        dashboard: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
        incidents: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2" }), _jsx("path", { d: "M9 4.5h6M9 10h6M9 14h6M9 18h3" })] })),
        devices: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "13", rx: "1.5" }), _jsx("path", { d: "M8 21h8M12 17v4" })] })),
        users: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("circle", { cx: "17", cy: "9", r: "2" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" })] })),
        reports: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" }) })),
        profile: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] })),
        logout: (_jsx(_Fragment, { children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) })),
        menu: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M4 12h16M4 18h16" }) })),
        document: (_jsx(_Fragment, { children: _jsx("path", { d: "M7 3h7l4 4v14H7zM14 3v5h5M10 12h5M10 16h5" }) })),
        resolved: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m8 12 2.7 2.7L16.5 9" })] })),
        progress: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M20 12a8 8 0 1 1-3-6.2" }), _jsx("path", { d: "M20 4v5h-5" })] })),
        pending: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 7v5l3 2" })] })),
        monitor: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "13", rx: "1.5" }), _jsx("path", { d: "M8 21h8M12 17v4" })] })),
        search: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "10.5", cy: "10.5", r: "5.5" }), _jsx("path", { d: "m15 15 4 4" })] })),
        bell: (_jsx(_Fragment, { children: _jsx("path", { d: "M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" }) })),
        chart: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 20V11M10 20V5M16 20v-8M22 20H2" }) })),
        pie: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M12 3v9h9A9 9 0 0 0 12 3Z" }), _jsx("path", { d: "M10 5.2a8 8 0 1 0 8.8 8.8H10Z" })] })),
        online: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m8 12 2.7 2.7L16.5 9" })] })),
        warning: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 7v6M12 17h.01" })] })),
        offline: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m9 9 6 6m0-6-6 6" })] })),
        arrow: (_jsx(_Fragment, { children: _jsx("path", { d: "M5 12h14M13 6l6 6-6 6" }) })),
        wrench: (_jsx("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.4 3.4Z" })),
        robot: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "4", y: "8", width: "16", height: "11", rx: "2.5" }), _jsx("path", { d: "M12 8V4M9 4h6" }), _jsx("circle", { cx: "9", cy: "13.5", r: "1.3" }), _jsx("circle", { cx: "15", cy: "13.5", r: "1.3" }), _jsx("path", { d: "M8.5 17h7" })] })),
        sparkle: (_jsx("path", { d: "M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M6 6l2.2 2.2M15.8 15.8 18 18M18 6l-2.2 2.2M8.2 15.8 6 18" })),
        trending: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M3 17 9.5 10.5 13.5 14.5 21 7" }), _jsx("path", { d: "M15.5 7H21v5.5" })] })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" }), _jsx("path", { d: "M18 8v6M15 11h6" })] })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
/* --------------------------------------------------------------------------
   STAT CARD
--------------------------------------------------------------------------- */
function StatCard({ icon, number, title, tone, }) {
    return (_jsxs("article", { className: `stat-card stat-card--${tone}`, children: [_jsx("div", { className: "stat-icon", children: _jsx(Icon, { name: icon }) }), _jsxs("div", { children: [_jsx("h3", { children: title }), _jsx("strong", { children: number })] })] }));
}
/* --------------------------------------------------------------------------
   NAVIGATION
--------------------------------------------------------------------------- */
const navigation = [
    {
        label: 'Dashboard',
        icon: 'dashboard',
        path: '/admin',
    },
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
const periodOptions = [
    'All Time',
    'This Month',
    'Last Month',
    'This Quarter',
    'This Year',
];
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
/* --------------------------------------------------------------------------
   THEME TOGGLE
--------------------------------------------------------------------------- */
function ThemeToggle({ theme, onToggle, }) {
    const isDark = theme === 'dark';
    return (_jsx("button", { type: "button", className: "theme-toggle-button", onClick: onToggle, "aria-label": isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode', "aria-pressed": isDark, title: isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode', children: isDark ? (_jsxs("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "4.2" }), _jsx("path", { d: "M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" }) })) }));
}
/* --------------------------------------------------------------------------
   PERIOD FILTER
--------------------------------------------------------------------------- */
function PeriodFilter({ value, onChange, }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handleClickOutside = (event) => {
            if (rootRef.current &&
                !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
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
    return (_jsxs("div", { className: "period-filter", ref: rootRef, children: [_jsxs("button", { type: "button", onClick: () => setOpen(current => !current), "aria-haspopup": "menu", "aria-expanded": open, children: [value, _jsx("span", { className: `period-filter-chevron${open ? ' open' : ''}`, children: "\u2304" })] }), open && (_jsx("div", { className: "period-filter-dropdown", role: "menu", children: periodOptions.map(option => (_jsx("button", { type: "button", role: "menuitem", className: option === value
                        ? 'is-selected'
                        : '', onClick: () => {
                        onChange(option);
                        setOpen(false);
                    }, children: option }, option))) }))] }));
}
/* --------------------------------------------------------------------------
   PROFILE MENU
--------------------------------------------------------------------------- */
function ProfileMenu({ name, role, avatar, onLogout, }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const rootRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const handleClickOutside = (event) => {
            if (rootRef.current &&
                !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
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
                            .toUpperCase()) }), _jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("span", { children: role })] }), _jsx("span", { className: `profile-menu-chevron${open ? ' open' : ''}`, children: _jsx("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] }), "My Profile"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => navigate('/admin/settings'), children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6-1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" })] }), "Settings"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] }), "Change Password"] }), _jsx("span", { className: "profile-menu-divider" }), _jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: () => {
                            setOpen(false);
                            onLogout();
                        }, children: [_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) }), "Logout"] })] }))] }));
}
/* --------------------------------------------------------------------------
   DATE HELPERS
--------------------------------------------------------------------------- */
function getDateValue(date) {
    if (!date) {
        return null;
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
}
function isWithinPeriod(dateString, period) {
    // The dashboard summaries use the complete incident collection.  Keep the
    // charts on that same collection unless an administrator explicitly picks a
    // date range. This also prevents an older, but otherwise valid, dataset from
    // rendering as an empty chart on first load.
    if (period === 'All Time') {
        return true;
    }
    const date = getDateValue(dateString);
    if (!date) {
        return false;
    }
    const now = new Date();
    if (period === 'This Month') {
        return (date.getFullYear() ===
            now.getFullYear() &&
            date.getMonth() ===
                now.getMonth());
    }
    if (period === 'Last Month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (date.getFullYear() ===
            lastMonth.getFullYear() &&
            date.getMonth() ===
                lastMonth.getMonth());
    }
    if (period === 'This Quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startMonth = currentQuarter * 3;
        const start = new Date(now.getFullYear(), startMonth, 1);
        const end = new Date(now.getFullYear(), startMonth + 3, 1);
        return (date >= start &&
            date < end);
    }
    if (period === 'This Year') {
        return (date.getFullYear() ===
            now.getFullYear());
    }
    return true;
}
function formatDate(dateString) {
    const date = getDateValue(dateString);
    if (!date) {
        return '—';
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
function formatTime(dateString) {
    const date = getDateValue(dateString);
    if (!date) {
        return '';
    }
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
/* --------------------------------------------------------------------------
   STATUS HELPERS
--------------------------------------------------------------------------- */
function normalizeStatus(status) {
    return (status
        ?.trim()
        .toLowerCase()
        .replace(/_/g, ' ') || '');
}
function getStatusClass(status) {
    const normalized = normalizeStatus(status);
    if (normalized === 'resolved' ||
        normalized === 'closed') {
        return 'resolved-tag';
    }
    if (normalized ===
        'in progress' ||
        normalized ===
            'ongoing') {
        return 'progress-tag';
    }
    return 'pending-tag';
}
function displayStatus(status) {
    const normalized = normalizeStatus(status);
    if (normalized === 'resolved') {
        return 'Resolved';
    }
    if (normalized === 'closed') {
        return 'Closed';
    }
    if (normalized ===
        'in progress' ||
        normalized === 'ongoing') {
        return 'In Progress';
    }
    return 'Pending';
}
function getSeverityClass(severity) {
    switch (severity
        ?.trim()
        .toLowerCase()) {
        case 'high':
            return 'high-tag';
        case 'medium':
            return 'medium-tag';
        default:
            return '';
    }
}
function displaySeverity(severity) {
    const value = severity
        ?.trim()
        .toLowerCase();
    if (value === 'high') {
        return 'High';
    }
    if (value === 'medium') {
        return 'Medium';
    }
    return 'Not set';
}
function normalizeSeverity(severity) {
    const value = severity
        ?.trim()
        .toLowerCase();
    if (value === 'high') {
        return 'high';
    }
    if (value === 'medium') {
        return 'medium';
    }
    if (value === 'low') {
        return 'low';
    }
    return null;
}
/* --------------------------------------------------------------------------
   DASHBOARD
--------------------------------------------------------------------------- */
function Dashboard() {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { theme, toggleTheme, } = useTheme();
    const [chartPeriod, setChartPeriod,] = useState('All Time');
    const [severityPeriod, setSeverityPeriod,] = useState('All Time');
    const [interpretationType, setInterpretationType,] = useState(null);
    const [incidents, setIncidents,] = useState([]);
    const [devices, setDevices,] = useState([]);
    const [loading, setLoading,] = useState(true);
    const [error, setError,] = useState('');
    const session = getAuthSession();
    const currentUser = session?.user;
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    const adminName = currentUser?.fullName ??
        'Administrator';
    const adminRole = currentUser?.role ??
        'Administrator';
    const [adminAvatar, setAdminAvatar] = useState(() => getProfilePhotoUrl(currentUser?.profilePhoto, currentUser?.fullName, currentUser?.role));
    useEffect(() => {
        const updateProfilePhoto = () => {
            const updatedSession = getAuthSession();
            const updatedUser = updatedSession?.user;
            if (!updatedUser) {
                return;
            }
            setAdminAvatar(getProfilePhotoUrl(updatedUser.profilePhoto, updatedUser.fullName, updatedUser.role));
        };
        window.addEventListener('batangai-auth-updated', updateProfilePhoto);
        return () => {
            window.removeEventListener('batangai-auth-updated', updateProfilePhoto);
        };
    }, []);
    /* ------------------------------------------------------------------------
       LOAD DASHBOARD DATA
    ------------------------------------------------------------------------ */
    useEffect(() => {
        let cancelled = false;
        const loadDashboard = async () => {
            setLoading(true);
            setError('');
            try {
                const [incidentsResponse, devicesResponse,] = await Promise.all([
                    fetch(`${API_BASE_URL}/get_incidents.php?userID=${encodeURIComponent(String(currentUser?.userID ?? ''))}`),
                    fetch(`${API_BASE_URL}/devices.php`).catch(() => null),
                ]);
                if (!incidentsResponse.ok) {
                    throw new Error('Failed to load incidents.');
                }
                const incidentsData = await incidentsResponse.json();
                if (!incidentsData.success) {
                    throw new Error(incidentsData.message ||
                        'Failed to load incidents.');
                }
                let loadedIncidents = [];
                if (Array.isArray(incidentsData.incidents)) {
                    loadedIncidents =
                        incidentsData.incidents;
                }
                else if (Array.isArray(incidentsData.data)) {
                    loadedIncidents =
                        incidentsData.data;
                }
                let loadedDevices = [];
                if (devicesResponse &&
                    devicesResponse.ok) {
                    try {
                        const devicesData = await devicesResponse.json();
                        if (Array.isArray(devicesData.devices)) {
                            loadedDevices =
                                devicesData.devices;
                        }
                        else if (Array.isArray(devicesData.data)) {
                            loadedDevices =
                                devicesData.data;
                        }
                    }
                    catch {
                        loadedDevices = [];
                    }
                }
                if (!cancelled) {
                    setIncidents(loadedIncidents);
                    setDevices(loadedDevices);
                }
            }
            catch (loadError) {
                console.error('Dashboard loading error:', loadError);
                if (!cancelled) {
                    setError('Unable to load dashboard data from the database.');
                }
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        loadDashboard();
        return () => {
            cancelled = true;
        };
    }, [currentUser?.userID]);
    /* ------------------------------------------------------------------------
       INCIDENT STATISTICS
    ------------------------------------------------------------------------ */
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(incident => {
        const status = normalizeStatus(incident.status);
        return (status ===
            'resolved' ||
            status === 'closed');
    }).length;
    const inProgressIncidents = incidents.filter(incident => normalizeStatus(incident.status) ===
        'in progress' ||
        normalizeStatus(incident.status) === 'ongoing').length;
    const pendingIncidents = incidents.filter(incident => {
        const status = normalizeStatus(incident.status);
        return (status === '' ||
            status ===
                'pending');
    }).length;
    /* ------------------------------------------------------------------------
       DEPARTMENT DATA
    ------------------------------------------------------------------------ */
    const departmentData = useMemo(() => {
        const filtered = incidents.filter(incident => isWithinPeriod(incident.createdAt, chartPeriod));
        const counts = new Map();
        filtered.forEach(incident => {
            const department = incident.department?.trim() ||
                'Others';
            counts.set(department, (counts.get(department) || 0) + 1);
        });
        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({
            label,
            value,
        }));
        return sorted;
    }, [
        incidents,
        chartPeriod,
    ]);
    /* ------------------------------------------------------------------------
       SEVERITY DATA
    ------------------------------------------------------------------------ */
    const severity = useMemo(() => {
        const filtered = incidents.filter(incident => isWithinPeriod(incident.createdAt, severityPeriod));
        const high = filtered.filter(incident => normalizeSeverity(incident.severity) === 'high').length;
        const medium = filtered.filter(incident => normalizeSeverity(incident.severity) === 'medium').length;
        const low = filtered.filter(incident => normalizeSeverity(incident.severity) === 'low').length;
        const total = high +
            medium +
            low;
        return {
            high,
            medium,
            low,
            highPct: total > 0
                ? Math.round((high / total) *
                    100)
                : 0,
            medPct: total > 0
                ? Math.round((medium / total) *
                    100)
                : 0,
            lowPct: total > 0
                ? Math.round((low / total) *
                    100)
                : 0,
        };
    }, [
        incidents,
        severityPeriod,
    ]);
    const departmentTotal = departmentData.reduce((total, item) => total + item.value, 0);
    const severityTotal = severity.high +
        severity.medium +
        severity.low;
    const leadingDepartment = departmentData[0];
    const dominantSeverity = [
        { label: 'High', count: severity.high, percentage: severity.highPct },
        { label: 'Medium', count: severity.medium, percentage: severity.medPct },
        { label: 'Low', count: severity.low, percentage: severity.lowPct },
    ].sort((a, b) => b.count - a.count)[0];
    /* ------------------------------------------------------------------------
       RECENT INCIDENTS
    ------------------------------------------------------------------------ */
    const recentIncidents = useMemo(() => {
        return [
            ...incidents,
        ]
            .sort((a, b) => {
            const dateA = getDateValue(a.createdAt)?.getTime() ||
                0;
            const dateB = getDateValue(b.createdAt)?.getTime() ||
                0;
            return (dateB - dateA);
        })
            .slice(0, 5);
    }, [incidents]);
    /* ------------------------------------------------------------------------
       DEVICE STATISTICS
    ------------------------------------------------------------------------ */
    const onlineDevices = devices.filter(device => {
        const status = normalizeStatus(device.status);
        return (status === 'online' ||
            status === 'active');
    }).length;
    const maintenanceDevices = devices.filter(device => normalizeStatus(device.status) ===
        'maintenance').length;
    const offlineDevices = devices.filter(device => {
        const status = normalizeStatus(device.status);
        return (status === 'offline' ||
            status === 'down' ||
            status ===
                'not responding');
    }).length;
    /* ------------------------------------------------------------------------
       CHART SETTINGS
    ------------------------------------------------------------------------ */
    const CHART_MAX = Math.max(1, ...departmentData.map(item => item.value));
    /* ------------------------------------------------------------------------
       RENDER
    ------------------------------------------------------------------------ */
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": "Administrator navigation", children: navigation.map(item => (_jsxs("button", { className: item.label ===
                                'Dashboard'
                                ? 'is-active'
                                : '', type: "button", onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(collapsed => !collapsed), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: "Admin Dashboard" }), _jsx("p", { children: "System-wide overview of incidents, devices, and users." })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: adminName, role: adminRole, avatar: adminAvatar, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content", children: [error && (_jsxs("div", { className: "profile-toast", role: "alert", children: [error, _jsx("button", { type: "button", onClick: () => setError(''), "aria-label": "Dismiss", children: "\u00D7" })] })), _jsxs("section", { className: "statistics-grid", children: [_jsx(StatCard, { icon: "document", number: loading
                                            ? '...'
                                            : String(totalIncidents), title: "Total Incidents", tone: "blue" }), _jsx(StatCard, { icon: "resolved", number: loading
                                            ? '...'
                                            : String(resolvedIncidents), title: "Resolved", tone: "green" }), _jsx(StatCard, { icon: "progress", number: loading
                                            ? '...'
                                            : String(inProgressIncidents), title: "In Progress", tone: "purple" }), _jsx(StatCard, { icon: "pending", number: loading
                                            ? '...'
                                            : String(pendingIncidents), title: "Pending", tone: "orange" })] }), _jsxs("section", { className: "dashboard-grid charts-grid", children: [_jsxs("article", { className: "dashboard-card chart-card", children: [_jsxs("header", { children: [_jsxs("h2", { children: [_jsx(Icon, { name: "chart" }), "Incidents by Office"] }), _jsxs("div", { className: "dashboard-chart-controls", children: [_jsx(PeriodFilter, { value: chartPeriod, onChange: setChartPeriod }), _jsx("button", { className: "dashboard-interpret-button", type: "button", onClick: () => setInterpretationType('department'), children: "Interpret" })] })] }), _jsx("div", { className: "office-bar-chart", role: "list", "aria-label": "Incident count by office", children: departmentData.length === 0 ? (_jsx("p", { className: "office-chart-empty", children: "No incidents found for this period." })) : departmentData.map((item, index) => (_jsxs("div", { className: "office-bar-row", role: "listitem", style: { animationDelay: `${Math.min(index, 18) * 35}ms` }, children: [_jsx("span", { className: "office-bar-label", title: item.label, children: item.label }), _jsx("span", { className: "office-bar-track", "aria-label": `${item.value} incidents`, children: _jsx("span", { style: { width: `${Math.max((item.value / CHART_MAX) * 100, item.value > 0 ? 2 : 0)}%` } }) }), _jsx("strong", { className: "office-bar-value", children: item.value })] }, item.label))) }, chartPeriod)] }), _jsxs("div", { className: "dashboard-side-stack", children: [_jsxs("article", { className: "dashboard-card severity-card", children: [_jsxs("header", { children: [_jsxs("h2", { children: [_jsx(Icon, { name: "pie" }), "Severity Breakdown"] }), _jsxs("div", { className: "dashboard-chart-controls", children: [_jsx(PeriodFilter, { value: severityPeriod, onChange: setSeverityPeriod }), _jsx("button", { className: "dashboard-interpret-button", type: "button", onClick: () => setInterpretationType('severity'), children: "Interpret" })] })] }), _jsxs("div", { className: "severity-content", children: [_jsx("div", { className: "donut-chart", style: {
                                                                    background: severity.high +
                                                                        severity.medium +
                                                                        severity.low >
                                                                        0
                                                                        ? `conic-gradient(
                            var(--danger) 0 ${severity.highPct}%,
                            var(--warning) ${severity.highPct}% ${severity.highPct +
                                                                            severity.medPct}%,
                            var(--success) ${severity.highPct +
                                                                            severity.medPct}% 100%
                          )`
                                                                        : 'conic-gradient(#e5e7eb 0 100%)',
                                                                } }), _jsxs("div", { className: "severity-list", children: [_jsxs("p", { className: "high", children: [_jsx("i", {}), "High", _jsx("b", { children: severity.high }), _jsxs("strong", { children: [severity.highPct, "%"] })] }), _jsxs("p", { className: "medium", children: [_jsx("i", {}), "Medium", _jsx("b", { children: severity.medium }), _jsxs("strong", { children: [severity.medPct, "%"] })] }), _jsxs("p", { className: "low", children: [_jsx("i", {}), "Low", _jsx("b", { children: severity.low }), _jsxs("strong", { children: [severity.lowPct, "%"] })] })] })] }, severityPeriod)] }), _jsxs("article", { className: "dashboard-card device-card", children: [_jsxs("header", { children: [_jsxs("h2", { children: [_jsx(Icon, { name: "monitor" }), "Device Status"] }), _jsxs("button", { className: "view-devices", type: "button", onClick: () => navigate('/admin/device-monitoring'), children: ["View All Devices ", _jsx(Icon, { name: "arrow" })] })] }), _jsxs("div", { className: "device-row online", children: [_jsx(Icon, { name: "online" }), _jsxs("p", { children: [_jsx("strong", { children: "Online Devices" }), _jsx("span", { children: "Active and monitored" })] }), _jsx("b", { children: devices.length === 0 && !loading ? '0' : loading ? '...' : onlineDevices })] }), _jsxs("div", { className: "device-row warning", children: [_jsx(Icon, { name: "wrench" }), _jsxs("p", { children: [_jsx("strong", { children: "Maintenance" }), _jsx("span", { children: "Under maintenance" })] }), _jsx("b", { children: loading ? '...' : maintenanceDevices })] }), _jsxs("div", { className: "device-row offline", children: [_jsx(Icon, { name: "offline" }), _jsxs("p", { children: [_jsx("strong", { children: "Offline Devices" }), _jsx("span", { children: "Not responding" })] }), _jsx("b", { children: loading ? '...' : offlineDevices })] })] })] })] }), interpretationType && (createPortal(_jsx("div", { className: "dashboard-interpretation-overlay", role: "presentation", onClick: () => setInterpretationType(null), children: _jsxs("article", { className: "dashboard-interpretation-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "dashboard-interpretation-title", "aria-describedby": "dashboard-interpretation-description", onClick: event => event.stopPropagation(), children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("h2", { id: "dashboard-interpretation-title", children: interpretationType === 'department'
                                                                ? 'Office Report Interpretation'
                                                                : 'Severity Report Interpretation' }), _jsx("p", { id: "dashboard-interpretation-description", children: interpretationType === 'department'
                                                                ? `Incident reports by office · ${chartPeriod}`
                                                                : `Incident severity breakdown · ${severityPeriod}` })] }), _jsx("button", { className: "dashboard-interpretation-close", type: "button", "aria-label": "Close interpretation", onClick: () => setInterpretationType(null), children: "\u00D7" })] }), interpretationType === 'department' ? (_jsxs("section", { className: "dashboard-interpretation-report", children: [_jsxs("p", { className: "dashboard-interpretation-period", children: ["Reporting period: ", _jsx("strong", { children: chartPeriod })] }), _jsxs("div", { className: "dashboard-interpretation-summary", children: [_jsx("span", { children: "Total reported incidents" }), _jsx("strong", { children: departmentTotal })] }), departmentTotal === 0 ? (_jsxs(_Fragment, { children: [_jsx("h3", { children: "Report Interpretation" }), _jsx("p", { className: "dashboard-interpretation-empty", children: "No incidents were recorded by office during this reporting period, so no office trend can be identified." })] })) : (_jsxs(_Fragment, { children: [_jsx("h3", { children: "Report Interpretation" }), _jsxs("p", { className: "dashboard-interpretation-insight", children: ["During ", chartPeriod.toLowerCase(), ", ", departmentTotal, " incident", departmentTotal === 1 ? ' was' : 's were', " reported across the offices shown.", ' ', leadingDepartment
                                                                    ? `${leadingDepartment.label} recorded the most reports (${leadingDepartment.value}, ${Math.round((leadingDepartment.value / departmentTotal) * 100)}% of the total).`
                                                                    : ''] }), _jsx("h3", { className: "dashboard-interpretation-breakdown-title", children: "Office Report Breakdown" }), _jsx("ul", { className: "dashboard-interpretation-list", children: departmentData.map(item => (_jsxs("li", { children: [_jsx("span", { children: item.label }), _jsx("strong", { children: item.value }), _jsxs("span", { children: [Math.round((item.value / departmentTotal) * 100), "%"] })] }, item.label))) })] }))] })) : (_jsxs("section", { className: "dashboard-interpretation-report", children: [_jsxs("p", { className: "dashboard-interpretation-period", children: ["Reporting period: ", _jsx("strong", { children: severityPeriod })] }), _jsxs("div", { className: "dashboard-interpretation-summary", children: [_jsx("span", { children: "Reported incidents with severity" }), _jsx("strong", { children: severityTotal })] }), severityTotal === 0 ? (_jsxs(_Fragment, { children: [_jsx("h3", { children: "Report Interpretation" }), _jsx("p", { className: "dashboard-interpretation-empty", children: "No incidents with an assigned severity level were recorded during this reporting period, so severity trends cannot be assessed." })] })) : (_jsxs(_Fragment, { children: [_jsx("h3", { children: "Report Interpretation" }), _jsxs("p", { className: "dashboard-interpretation-insight", children: ["Of the ", severityTotal, " incidents with an assigned severity,", ' ', dominantSeverity.label.toLowerCase(), " severity was reported most often, accounting for", ' ', dominantSeverity.count, " incident", dominantSeverity.count === 1 ? '' : 's', " (", dominantSeverity.percentage, "% of the total). The remaining reports are distributed across the other severity levels below."] }), _jsx("h3", { className: "dashboard-interpretation-breakdown-title", children: "Severity Report Breakdown" }), _jsxs("ul", { className: "dashboard-interpretation-list", children: [_jsxs("li", { children: [_jsx("span", { children: "High" }), _jsx("strong", { children: severity.high }), _jsxs("span", { children: [severity.highPct, "%"] })] }), _jsxs("li", { children: [_jsx("span", { children: "Medium" }), _jsx("strong", { children: severity.medium }), _jsxs("span", { children: [severity.medPct, "%"] })] }), _jsxs("li", { children: [_jsx("span", { children: "Low" }), _jsx("strong", { children: severity.low }), _jsxs("span", { children: [severity.lowPct, "%"] })] })] })] }))] })), _jsxs("footer", { children: [_jsx("button", { className: "dashboard-print-button", type: "button", onClick: () => window.print(), children: "Print interpretation" }), _jsx("button", { className: "dashboard-interpretation-done", type: "button", onClick: () => setInterpretationType(null), children: "Done" })] })] }) }), document.body)), _jsx("section", { className: "dashboard-grid details-grid", children: _jsxs("article", { className: "dashboard-card recent-card", children: [_jsxs("h2", { children: [_jsx(Icon, { name: "document" }), "Recent Incidents"] }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Title" }), _jsx("th", { children: "Office" }), _jsx("th", { children: "Severity" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Reported At" }), _jsx("th", {})] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, style: {
                                                                textAlign: 'center',
                                                                padding: '30px',
                                                            }, children: "Loading incidents..." }) })) : recentIncidents.length ===
                                                        0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, style: {
                                                                textAlign: 'center',
                                                                padding: '30px',
                                                            }, children: "No incidents found." }) })) : (recentIncidents.map(incident => (_jsxs("tr", { children: [_jsx("td", { children: incident.incidentID }), _jsx("td", { children: incident.affectedIssue ||
                                                                    incident.issueCategory ||
                                                                    incident.summary ||
                                                                    incident.description ||
                                                                    'Network incident' }), _jsx("td", { children: incident.department ||
                                                                    '—' }), _jsx("td", { children: _jsx("span", { className: `tag ${getSeverityClass(incident.severity)}`, children: displaySeverity(incident.severity) }) }), _jsx("td", { children: _jsx("span", { className: `tag ${getStatusClass(incident.status)}`, children: displayStatus(incident.status) }) }), _jsxs("td", { children: [formatDate(incident.createdAt), _jsx("br", {}), formatTime(incident.createdAt)] }), _jsx("td", { children: "\u22EE" })] }, incident.incidentID)))) })] }), _jsxs("button", { className: "view-all", type: "button", onClick: () => navigate('/admin/incidents'), children: ["View All Incidents", _jsx(Icon, { name: "arrow" })] })] }) }), _jsx("section", { className: "dashboard-grid", children: _jsxs("article", { className: "dashboard-card ai-insights-card", children: [_jsxs("h2", { children: [_jsx(Icon, { name: "robot" }), "System Overview", _jsx(Icon, { name: "sparkle" })] }), _jsxs("div", { className: "ai-insights-body", children: [_jsxs("div", { className: "ai-insight-item", children: [_jsx("div", { className: "ai-insight-icon ai-insight-icon--blue", children: _jsx(Icon, { name: "trending" }) }), _jsx("p", { children: "The dashboard displays live incident data from the database." })] }), _jsxs("div", { className: "ai-insight-item", children: [_jsx("div", { className: "ai-insight-icon ai-insight-icon--purple", children: _jsx(Icon, { name: "incidents" }) }), _jsx("p", { children: "Incident statistics are automatically calculated from submitted reports." })] }), _jsxs("div", { className: "ai-insight-item", children: [_jsx("div", { className: "ai-insight-icon ai-insight-icon--orange", children: _jsx(Icon, { name: "monitor" }) }), _jsx("p", { children: "Device status will be managed through the Device Monitoring module." })] }), _jsxs("div", { className: "ai-recommended-action", children: [_jsx("span", { children: "AI Module" }), _jsx("p", { children: "AI-assisted troubleshooting will be integrated after the system interfaces and dashboards are completed." })] })] })] }) })] })] })] }));
}
export default Dashboard;
