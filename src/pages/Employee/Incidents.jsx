import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../../auth';
import logo from '../../assets/logo.png';
import { AdminNotifications } from '../Admin/AdminNotifications';
import { ProfileMenu } from './Profile';
import { getAuthSession } from '../../auth';
import { IncidentDetailModal } from '../../components/IncidentDetailModal';
import { useAppDialog } from '../../components/AppDialog';
import { analyzeIncidentWithAI } from '../../utils/incidentAi';
import { IncidentDetailsFields, IncidentDescriptionFields, } from './ReportIncident';
import '../Admin/Dashboard.css';
import './Incidents.css';
import './ReportIncident.css';
import { API_BASE_URL } from '../../apiConfig';
function Icon({ name }) {
    const paths = {
        report: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M7 3h7l4 4v14H7z" }), _jsx("path", { d: "M14 3v5h5M10 12h5M10 16h5" })] })),
        incidents: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2" }), _jsx("path", { d: "M9 4.5h6M9 10h6M9 14h6M9 18h3" })] })),
        profile: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] })),
        menu: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M4 12h16M4 18h16" }) })),
        logout: (_jsx(_Fragment, { children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) })),
        eye: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" }), _jsx("circle", { cx: "12", cy: "12", r: "2.5" })] })),
        more: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "5", r: "1", fill: "currentColor" }), _jsx("circle", { cx: "12", cy: "12", r: "1", fill: "currentColor" }), _jsx("circle", { cx: "12", cy: "19", r: "1", fill: "currentColor" })] })),
        edit: (_jsxs(_Fragment, { children: [_jsx("path", { d: "m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" }), _jsx("path", { d: "m13.8 7.2 3 3" })] })),
        trash: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 7h16M10 11v5M14 11v5M6 7l1 14h10l1-14M9 7V4h6v3" }) })),
        close: (_jsx(_Fragment, { children: _jsx("path", { d: "m6 6 12 12M18 6 6 18" }) })),
        check: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m8 12 2.7 2.7L16.5 9" })] })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
const navigation = [
    {
        label: 'Report Incident',
        icon: 'report',
        path: '/employee/report-incident',
    },
    {
        label: 'All Incidents',
        icon: 'incidents',
        path: '/employee/incidents',
    },
    {
        label: 'Profile',
        icon: 'profile',
        path: '/employee/profile',
    },
];
const statusTagClass = {
    Pending: 'pending-tag',
    'In Progress': 'progress-tag',
    Resolved: 'resolved-tag',
    Closed: 'resolved-tag',
};
function buildEditedIncidentSummary(values) {
    const details = [
        values.department && `office: ${values.department.trim()}`,
        values.location && `location: ${values.location.trim()}`,
        values.issueCategory && `category: ${values.issueCategory.trim()}`,
        values.deviceType && `device: ${values.deviceType.trim()}`,
        values.connectionType && `connection: ${values.connectionType.trim()}`,
    ].filter(Boolean);
    const service = values.affectedService.trim();
    const description = values.description.trim();
    const report = [service, description].filter(Boolean).join(': ');
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
        setTheme(current => current === 'dark'
            ? 'light'
            : 'dark');
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
/* ---------- Helpers ---------- */
function normalizeStatus(value) {
    return typeof value === 'string' && value.trim() ? value : 'Pending';
}
function normalizeSeverity(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
function normalizeIncident(incident) {
    return {
        incidentID: String(incident.incidentID ?? ''),
        userId: String(incident.userId ?? ''),
        department: incident.department ?? '',
        location: incident.location ?? '',
        issueCategory: incident.issueCategory ?? '',
        deviceType: incident.deviceType ?? '',
        connectionType: incident.connectionType ?? '',
        severity: normalizeSeverity(incident.severity),
        affectedIssue: incident.affectedIssue ?? '',
        description: incident.description ?? '',
        status: normalizeStatus(incident.status),
        createdAt: incident.createdAt ?? '',
        employeeName: incident.employeeName ?? '',
        classification: incident.classification ??
            null,
        keywords: incident.keywords ?? null,
        summary: incident.summary ?? null,
        troubleshooting: incident.troubleshooting ??
            null,
        assigned: incident.assigned === 'Yes'
            ? 'Yes'
            : 'No',
        assignedTo: incident.assignedTo ??
            null,
        assignedToName: incident.assignedToName ??
            null,
        resolutionNotes: incident.resolutionNotes ??
            null,
        resolvedAt: incident.resolvedAt ??
            null,
        resolvedBy: incident.resolvedBy ??
            null,
        startedAt: incident.startedAt ??
            null,
        assignedAt: incident.assignedAt ??
            null,
        durationMinutes: incident.durationMinutes ??
            null,
    };
}
/*
 * Employees must never see the technical IT troubleshooting section.
 *
 * The complete troubleshooting value remains stored in the database.
 * This helper extracts only the employee troubleshooting portion.
 */
function getEmployeeTroubleshooting(troubleshooting) {
    if (!troubleshooting) {
        return null;
    }
    const completionRecord = troubleshooting.match(/\[Employee checked self-help steps: [^\]]*\]/i)?.[0] ?? '';
    const basicSelfHelp = troubleshooting
        .replace(/\[Employee checked self-help steps: [^\]]*\]/i, '')
        .split(/IT Troubleshooting Suggestions:/i)[0]
        .trim();
    return [basicSelfHelp, completionRecord].filter(Boolean).join('\n') || null;
}
/* ---------- Page ---------- */
function Incidents() {
    const navigate = useNavigate();
    const { showAlert } = useAppDialog();
    const [sidebarCollapsed, setSidebarCollapsed,] = useState(false);
    const { theme, toggleTheme, } = useTheme();
    const [incidents, setIncidents,] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [viewing, setViewing] = useState(null);
    const [menuOpenId, setMenuOpenId,] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm,] = useState({
        severity: '',
        department: '',
        location: '',
        issueCategory: '',
        deviceType: '',
        connectionType: '',
        affectedService: '',
        description: '',
    });
    const [savingEdit, setSavingEdit,] = useState(false);
    const [editError, setEditError,] = useState('');
    const [deletingId, setDeletingId,] = useState(null);
    const [deletionTarget, setDeletionTarget] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    /* =========================================================
       LOAD REAL DATABASE INCIDENTS
       ========================================================= */
    const fetchEmployeeIncidents = useCallback(async () => {
        try {
            setLoading(true);
            setApiError('');
            const session = getAuthSession();
            const currentUserId = session?.user?.userID;
            if (currentUserId ===
                undefined ||
                currentUserId === null ||
                String(currentUserId).trim() === '') {
                setIncidents([]);
                setApiError('Your login session could not be verified. Please log in again.');
                return;
            }
            const response = await fetch(`${API_BASE_URL}/get_incidents.php?userID=${encodeURIComponent(String(currentUserId))}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
                cache: 'no-store',
            });
            const responseText = await response.text();
            let data;
            try {
                data =
                    JSON.parse(responseText);
            }
            catch {
                console.error('Invalid JSON from get_incidents.php:', responseText);
                throw new Error('The server returned an invalid response.');
            }
            if (!response.ok ||
                !data.success) {
                throw new Error(data.message ||
                    'Failed to load your incident reports.');
            }
            const allIncidents = Array.isArray(data.incidents)
                ? data.incidents.map(normalizeIncident)
                : [];
            setIncidents(allIncidents);
        }
        catch (error) {
            console.error('Fetch employee incidents error:', error);
            setIncidents([]);
            setApiError(error instanceof Error
                ? error.message
                : 'Unable to load your incident reports.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        const timer = window.setTimeout(() => void fetchEmployeeIncidents(), 0);
        return () => window.clearTimeout(timer);
    }, [fetchEmployeeIncidents]);
    /* =========================================================
       CLOSE ACTION MENU WHEN CLICKING OUTSIDE
       ========================================================= */
    useEffect(() => {
        const handleOutsidePointerDown = (event) => {
            const target = event.target;
            if (target instanceof Element &&
                target.closest('.employee-more-wrap, .employee-action-menu')) {
                return;
            }
            setMenuOpenId(null);
            setMenuPosition(null);
        };
        if (menuOpenId === null) {
            return;
        }
        document.addEventListener('pointerdown', handleOutsidePointerDown, true);
        return () => {
            document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
        };
    }, [menuOpenId]);
    useEffect(() => {
        if (menuOpenId === null)
            return;
        const closeMenu = () => {
            setMenuOpenId(null);
            setMenuPosition(null);
        };
        window.addEventListener('scroll', closeMenu, true);
        window.addEventListener('resize', closeMenu);
        return () => {
            window.removeEventListener('scroll', closeMenu, true);
            window.removeEventListener('resize', closeMenu);
        };
    }, [menuOpenId]);
    /* =========================================================
       LOCK BACKGROUND SCROLL WHILE A MODAL IS OPEN
       ========================================================= */
    useEffect(() => {
        const modalIsOpen = viewing !== null ||
            editing !== null;
        if (!modalIsOpen) {
            return;
        }
        const previousOverflow = document.body.style
            .overflow;
        document.body.style.overflow =
            'hidden';
        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [viewing, editing]);
    /* =========================================================
       NAVIGATION
       ========================================================= */
    const handleNavigation = (path) => {
        setMenuOpenId(null);
        navigate(path);
    };
    /* =========================================================
       VIEW INCIDENT
       ========================================================= */
    const handleView = (incident) => {
        setMenuOpenId(null);
        setViewing(incident);
    };
    const closeViewing = () => {
        setViewing(null);
    };
    /*
     * Create an Employee-safe version of the incident.
     *
     * The original incident remains untouched in state.
     */
    const employeeViewingIncident = viewing
        ? {
            ...viewing,
            troubleshooting: getEmployeeTroubleshooting(viewing.troubleshooting),
        }
        : null;
    /* =========================================================
       EDIT INCIDENT
       ========================================================= */
    const handleEdit = (incident) => {
        setMenuOpenId(null);
        if (incident.status === 'Resolved' || incident.status === 'Closed') {
            void showAlert('Resolved incidents cannot be edited.');
            return;
        }
        if (incident.status !==
            'Pending') {
            void showAlert('This incident is already being worked on, so it can no longer be edited. Please contact a Technician or the Administrator for changes.');
            return;
        }
        setEditError('');
        setEditForm({
            severity: incident.severity ?? '',
            department: incident.department,
            location: incident.location,
            issueCategory: incident.issueCategory,
            deviceType: incident.deviceType,
            connectionType: incident.connectionType,
            affectedService: incident.affectedIssue,
            description: incident.description,
        });
        setEditing(incident);
    };
    const closeEditing = () => {
        if (savingEdit) {
            return;
        }
        setEditing(null);
        setEditError('');
    };
    const handleEditFieldChange = (field, value) => {
        setEditForm(current => ({
            ...current,
            [field]: value,
        }));
    };
    /* Refresh the AI summary from the edited report before saving it. */
    const handleSaveEditChanges = async () => {
        if (!editing) {
            return;
        }
        try {
            setSavingEdit(true);
            setEditError('');
            let updatedSummary = buildEditedIncidentSummary(editForm);
            let usedFallbackSummary = false;
            try {
                const updatedAnalysis = await analyzeIncidentWithAI(editForm);
                updatedSummary = updatedAnalysis.summary;
            }
            catch (analysisError) {
                usedFallbackSummary = true;
                console.warn('AI summary refresh failed; saving with a summary from the edited report.', analysisError);
            }
            const response = await fetch(`${API_BASE_URL}/update_incident.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    incidentID: editing.incidentID,
                    department: editForm.department,
                    location: editForm.location,
                    issueCategory: editForm.issueCategory,
                    deviceType: editForm.deviceType,
                    connectionType: editForm.connectionType,
                    affectedIssue: editForm.affectedService,
                    description: editForm.description,
                    // Keep other AI analysis fields unchanged; refresh the summary.
                    classification: editing.classification,
                    summary: updatedSummary,
                    troubleshooting: editing.troubleshooting,
                }),
            });
            const responseText = await response.text();
            let data;
            try {
                data =
                    JSON.parse(responseText);
            }
            catch {
                console.error('Invalid JSON from update_incident.php:', responseText);
                throw new Error('The server returned an invalid response.');
            }
            if (!response.ok ||
                !data.success) {
                throw new Error(data.message ||
                    'Failed to update the incident.');
            }
            setIncidents(current => current.map(item => item.incidentID ===
                editing.incidentID
                ? {
                    ...item,
                    department: editForm.department,
                    location: editForm.location,
                    issueCategory: editForm.issueCategory,
                    deviceType: editForm.deviceType,
                    connectionType: editForm.connectionType,
                    affectedIssue: editForm.affectedService,
                    description: editForm.description,
                    summary: updatedSummary,
                }
                : item));
            setEditing(null);
            setEditError('');
            if (usedFallbackSummary) {
                void showAlert('Your changes were saved. The AI service was unavailable, so the summary was updated from the information in the report.');
            }
        }
        catch (error) {
            console.error('Update incident error:', error);
            setEditError(error instanceof Error
                ? error.message
                : 'Failed to update the incident.');
        }
        finally {
            setSavingEdit(false);
        }
    };
    /* =========================================================
       DELETE INCIDENT
       ========================================================= */
    const handleDelete = (incident) => {
        setMenuOpenId(null);
        if (incident.status !== 'Pending')
            return;
        setDeleteError('');
        setDeletionTarget(incident);
    };
    const confirmDeleteIncident = async () => {
        if (!deletionTarget || deletingId)
            return;
        const incident = deletionTarget;
        try {
            setDeletingId(incident.incidentID);
            const response = await fetch(`${API_BASE_URL}/delete_incident.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    incidentID: incident.incidentID,
                }),
            });
            const responseText = await response.text();
            let data;
            try {
                data =
                    JSON.parse(responseText);
            }
            catch {
                console.error('Invalid JSON from delete_incident.php:', responseText);
                throw new Error('The server returned an invalid response.');
            }
            if (!response.ok ||
                !data.success) {
                throw new Error(data.message ||
                    'Failed to delete the incident.');
            }
            setIncidents(current => current.filter(item => item.incidentID !==
                incident.incidentID));
            setDeletionTarget(null);
        }
        catch (error) {
            console.error('Delete incident error:', error);
            setDeleteError(error instanceof Error
                ? error.message
                : 'Failed to delete the incident.');
        }
        finally {
            setDeletingId(null);
        }
    };
    /* =========================================================
       CURRENT EMPLOYEE INFORMATION
       ========================================================= */
    const session = getAuthSession();
    const currentUser = session?.user;
    const employeeName = currentUser?.fullName ||
        'Employee';
    const employeeRole = currentUser?.role ||
        'Employee';
    const profileInitial = employeeName
        .trim()
        .split(/\s+/)
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'E';
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": "Employee navigation", children: navigation.map(item => (_jsxs("button", { type: "button", className: item.label ===
                                'All Incidents'
                                ? 'is-active'
                                : '', onClick: () => handleNavigation(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(value => !value), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: "All Incidents" }), _jsx("p", { children: "View your reported incidents and their current status." })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: employeeName, role: employeeRole, avatarInitial: profileInitial, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content", children: [apiError && (_jsxs("div", { style: {
                                    padding: '16px 20px',
                                    marginBottom: '16px',
                                    borderRadius: '10px',
                                    border: '1px solid #f1aeb5',
                                    background: '#f8d7da',
                                    color: '#842029',
                                }, children: [_jsx("strong", { children: "Unable to load incident reports." }), _jsx("div", { children: apiError }), _jsx("button", { type: "button", onClick: () => void fetchEmployeeIncidents(), style: {
                                            marginTop: '10px',
                                            cursor: 'pointer',
                                        }, children: "Try Again" })] })), _jsx("article", { className: "dashboard-card employee-incidents-card", children: _jsx("div", { className: "employee-table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Incident ID" }), _jsx("th", { children: "Severity" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { className: "employee-empty", colSpan: 4, children: "Loading your incident reports..." }) })) : incidents.length ===
                                                    0 ? (_jsx("tr", { children: _jsx("td", { className: "employee-empty", colSpan: 4, children: "No incident reports yet. Submit one from Report Incident." }) })) : (incidents.map(incident => (_jsxs("tr", { children: [_jsx("td", { children: incident.incidentID }), _jsx("td", { children: _jsx("span", { className: incident.severity ? `tag ${incident.severity.toLowerCase()}-tag` : 'tag', children: incident.severity ?? 'Not set' }) }), _jsx("td", { children: _jsx("span", { className: `tag ${statusTagClass[incident.status] ?? 'pending-tag'}`, children: incident.status }) }), _jsxs("td", { className: "employee-actions", children: [_jsxs("button", { type: "button", className: "employee-view-button", onClick: () => handleView(incident), "aria-label": `View ${incident.incidentID}`, children: [_jsx(Icon, { name: "eye" }), "View"] }), _jsxs("div", { className: "employee-more-wrap", onClick: event => event.stopPropagation(), children: [_jsx("button", { type: "button", className: "employee-more-button", onClick: event => {
                                                                                event.stopPropagation();
                                                                                if (menuOpenId === incident.incidentID) {
                                                                                    setMenuOpenId(null);
                                                                                    setMenuPosition(null);
                                                                                    return;
                                                                                }
                                                                                const trigger = event.currentTarget.getBoundingClientRect();
                                                                                const menuHeight = 84;
                                                                                const menuTop = trigger.bottom + 6 + menuHeight <= window.innerHeight - 8
                                                                                    ? trigger.bottom + 6
                                                                                    : Math.max(8, trigger.top - menuHeight - 6);
                                                                                const menuRight = Math.max(8, Math.min(window.innerWidth - 134, window.innerWidth - trigger.right));
                                                                                setMenuPosition({ top: menuTop, right: menuRight });
                                                                                setMenuOpenId(incident.incidentID);
                                                                            }, "aria-label": `More actions for ${incident.incidentID}`, "aria-expanded": menuOpenId ===
                                                                                incident.incidentID, children: _jsx(Icon, { name: "more" }) }), menuOpenId ===
                                                                            incident.incidentID && menuPosition && createPortal(_jsxs("div", { className: "employee-action-menu", style: menuPosition, children: [_jsxs("button", { type: "button", disabled: incident.status !==
                                                                                        'Pending', title: incident.status !==
                                                                                        'Pending'
                                                                                        ? 'Already being worked on — contact a Technician or the Administrator to make changes.'
                                                                                        : undefined, onClick: () => handleEdit(incident), children: [_jsx(Icon, { name: "edit" }), "Edit"] }), _jsxs("button", { type: "button", className: "danger", disabled: incident.status !==
                                                                                        'Pending' ||
                                                                                        deletingId ===
                                                                                            incident.incidentID, title: incident.status !==
                                                                                        'Pending'
                                                                                        ? 'Already being worked on — contact a Technician or the Administrator to delete it.'
                                                                                        : undefined, onClick: () => void handleDelete(incident), children: [_jsx(Icon, { name: "trash" }), deletingId ===
                                                                                            incident.incidentID
                                                                                            ? 'Deleting...'
                                                                                            : 'Delete'] })] }), document.body)] })] })] }, incident.incidentID)))) })] }) }) })] })] }), employeeViewingIncident && (_jsx(IncidentDetailModal, { incident: employeeViewingIncident, onClose: closeViewing, showSelfHelpChecklist: true })), editing && createPortal((_jsx("div", { className: "employee-modal-overlay", onMouseDown: event => {
                    if (event.target ===
                        event.currentTarget) {
                        closeEditing();
                    }
                }, children: _jsxs("section", { className: "employee-incident-modal employee-edit-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "employee-edit-title", children: [_jsxs("header", { children: [_jsx("div", { children: _jsx("h2", { id: "employee-edit-title", children: "Edit a Network Incident" }) }), _jsx("button", { type: "button", onClick: closeEditing, "aria-label": "Close", disabled: savingEdit, children: _jsx(Icon, { name: "close" }) })] }), editError && (_jsx("div", { style: {
                                margin: '20px 22px 0',
                                padding: '12px 14px',
                                borderRadius: '9px',
                                border: '1px solid #f1aeb5',
                                background: '#f8d7da',
                                color: '#842029',
                                fontSize: 'var(--font-secondary)',
                            }, children: editError })), _jsxs("form", { id: "employee-edit-form", className: "incident-form", onSubmit: event => {
                                event.preventDefault();
                                void handleSaveEditChanges();
                            }, children: [_jsx(IncidentDetailsFields, { values: editForm, onChange: handleEditFieldChange, departmentEditable: true, showSeverity: true, severityReadOnly: true }), _jsx(IncidentDescriptionFields, { values: editForm, onChange: handleEditFieldChange })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "employee-cancel", onClick: closeEditing, disabled: savingEdit, children: "Cancel" }), _jsxs("button", { type: "submit", form: "employee-edit-form", className: "employee-view-button", disabled: savingEdit, children: [_jsx(Icon, { name: "check" }), savingEdit
                                            ? 'Saving...'
                                            : 'Save Changes'] })] })] }) })), document.body), deletionTarget && createPortal((_jsx("div", { className: "employee-modal-overlay", role: "presentation", onMouseDown: event => event.target === event.currentTarget && !deletingId && setDeletionTarget(null), children: _jsxs("section", { className: "employee-incident-modal employee-delete-confirmation", role: "dialog", "aria-modal": "true", "aria-labelledby": "delete-incident-title", children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("h2", { id: "delete-incident-title", children: "Delete incident?" }), _jsx("p", { children: deletionTarget.incidentID })] }), _jsx("button", { type: "button", "aria-label": "Close", disabled: Boolean(deletingId), onClick: () => setDeletionTarget(null), children: _jsx(Icon, { name: "close" }) })] }), _jsxs("section", { children: [_jsx("p", { children: "This permanently deletes the pending incident report. This action cannot be undone." }), deleteError && _jsx("p", { className: "employee-delete-error", role: "alert", children: deleteError })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "employee-cancel", disabled: Boolean(deletingId), onClick: () => setDeletionTarget(null), children: "Cancel" }), _jsxs("button", { type: "button", className: "employee-delete-confirm-button", disabled: Boolean(deletingId), onClick: () => void confirmDeleteIncident(), children: [_jsx(Icon, { name: "trash" }), deletingId ? 'Deleting...' : 'Delete incident'] })] })] }) })), document.body)] }));
}
export default Incidents;
