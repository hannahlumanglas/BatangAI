import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { getAuthSession, getCurrentUserId, getRoleDisplayName, getProfilePhotoUrl, signOut, } from '../../auth';
import { PersonName } from '../../components/PersonName';
import { IncidentDetailModal } from '../../components/IncidentDetailModal';
import { AdminNotifications } from './AdminNotifications';
import './Dashboard.css';
import './Incidents.css';
import { API_BASE_URL } from '../../apiConfig';
import { useSystemOptions } from '../../hooks/useSystemOptions';
import { IncidentDescriptionFields, IncidentDetailsFields, } from '../Employee/ReportIncident';
import { analyzeIncidentWithAI } from '../../utils/incidentAi';
import { useAppDialog } from '../../components/AppDialog';
function Icon({ name }) {
    const paths = {
        dashboard: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
        incidents: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2" }), _jsx("path", { d: "M9 4.5h6M9 10h6M9 14h6M9 18h3" })] })),
        devices: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "13", rx: "1.5" }), _jsx("path", { d: "M8 21h8M12 17v4" })] })),
        users: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("circle", { cx: "17", cy: "9", r: "2" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" })] })),
        reports: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" }) })),
        profile: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] })),
        logout: (_jsx(_Fragment, { children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) })),
        menu: _jsx("path", { d: "M4 6h16M4 12h16M4 18h16" }),
        bell: (_jsx(_Fragment, { children: _jsx("path", { d: "M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" }) })),
        search: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "10.5", cy: "10.5", r: "5.5" }), _jsx("path", { d: "m15 15 4 4" })] })),
        view: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })),
        more: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "5", r: "1.3" }), _jsx("circle", { cx: "12", cy: "12", r: "1.3" }), _jsx("circle", { cx: "12", cy: "19", r: "1.3" })] })),
        sparkle: (_jsx("path", { d: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" })),
        'check-circle': (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m8.3 12.3 2.4 2.4L15.8 9.6" })] })),
        'x-circle': (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" })] })),
        walk: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "13", cy: "4.5", r: "1.8" }), _jsx("path", { d: "M13 7.3 9.5 9l1 3.2-3 2.3M13 7.3l2.5 2.2-.8 3.3 2.8 3M9.5 9l3.5-.5 2 1.5" })] })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" }), _jsx("path", { d: "M18 8v6M15 11h6" })] })),
        close: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
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
    {
        label: 'My Assignments',
        icon: 'assign',
        path: '/admin/my-assignments',
    },
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
/* ===========================================================
   FILTERS
   =========================================================== */
/* ===========================================================
   NEW INCIDENT FORM
   =========================================================== */
const initialIncidentFormValues = {
    severity: '',
    department: '',
    location: '',
    issueCategory: '',
    deviceType: '',
    connectionType: '',
    affectedService: '',
    description: '',
};
function buildIncidentSummary(values) {
    const report = [values.affectedService.trim(), values.description.trim()].filter(Boolean).join(': ');
    const details = [
        values.department && `office: ${values.department.trim()}`,
        values.location && `location: ${values.location.trim()}`,
        values.issueCategory && `category: ${values.issueCategory.trim()}`,
        values.deviceType && `device: ${values.deviceType.trim()}`,
        values.connectionType && `connection: ${values.connectionType.trim()}`,
    ].filter(Boolean);
    return details.length ? `${report} (${details.join('; ')}).` : report;
}
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
/* ===========================================================
   PROFILE MENU
   =========================================================== */
function ProfileMenu({ name, role, avatar, onLogout, profilePath = '/admin/profile', }) {
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
    return (_jsxs("div", { className: "profile-menu-root", ref: rootRef, children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(current => !current), "aria-haspopup": "menu", "aria-expanded": open, children: [_jsx("div", { className: "topbar-avatar", children: avatar ? (_jsx("img", { src: avatar, alt: "" })) : (name
                            .split(/\s+/)
                            .map(part => part[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()) }), _jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("span", { children: getRoleDisplayName(role) })] }), _jsx("span", { className: `profile-menu-chevron${open ? ' open' : ''}`, children: _jsx("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsx("button", { type: "button", role: "menuitem", onClick: goToProfile, children: "My Profile" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate(profilePath.replace('/profile', '/settings'));
                        }, children: "Settings" }), _jsx("button", { type: "button", role: "menuitem", onClick: goToProfile, children: "Change Password" }), _jsx("span", { className: "profile-menu-divider" }), _jsx("button", { type: "button", role: "menuitem", className: "danger", onClick: () => {
                            setOpen(false);
                            onLogout();
                        }, children: "Logout" })] }))] }));
}
/* ===========================================================
   PAGE
   =========================================================== */
function Incidents({ audience = 'administrator', }) {
    const { options } = useSystemOptions();
    const { showAlert, showConfirm } = useAppDialog();
    const navigate = useNavigate();
    const location = useLocation();
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
    const session = getAuthSession();
    const currentUser = session?.user;
    const user = isSecretary
        ? {
            name: currentUser?.fullName || 'Secretary',
            role: currentUser?.role || 'Secretary',
            initial: 'S',
            profilePath: '/secretary/profile',
        }
        : isIT
            ? {
                name: currentUser?.fullName || 'Technician',
                role: currentUser?.role || 'IT Personnel',
                initial: 'I',
                profilePath: '/it/profile',
            }
            : {
                name: currentUser?.fullName || 'Administrator',
                role: currentUser?.role || 'Administrator',
                initial: 'A',
                profilePath: '/admin/profile',
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
    const { theme, toggleTheme, } = useTheme();
    const handleLogout = () => {
        signOut();
        navigate('/', { replace: true });
    };
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    /* =========================================================
       REAL DATABASE INCIDENTS
       ========================================================= */
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const fetchIncidents = useCallback(async () => {
        try {
            setLoading(true);
            setApiError('');
            const currentUserId = getCurrentUserId();
            if (currentUserId === null) {
                throw new Error('Your login session could not be verified. Please log in again.');
            }
            const response = await fetch(`${API_BASE_URL}/get_incidents.php?userID=${encodeURIComponent(String(currentUserId))}${isIT ? '&scope=all' : ''}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
                cache: 'no-store',
            });
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            }
            catch {
                console.error('Invalid JSON from get_incidents.php:', responseText);
                throw new Error('The server returned an invalid response.');
            }
            if (!response.ok ||
                !data.success) {
                throw new Error(data.message ||
                    'Failed to load incidents.');
            }
            setIncidents(Array.isArray(data.incidents)
                ? data.incidents
                : []);
        }
        catch (error) {
            console.error('Fetch incidents error:', error);
            setApiError(error instanceof Error
                ? error.message
                : 'Unable to load incidents.');
        }
        finally {
            setLoading(false);
        }
    }, [isIT]);
    useEffect(() => {
        const timer = window.setTimeout(() => void fetchIncidents(), 0);
        return () => window.clearTimeout(timer);
    }, [fetchIncidents]);
    /* =========================================================
       FILTERS
       ========================================================= */
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [severityFilter, setSeverityFilter] = useState('All Severity');
    const [departmentFilter, setDepartmentFilter] = useState('All Offices');
    const departmentOptions = useMemo(() => {
        const departments = Array.from(new Set(incidents
            .map(incident => incident.department)
            .filter(Boolean)));
        return [
            'All Offices',
            ...departments,
        ];
    }, [incidents]);
    const filteredIncidents = useMemo(() => {
        const q = query.trim().toLowerCase();
        return incidents.filter(incident => {
            const matchesQuery = q === '' ||
                [
                    incident.incidentID,
                    incident.employeeName,
                    incident.affectedIssue,
                    incident.description,
                    incident.department,
                    incident.issueCategory,
                    incident.location,
                    incident.deviceType,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(q);
            const matchesStatus = statusFilter ===
                'All Status' ||
                incident.status ===
                    statusFilter;
            const matchesSeverity = severityFilter ===
                'All Severity' ||
                incident.severity ===
                    severityFilter;
            const matchesDepartment = departmentFilter ===
                'All Offices' ||
                incident.department ===
                    departmentFilter;
            return (matchesQuery &&
                matchesStatus &&
                matchesSeverity &&
                matchesDepartment);
        });
    }, [
        incidents,
        query,
        statusFilter,
        severityFilter,
        departmentFilter,
    ]);
    /* =========================================================
       VIEW / ACTION MENU
       ========================================================= */
    const [viewingId, setViewingId] = useState(null);
    const routeState = location.state;
    const requestedIncidentId = routeState?.openIncidentId;
    useEffect(() => {
        if (typeof requestedIncidentId !== 'string' || loading)
            return;
        navigate(location.pathname, { replace: true, state: null });
    }, [loading, location.pathname, navigate, requestedIncidentId]);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, right: 0 });
    useEffect(() => {
        if (actionMenuId === null) {
            return;
        }
        const handleOutsidePointerDown = (event) => {
            const target = event.target;
            if (target instanceof Element &&
                target.closest('.incident-more-menu, .incident-row-menu')) {
                return;
            }
            setActionMenuId(null);
        };
        document.addEventListener('pointerdown', handleOutsidePointerDown, true);
        return () => {
            document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
        };
    }, [actionMenuId]);
    const viewingIncident = incidents.find(incident => incident.incidentID === viewingId || incident.incidentID === requestedIncidentId) ?? null;
    const closeViewing = () => {
        setViewingId(null);
        setActionMenuId(null);
    };
    const handleDeleteIncident = async (incident) => {
        setActionMenuId(null);
        if (incident.status !== 'Pending') {
            void showAlert('Only pending incidents can be deleted. Incidents already being worked on or resolved must be managed by a Technician or an Administrator.');
            return;
        }
        if (!await showConfirm(`Delete incident ${incident.incidentID}? This cannot be undone.`, 'Delete incident?')) {
            return;
        }
        try {
            setDeletingId(incident.incidentID);
            const response = await fetch(`${API_BASE_URL}/delete_incident.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ incidentID: incident.incidentID }),
            });
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            }
            catch {
                console.error('Invalid JSON from delete_incident.php:', responseText);
                throw new Error('The server returned an invalid response.');
            }
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete the incident.');
            }
            setIncidents(current => current.filter(item => item.incidentID !== incident.incidentID));
        }
        catch (error) {
            console.error('Delete incident error:', error);
            void showAlert(error instanceof Error ? error.message : 'Failed to delete the incident.');
        }
        finally {
            setDeletingId(null);
        }
    };
    const [editingIncident, setEditingIncident] = useState(null);
    const [editValues, setEditValues] = useState(initialIncidentFormValues);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState('');
    const openEditIncident = (incident) => {
        setActionMenuId(null);
        if (incident.status === 'Resolved' || incident.status === 'Closed')
            return;
        setEditValues({
            severity: incident.severity ?? '',
            department: incident.department,
            location: incident.location,
            issueCategory: incident.issueCategory,
            deviceType: incident.deviceType ?? '',
            connectionType: incident.connectionType ?? '',
            affectedService: incident.affectedIssue,
            description: incident.description,
        });
        setEditError('');
        setEditingIncident(incident);
    };
    const closeEditIncident = () => {
        if (savingEdit)
            return;
        setEditingIncident(null);
        setEditError('');
    };
    const handleEditIncidentFieldChange = (field, value) => {
        setEditValues(current => ({ ...current, [field]: value }));
    };
    const handleSaveIncidentEdit = async (event) => {
        event.preventDefault();
        if (!editingIncident || savingEdit)
            return;
        setSavingEdit(true);
        setEditError('');
        let analysis = null;
        try {
            try {
                analysis = await analyzeIncidentWithAI(editValues);
            }
            catch (analysisError) {
                console.warn('AI analysis refresh failed; saving edited incident details with a generated summary.', analysisError);
            }
            const summary = analysis?.summary ?? buildIncidentSummary(editValues);
            const userId = getCurrentUserId();
            if (userId === null)
                throw new Error('Your login session could not be verified. Please log in again.');
            const troubleshooting = analysis
                ? `Basic Self-Help:\n${analysis.basicSelfHelp}\n\nIT Troubleshooting Suggestions:\n${analysis.itTroubleshooting}`
                : editingIncident.troubleshooting;
            const response = await fetch(`${API_BASE_URL}/update_incident.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    incidentID: editingIncident.incidentID,
                    actorUserId: String(userId),
                    department: editValues.department,
                    location: editValues.location,
                    issueCategory: editValues.issueCategory,
                    deviceType: editValues.deviceType,
                    connectionType: editValues.connectionType,
                    affectedIssue: editValues.affectedService,
                    description: editValues.description,
                    severity: editValues.severity,
                    classification: analysis?.classification ?? editingIncident.classification,
                    keywords: analysis?.keywords ?? editingIncident.keywords ?? [],
                    summary,
                    troubleshooting: troubleshooting ?? '',
                }),
            });
            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            }
            catch {
                console.error('Invalid JSON from update_incident.php:', responseText);
                throw new Error('The server returned an invalid response.');
            }
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to update the incident.');
            }
            setIncidents(current => current.map(incident => incident.incidentID === editingIncident.incidentID
                ? {
                    ...incident,
                    department: editValues.department,
                    location: editValues.location,
                    issueCategory: editValues.issueCategory,
                    deviceType: editValues.deviceType,
                    connectionType: editValues.connectionType,
                    affectedIssue: editValues.affectedService,
                    description: editValues.description,
                    severity: editValues.severity || null,
                    classification: analysis?.classification ?? incident.classification,
                    keywords: analysis?.keywords ?? incident.keywords,
                    summary,
                    troubleshooting: troubleshooting ?? incident.troubleshooting,
                }
                : incident));
            setEditingIncident(null);
            if (!analysis) {
                void showAlert('Incident changes were saved. The AI service was unavailable, so the summary was updated from the report information.');
            }
        }
        catch (error) {
            console.error('Save incident edit error:', error);
            setEditError(error instanceof Error ? error.message : 'Failed to update the incident.');
        }
        finally {
            setSavingEdit(false);
        }
    };
    /* =========================================================
       NEW INCIDENT MODAL
       ========================================================= */
    const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
    const [values, setValues] = useState(() => ({
        ...initialIncidentFormValues,
        department: getAuthSession()?.user.department?.trim() ?? '',
    }));
    const [analyzingNewIncident, setAnalyzingNewIncident] = useState(false);
    const [submittingNewIncident, setSubmittingNewIncident] = useState(false);
    const [newIncidentAnalysis, setNewIncidentAnalysis] = useState(null);
    const [newIncidentAnalysisError, setNewIncidentAnalysisError] = useState('');
    const overlayRef = useRef(null);
    const openNewIncident = () => {
        // Read the current session when opening the form so the reporter's
        // registered department is populated even if their profile changed.
        setValues({
            ...initialIncidentFormValues,
            department: getAuthSession()?.user.department?.trim() ?? '',
        });
        setNewIncidentAnalysis(null);
        setNewIncidentAnalysisError('');
        setIsNewIncidentOpen(true);
    };
    const closeNewIncident = () => {
        setIsNewIncidentOpen(false);
    };
    const handleNewIncidentFieldChange = (field, value) => {
        setValues(previous => ({ ...previous, [field]: value }));
        setNewIncidentAnalysis(null);
        setNewIncidentAnalysisError('');
    };
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (viewingId) {
                    closeViewing();
                }
                if (isNewIncidentOpen) {
                    closeNewIncident();
                }
                if (editingIncident && !savingEdit) {
                    setEditingIncident(null);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        viewingId,
        isNewIncidentOpen,
        editingIncident,
        savingEdit,
    ]);
    const handleSubmitNewIncident = async (event) => {
        event.preventDefault();
        if (analyzingNewIncident || submittingNewIncident) {
            return;
        }
        setNewIncidentAnalysisError('');
        if (!newIncidentAnalysis) {
            setAnalyzingNewIncident(true);
            try {
                const analysis = await analyzeIncidentWithAI(values);
                setNewIncidentAnalysis(analysis);
            }
            catch (error) {
                setNewIncidentAnalysisError(error instanceof Error
                    ? error.message
                    : 'AI assistance is currently unavailable. Please try again.');
            }
            finally {
                setAnalyzingNewIncident(false);
            }
            return;
        }
        const userId = getCurrentUserId();
        if (userId === null || user.role !== 'Administrator') {
            setNewIncidentAnalysisError('Only a signed-in Administrator can submit this incident report.');
            return;
        }
        setSubmittingNewIncident(true);
        try {
            const response = await fetch(`${API_BASE_URL}/create_incident.php`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    userId: String(userId),
                    resolvedByUser: false,
                    affectedIssue: values.affectedService,
                    description: values.description,
                    issueCategory: values.issueCategory,
                    deviceType: values.deviceType,
                    connectionType: values.connectionType,
                    location: values.location,
                    severity: values.severity || null,
                    classification: newIncidentAnalysis.classification,
                    keywords: newIncidentAnalysis.keywords,
                    summary: newIncidentAnalysis.summary,
                    troubleshooting: `Basic Self-Help:\n${newIncidentAnalysis.basicSelfHelp}\n\nIT Troubleshooting Suggestions:\n${newIncidentAnalysis.itTroubleshooting}`,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to submit the incident report.');
            }
            setIsNewIncidentOpen(false);
            setNewIncidentAnalysis(null);
            setValues({ ...initialIncidentFormValues, department: getAuthSession()?.user.department?.trim() ?? '' });
            await fetchIncidents();
            void showAlert('Incident report submitted successfully.');
        }
        catch (error) {
            setNewIncidentAnalysisError(error instanceof Error ? error.message : 'Failed to submit the incident report.');
        }
        finally {
            setSubmittingNewIncident(false);
        }
    };
    const handleOverlayMouseDown = (event) => {
        if (event.target ===
            overlayRef.current) {
            closeNewIncident();
        }
    };
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": `${user.role} navigation`, children: roleNavigation.map(item => (_jsxs("button", { className: item.label ===
                                'All Incidents'
                                ? 'is-active'
                                : '', type: "button", onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(value => !value), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: isIT ? 'All Incidents' : 'All Incident Reports' }), _jsx("p", { children: isIT
                                            ? 'View reported incidents across offices. Manage your assigned work in My Assignments.'
                                            : 'Monitor all network incident reports across all offices.' })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: user.name, role: user.role, avatar: profileAvatar, profilePath: user.profilePath, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content", children: [_jsxs("section", { className: "incident-tools", children: [_jsxs("label", { className: "incident-search", children: [_jsx(Icon, { name: "search" }), _jsx("input", { value: query, onChange: e => setQuery(e.target.value), placeholder: "Search incidents..." })] }), user.role === 'Administrator' && _jsx("button", { className: "incident-new", type: "button", onClick: openNewIncident, children: "+ New Incident" })] }), _jsxs("section", { className: "incident-filters", children: [_jsx("label", { className: "incident-filter-select", children: _jsx("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), children: [
                                                'All Status',
                                                ...(options.incident_status ?? []).filter(option => option !== 'Closed'),
                                            ].map(option => (_jsx("option", { value: option, children: option }, option))) }) }), _jsx("label", { className: "incident-filter-select", children: _jsx("select", { value: severityFilter, onChange: e => setSeverityFilter(e.target.value), children: [
                                                'All Severity',
                                                ...(options.severity ?? []).filter(option => option.toLowerCase() !== 'critical'),
                                            ].map(option => (_jsx("option", { value: option, children: option }, option))) }) }), _jsx("label", { className: "incident-filter-select", children: _jsx("select", { value: departmentFilter, onChange: e => setDepartmentFilter(e.target.value), children: departmentOptions.map(option => (_jsx("option", { value: option, children: option }, option))) }) })] }), apiError && (_jsxs("div", { style: {
                                    padding: '16px 20px',
                                    marginBottom: '16px',
                                    borderRadius: '10px',
                                    border: '1px solid #f1aeb5',
                                    background: '#f8d7da',
                                    color: '#842029',
                                }, children: [_jsx("strong", { children: "Unable to load incidents." }), _jsx("div", { children: apiError }), _jsx("button", { type: "button", onClick: fetchIncidents, style: {
                                            marginTop: '10px',
                                            cursor: 'pointer',
                                        }, children: "Try Again" })] })), _jsx("article", { className: "dashboard-card incidents-table-card", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "CLIENT" }), _jsx("th", { children: "SEVERITY" }), _jsx("th", { children: "STATUS" }), _jsx("th", { children: "ACTION" }), _jsx("th", { className: "incident-table-spacer", "aria-hidden": "true" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: {
                                                        textAlign: 'center',
                                                        padding: '40px 20px',
                                                    }, children: "Loading incident reports..." }) })) : (_jsxs(_Fragment, { children: [filteredIncidents.map(incident => (_jsxs("tr", { children: [_jsx("td", { children: incident.incidentID }), _jsx("td", { children: _jsx(PersonName, { name: incident.employeeName, profilePhoto: incident.reporterProfilePhoto, compact: true }) }), _jsx("td", { children: _jsx("span", { className: incident.severity ? `tag ${incident.severity.toLowerCase()}-tag` : 'tag', children: incident.severity ?? 'Not set' }) }), _jsx("td", { children: _jsx("span", { className: `tag status-${incident.status
                                                                        .toLowerCase()
                                                                        .replace(' ', '-')} ${incident.status ===
                                                                        'Resolved'
                                                                        ? 'resolved-tag'
                                                                        : incident.status ===
                                                                            'In Progress'
                                                                            ? 'progress-tag'
                                                                            : 'pending-tag'}`, children: incident.status }) }), _jsxs("td", { className: "incident-actions", children: [_jsxs("button", { className: "view-all incident-view", type: "button", onClick: () => setViewingId(incident.incidentID), children: [_jsx(Icon, { name: "view" }), "View"] }), !isIT && _jsxs("div", { className: "incident-more-menu", children: [_jsx("button", { className: "more-button", type: "button", "aria-label": `More actions for ${incident.incidentID}`, "aria-expanded": actionMenuId ===
                                                                                    incident.incidentID, onClick: event => {
                                                                                    if (actionMenuId === incident.incidentID) {
                                                                                        setActionMenuId(null);
                                                                                        return;
                                                                                    }
                                                                                    const rect = event.currentTarget.getBoundingClientRect();
                                                                                    const menuHeight = 88;
                                                                                    setActionMenuPosition({
                                                                                        top: window.innerHeight - rect.bottom < menuHeight + 12
                                                                                            ? Math.max(8, rect.top - menuHeight - 6)
                                                                                            : rect.bottom + 6,
                                                                                        right: Math.max(8, window.innerWidth - rect.right),
                                                                                    });
                                                                                    setActionMenuId(incident.incidentID);
                                                                                }, children: _jsx(Icon, { name: "more" }) }), actionMenuId === incident.incidentID && createPortal(_jsxs("div", { className: "incident-row-menu", style: { top: actionMenuPosition.top, right: actionMenuPosition.right }, children: [_jsx("button", { type: "button", disabled: incident.status === 'Resolved' || incident.status === 'Closed', title: incident.status === 'Resolved' || incident.status === 'Closed' ? 'Resolved incidents cannot be edited.' : undefined, onClick: () => {
                                                                                            openEditIncident(incident);
                                                                                        }, children: "Edit" }), _jsx("button", { className: "incident-delete-action", type: "button", disabled: incident.status !== 'Pending' || deletingId === incident.incidentID, title: incident.status !== 'Pending' ? 'Only pending incidents can be deleted.' : undefined, onClick: () => void handleDeleteIncident(incident), children: "Delete" })] }), document.body)] })] }), _jsx("td", { className: "incident-table-spacer", "aria-hidden": "true" })] }, incident.incidentID))), !loading &&
                                                        filteredIncidents.length ===
                                                            0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, style: {
                                                                textAlign: 'center',
                                                                color: 'var(--text)',
                                                                padding: '32px 21px',
                                                            }, children: incidents.length ===
                                                                0
                                                                ? 'No incident reports have been submitted yet.'
                                                                : 'No incidents match your search or filters.' }) }))] })) })] }) })] })] }), isNewIncidentOpen && (_jsx("div", { className: "modal-overlay", ref: overlayRef, onMouseDown: handleOverlayMouseDown, children: _jsxs("div", { className: "new-incident-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "new-incident-title", children: [_jsxs("header", { className: "new-incident-header", children: [_jsx("div", { children: _jsx("h2", { id: "new-incident-title", children: "Report a Network Incident" }) }), _jsx("button", { className: "modal-close", type: "button", "aria-label": "Close dialog", onClick: closeNewIncident, children: "\u00D7" })] }), _jsxs("form", { className: "new-incident-body", onSubmit: handleSubmitNewIncident, children: [_jsxs("div", { className: "incident-form", children: [_jsx(IncidentDetailsFields, { values: values, onChange: handleNewIncidentFieldChange, showSeverity: true }), _jsx(IncidentDescriptionFields, { values: values, onChange: handleNewIncidentFieldChange }), newIncidentAnalysisError && (_jsx("p", { className: "incident-field-error", role: "alert", children: newIncidentAnalysisError })), newIncidentAnalysis && (_jsxs("section", { className: "incident-ai-analysis", "aria-live": "polite", children: [_jsx("h3", { className: "incident-ai-analysis-title", children: "BatangAI Analysis" }), _jsxs("div", { className: "incident-ai-summary-grid", children: [_jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "Classification" }), _jsx("p", { children: newIncidentAnalysis.classification })] }), _jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "Keywords" }), _jsx("p", { children: newIncidentAnalysis.keywords.join(', ') })] }), _jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "Summary" }), _jsx("p", { children: newIncidentAnalysis.summary })] }), _jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "Possible Interpretation" }), _jsx("p", { children: newIncidentAnalysis.possibleInterpretation })] }), _jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "Basic Self-Help" }), _jsx("p", { style: { whiteSpace: 'pre-line' }, children: newIncidentAnalysis.basicSelfHelp })] }), _jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "IT Troubleshooting Suggestions" }), _jsx("p", { style: { whiteSpace: 'pre-line' }, children: newIncidentAnalysis.itTroubleshooting })] })] })] }))] }), _jsxs("footer", { className: "new-incident-footer", children: [_jsx("button", { className: "btn-secondary btn-block", type: "button", onClick: closeNewIncident, children: "Cancel" }), _jsx("button", { className: "btn-primary btn-block", type: "submit", disabled: analyzingNewIncident || submittingNewIncident, children: analyzingNewIncident ? 'Analyzing with BatangAI…' : submittingNewIncident ? 'Submitting...' : newIncidentAnalysis ? 'Submit Incident Report' : 'Analyze with BatangAI' })] })] })] }) })), editingIncident && (_jsx("div", { className: "modal-overlay", onMouseDown: event => {
                    if (event.target === event.currentTarget)
                        closeEditIncident();
                }, children: _jsxs("section", { className: "new-incident-modal edit-incident-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "edit-incident-title", children: [_jsxs("header", { className: "new-incident-header", children: [_jsx("div", { children: _jsx("h2", { id: "edit-incident-title", children: "Edit Incident" }) }), _jsx("button", { className: "modal-close", type: "button", "aria-label": "Close dialog", onClick: closeEditIncident, disabled: savingEdit, children: "\u00D7" })] }), _jsxs("form", { className: "new-incident-body", onSubmit: event => void handleSaveIncidentEdit(event), children: [_jsxs("div", { className: "incident-form", children: [_jsx(IncidentDetailsFields, { values: editValues, onChange: handleEditIncidentFieldChange, departmentEditable: true, showSeverity: true }), _jsx(IncidentDescriptionFields, { values: editValues, onChange: handleEditIncidentFieldChange }), editError && _jsx("p", { className: "incident-field-error", role: "alert", children: editError })] }), _jsxs("footer", { className: "new-incident-footer", children: [_jsx("button", { className: "btn-secondary btn-block", type: "button", onClick: closeEditIncident, disabled: savingEdit, children: "Cancel" }), _jsx("button", { className: "btn-primary btn-block", type: "submit", disabled: savingEdit, children: savingEdit ? 'Saving...' : 'Save Changes' })] })] })] }) })), viewingIncident && (_jsx(IncidentDetailModal, { incident: viewingIncident, onClose: closeViewing, showSelfHelpChecklist: true, showTechnicianChecklist: true }))] }));
}
export default Incidents;
