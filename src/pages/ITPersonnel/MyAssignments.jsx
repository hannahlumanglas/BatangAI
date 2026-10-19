import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { AdminNotifications } from '../Admin/AdminNotifications';
import { PersonName } from '../../components/PersonName';
import { IncidentDetailModal } from '../../components/IncidentDetailModal';
import { useAppDialog } from '../../components/AppDialog';
import { getAuthSession, getCurrentUserId, getCurrentUserName, getDefaultProfileAvatar, getProfilePhotoUrl, signOut, } from '../../auth';
import '../Admin/Dashboard.css';
import './MyAssignments.css';
import '../Admin/Incidents.css';
import { API_BASE_URL } from '../../apiConfig';
function Icon({ name }) {
    const paths = {
        dashboard: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
        incidents: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2" }), _jsx("path", { d: "M9 4.5h6M9 10h6M9 14h6M9 18h3" })] })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" }), _jsx("path", { d: "M18 8v6M15 11h6" })] })),
        devices: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "13", rx: "1.5" }), _jsx("path", { d: "M8 21h8M12 17v4" })] })),
        users: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M16 11a3 3 0 1 0 0-6M16 14c2.8 0 4.4 1.8 4.7 4" })] })),
        reports: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" }) })),
        profile: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] })),
        menu: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M4 12h16M4 18h16" }) })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
const navigation = [
    {
        label: 'All Incidents',
        icon: 'incidents',
        path: '/it/incidents',
    },
    {
        label: 'My Assignments',
        icon: 'assign',
        path: '/it/my-assignments',
    },
    {
        label: 'Device Monitoring',
        icon: 'devices',
        path: '/it/device-monitoring',
    },
    {
        label: 'Profile',
        icon: 'profile',
        path: '/it/profile',
    },
];
const administratorNavigation = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { label: 'All Incident Reports', icon: 'incidents', path: '/admin/incidents' },
    { label: 'Manage & Assign', icon: 'assign', path: '/admin/manage-assign' },
    { label: 'My Assignments', icon: 'assign', path: '/admin/my-assignments' },
    { label: 'Device Monitoring', icon: 'devices', path: '/admin/device-monitoring' },
    { label: 'User Management', icon: 'users', path: '/admin/user-management' },
    { label: 'Generate Reports', icon: 'reports', path: '/admin/generate-reports' },
    { label: 'Profile', icon: 'profile', path: '/admin/profile' },
];
function ThemeToggle() {
    const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') ===
        'dark');
    const toggle = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        localStorage.setItem('batangai-theme', next ? 'dark' : 'light');
    };
    return (_jsx("button", { type: "button", className: "theme-toggle-button assignment-theme-toggle", onClick: toggle, "aria-label": dark
            ? 'Switch to light mode'
            : 'Switch to dark mode', children: dark ? (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" }) })) }));
}
function ITProfileMenu({ onLogout, }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const rootRef = useRef(null);
    const currentUserName = getCurrentUserName();
    const session = getAuthSession();
    const currentUser = session?.user;
    const [profileAvatar, setProfileAvatar] = useState(() => getProfilePhotoUrl(currentUser?.profilePhoto, currentUser?.fullName, currentUser?.role));
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
        if (!open)
            return;
        const close = (event) => {
            if (rootRef.current &&
                !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const escape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', escape);
        };
    }, [open]);
    const goProfile = () => {
        setOpen(false);
        navigate(currentUser?.role === 'Administrator' ? '/admin/profile' : '/it/profile');
    };
    const initials = currentUserName
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    return (_jsxs("div", { className: "profile-menu-root assignment-profile-menu", ref: rootRef, children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(value => !value), "aria-haspopup": "menu", "aria-expanded": open, children: [_jsx("div", { className: "topbar-avatar", children: profileAvatar ? (_jsx("img", { src: profileAvatar, alt: "", onError: () => setProfileAvatar(getDefaultProfileAvatar(currentUserName, currentUser?.role)) })) : (initials) }), _jsxs("div", { children: [_jsx("strong", { children: currentUserName }), _jsx("span", { children: currentUser?.role === 'Administrator' ? 'Administrator' : 'Technician' })] }), _jsx("span", { className: `profile-menu-chevron${open ? ' open' : ''}`, children: "\u00E2\u0152\u201E" })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsxs("button", { type: "button", role: "menuitem", onClick: goProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] }), "My Profile"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: goProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" })] }), "Settings"] }), _jsxs("button", { type: "button", role: "menuitem", className: "assignment-password-item", onClick: goProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] }), "Change Password"] }), _jsx("span", { className: "profile-menu-divider" }), _jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: onLogout, children: [_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) }), "Logout"] })] }))] }));
}
function formatDate(dateValue) {
    if (!dateValue) {
        return 'Unknown date';
    }
    const date = parseIncidentTimestamp(dateValue);
    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
function formatDateTime(dateValue) {
    if (!dateValue) {
        return undefined;
    }
    const date = parseIncidentTimestamp(dateValue);
    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}
function parseIncidentTimestamp(value) {
    const normalized = value.trim().replace(' ', 'T');
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
    const localDateTime = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
    if (hasTimezone || !localDateTime)
        return new Date(normalized);
    return new Date(Number(localDateTime[1]), Number(localDateTime[2]) - 1, Number(localDateTime[3]), Number(localDateTime[4]), Number(localDateTime[5]), Number(localDateTime[6] || 0), Number((localDateTime[7] || '0').padEnd(3, '0')));
}
function formatDuration(minutes) {
    const totalMinutes = Number(minutes);
    if (Number.isNaN(totalMinutes)) {
        return undefined;
    }
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
}
function repairTextEncoding(value) {
    return value
        .replace(/Ã¢â‚¬â€œ/g, 'â€“')
        .replace(/Ã¢â‚¬â€/g, 'â€”')
        .replace(/Ã¢â‚¬Â¦/g, 'â€¦')
        .replace(/Ã¢â‚¬Â¹/g, 'â€¹')
        .replace(/Ã¢â‚¬Âº/g, 'â€º')
        .replace(/Ãƒâ€”/g, 'Ã—');
}
function normalizeTroubleshootingText(value) {
    if (Array.isArray(value)) {
        return repairTextEncoding(value.filter(Boolean).map(String).join('\n'));
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return repairTextEncoding(parsed.filter(Boolean).map(String).join('\n'));
            }
        }
        catch {
            // The database may contain plain text. Keep it unchanged.
        }
        return repairTextEncoding(value);
    }
    return '';
}
function MyAssignments({ audience = 'technician' }) {
    const isAdministrator = audience === 'administrator';
    const pageNavigation = isAdministrator
        ? administratorNavigation
        : navigation;
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert } = useAppDialog();
    const [tickets, setTickets] = useState([]);
    const ticketsRef = useRef([]);
    const [selectedOverride, setSelected] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolutionLoading, setResolutionLoading] = useState(false);
    const currentUserId = getCurrentUserId();
    const currentUserName = getCurrentUserName();
    const loadAssignments = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            if (currentUserId === null) {
                setError('Your login session could not be verified.');
                return;
            }
            const response = await fetch(`${API_BASE_URL}/get_incidents.php?userID=${encodeURIComponent(String(currentUserId))}${isAdministrator ? '&scope=assigned' : ''}`, { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Failed to load incident reports.');
            }
            const data = await response.json();
            if (!data.success ||
                !Array.isArray(data.incidents)) {
                throw new Error('Invalid incident data received from server.');
            }
            const mappedTickets = data.incidents.map(incident => {
                let status = 'available';
                const incidentStatus = String(incident.status || '').toLowerCase();
                if (incidentStatus === 'resolved' ||
                    incidentStatus === 'solved') {
                    status = 'solved';
                }
                else if (incidentStatus === 'in progress' ||
                    incidentStatus === 'in-progress') {
                    status = 'in-progress';
                }
                const troubleshooting = normalizeTroubleshootingText(incident.troubleshooting);
                return {
                    id: incident.incidentID,
                    incidentDetail: incident,
                    technicianCheckedSteps: (() => {
                        const match = troubleshooting.match(/\[IT manually checked troubleshooting steps: ([^\]]*)\]/i);
                        return (match?.[1] || '').split(',').map((item) => item.trim()).filter((item) => item !== '').map(Number).filter((index) => Number.isInteger(index) && index >= 0);
                    })(),
                    title: incident.affectedIssue ||
                        incident.issueCategory ||
                        'Network Incident',
                    reporter: incident.employeeName ||
                        'Unknown Employee',
                    reporterProfilePhoto: incident.reporterProfilePhoto || null,
                    date: formatDate(incident.createdAt),
                    office: incident.department ||
                        incident.location ||
                        'Unknown Office',
                    severity: incident.severity || 'Not set',
                    status,
                    actionTime: incident.startedAt
                        ? formatDateTime(incident.startedAt)
                        : undefined,
                    duration: incident.durationMinutes !== null &&
                        incident.durationMinutes !==
                            undefined
                        ? formatDuration(incident.durationMinutes)
                        : undefined,
                    description: incident.description,
                    issueCategory: incident.issueCategory,
                    deviceType: incident.deviceType,
                    connectionType: incident.connectionType,
                    location: incident.location,
                    classification: incident.classification,
                    summary: incident.summary,
                    troubleshooting,
                    resolutionNotes: incident.resolutionNotes ||
                        undefined,
                    resolvedBy: incident.resolvedBy ||
                        undefined,
                    resolvedAt: incident.resolvedAt ||
                        undefined,
                    assignedToName: incident.assignedToName ||
                        currentUserName,
                };
            });
            const previousSteps = new Map(ticketsRef.current.map(ticket => [ticket.id, ticket.technicianCheckedSteps]));
            const refreshedTickets = mappedTickets.map(ticket => {
                const saved = ticket.technicianCheckedSteps;
                const local = previousSteps.get(ticket.id) || [];
                return saved.length ? ticket : { ...ticket, technicianCheckedSteps: local };
            });
            ticketsRef.current = refreshedTickets;
            setTickets(refreshedTickets);
        }
        catch (err) {
            console.error('Error loading assignments:', err);
            setError('Unable to load your assigned incident reports.');
        }
        finally {
            setLoading(false);
        }
    }, [currentUserId, currentUserName, isAdministrator]);
    const routeState = location.state;
    const requestedIncidentId = routeState?.openIncidentId;
    const routeSelected = typeof requestedIncidentId === 'string' && !loading
        ? tickets.find(ticket => ticket.id === requestedIncidentId) ?? null
        : null;
    const selected = selectedOverride ?? routeSelected;
    useEffect(() => {
        const timer = window.setTimeout(() => void loadAssignments(), 0);
        return () => window.clearTimeout(timer);
    }, [loadAssignments]);
    useEffect(() => {
        if (typeof requestedIncidentId !== 'string' || loading)
            return;
        navigate(location.pathname, { replace: true, state: null });
    }, [loading, location.pathname, navigate, requestedIncidentId]);
    useEffect(() => {
        const refreshInterval = window.setInterval(() => void loadAssignments(), 15000);
        return () => window.clearInterval(refreshInterval);
    }, [loadAssignments]);
    const prioritizeHighSeverity = (items) => [...items].sort((a, b) => Number(b.severity === 'High') -
        Number(a.severity === 'High'));
    const available = prioritizeHighSeverity(tickets.filter(ticket => ticket.status === 'available'));
    const inProgress = prioritizeHighSeverity(tickets.filter(ticket => ticket.status === 'in-progress'));
    const solved = prioritizeHighSeverity(tickets.filter(ticket => ticket.status === 'solved'));
    const takeAction = async (id) => {
        if (actionLoading || resolutionLoading) {
            return;
        }
        try {
            setActionLoading(id);
            const response = await fetch(`${API_BASE_URL}/update_incident_status.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    incidentID: id,
                    status: 'In Progress',
                    actorUserId: currentUserId,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message ||
                    'Failed to update incident status.');
            }
            /*
             * Update the ticket immediately in React.
             * This makes the status visible without
             * refreshing the browser.
             */
            setTickets(current => current.map(ticket => ticket.id === id
                ? {
                    ...ticket,
                    status: 'in-progress',
                    actionTime: 'Just now',
                }
                : ticket));
            /*
             * If the report modal is currently open,
             * update the selected report too.
             */
            setSelected(current => current && current.id === id
                ? {
                    ...current,
                    status: 'in-progress',
                    actionTime: 'Just now',
                }
                : current);
        }
        catch (err) {
            console.error('Take Action error:', err);
            void showAlert(err instanceof Error
                ? err.message
                : 'Failed to take action on this incident.');
        }
        finally {
            setActionLoading(null);
        }
    };
    const viewTicket = (ticket) => {
        setSelected(ticket);
        setResolutionNotes(ticket.resolutionNotes || ticket.incidentDetail.resolutionNotes || '');
    };
    const updateTechnicianStep = async (ticketId, index, checked) => {
        const ticket = ticketsRef.current.find(item => item.id === ticketId);
        if (!ticket || ticket.status !== 'in-progress')
            return;
        const update = (ticket) => {
            if (ticket.id !== ticketId)
                return ticket;
            const next = checked
                ? [...new Set([...ticket.technicianCheckedSteps, index])].sort((a, b) => a - b)
                : ticket.technicianCheckedSteps.filter(step => step !== index);
            return { ...ticket, technicianCheckedSteps: next };
        };
        setTickets(current => {
            const next = current.map(update);
            ticketsRef.current = next;
            return next;
        });
        setSelected(current => current ? update(current) : current);
        const updatedSteps = checked
            ? [...new Set([...ticket.technicianCheckedSteps, index])].sort((a, b) => a - b)
            : ticket.technicianCheckedSteps.filter(step => step !== index);
        try {
            const response = await fetch(`${API_BASE_URL}/update_incident_status.php`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incidentID: ticketId,
                    status: 'Update Technician Checklist',
                    actorUserId: currentUserId,
                    technicianCheckedSteps: updatedSteps,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to save technician troubleshooting progress.');
            }
        }
        catch (error) {
            console.error('Save technician troubleshooting progress error:', error);
            await loadAssignments();
            void showAlert(error instanceof Error ? error.message : 'Failed to save technician troubleshooting progress.');
        }
    };
    const resolveIncident = async (resolutionTarget, notesDraft) => {
        if (resolutionLoading) {
            return;
        }
        const notes = notesDraft.trim();
        if (!notes) {
            void showAlert('Please enter the resolution notes before resolving this incident.');
            return;
        }
        try {
            setResolutionLoading(true);
            const response = await fetch(`${API_BASE_URL}/update_incident_status.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    incidentID: resolutionTarget.id,
                    status: 'Resolved',
                    actorUserId: currentUserId,
                    resolvedBy: currentUserName,
                    resolutionNotes: notes,
                    technicianCheckedSteps: resolutionTarget.technicianCheckedSteps,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message ||
                    'Failed to resolve incident.');
            }
            const resolvedIncident = data.incident || {};
            const resolvedAt = resolvedIncident.resolvedAt ||
                new Date().toISOString();
            const durationMinutes = resolvedIncident.durationMinutes;
            const updatedDuration = durationMinutes !== null &&
                durationMinutes !== undefined
                ? formatDuration(durationMinutes)
                : resolutionTarget.duration;
            setTickets(current => current.map(ticket => ticket.id === resolutionTarget.id
                ? {
                    ...ticket,
                    status: 'solved',
                    resolutionNotes: notes,
                    resolvedBy: resolvedIncident.resolvedBy ||
                        currentUserName,
                    resolvedAt,
                    incidentDetail: {
                        ...ticket.incidentDetail,
                        resolutionNotes: notes,
                        resolvedBy: resolvedIncident.resolvedBy || currentUserName,
                        resolvedAt,
                        durationMinutes: durationMinutes ?? ticket.incidentDetail.durationMinutes,
                    },
                    duration: updatedDuration,
                }
                : ticket));
            setSelected(current => current &&
                current.id === resolutionTarget.id
                ? {
                    ...current,
                    status: 'solved',
                    resolutionNotes: notes,
                    resolvedBy: resolvedIncident.resolvedBy ||
                        currentUserName,
                    resolvedAt,
                    incidentDetail: {
                        ...current.incidentDetail,
                        resolutionNotes: notes,
                        resolvedBy: resolvedIncident.resolvedBy || currentUserName,
                        resolvedAt,
                        durationMinutes: durationMinutes ?? current.incidentDetail.durationMinutes,
                    },
                    duration: updatedDuration,
                }
                : current);
            setResolutionNotes('');
            setSelected(null);
            await loadAssignments();
        }
        catch (err) {
            console.error('Resolve Incident error:', err);
            void showAlert(err instanceof Error
                ? err.message
                : 'Failed to resolve this incident.');
        }
        finally {
            setResolutionLoading(false);
        }
    };
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    return (_jsxs("div", { className: `admin-shell assignment-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": isAdministrator ? 'Administrator navigation' : 'Technician navigation', children: pageNavigation.map(item => (_jsxs("button", { className: item.label ===
                                'My Assignments'
                                ? 'is-active'
                                : '', type: "button", onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar assignment-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", onClick: () => setSidebarCollapsed(value => !value), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: "My Assignments" }), _jsx("p", { children: "Manage your assigned incident tickets and track resolution time." })] }), _jsx(ThemeToggle, {}), _jsx(AdminNotifications, {}), _jsx(ITProfileMenu, { onLogout: handleLogout })] }), _jsxs("section", { className: "assignment-content", children: [loading && (_jsx("div", { className: "assignment-loading", children: "Loading your assigned incidents..." })), !loading && error && (_jsx("div", { className: "assignment-error", children: error })), !loading && !error && (_jsxs(_Fragment, { children: [_jsxs("section", { className: "assignment-stats", "aria-label": "Assignment status summary", children: [_jsxs("article", { className: "assignment-stat assignment-stat--pending", children: [_jsx("div", { className: "assignment-stat-icon", children: "\u25F7" }), _jsxs("div", { children: [_jsx("span", { children: "Pending" }), _jsx("strong", { children: available.length })] })] }), _jsxs("article", { className: "assignment-stat assignment-stat--progress", children: [_jsx("div", { className: "assignment-stat-icon", children: "\u27F3" }), _jsxs("div", { children: [_jsx("span", { children: "In Progress" }), _jsx("strong", { children: inProgress.length })] })] }), _jsxs("article", { className: "assignment-stat assignment-stat--resolved", children: [_jsx("div", { className: "assignment-stat-icon", children: "\u2713" }), _jsxs("div", { children: [_jsx("span", { children: "Resolved" }), _jsx("strong", { children: solved.length })] })] })] }), tickets.length === 0 && (_jsxs("div", { className: "assignment-empty", children: [_jsx("h3", { children: "No Assigned Incidents" }), _jsxs("p", { children: ["There are currently no incident reports assigned to", ' ', currentUserName, "."] })] })), available.length > 0 && (_jsx(TicketGroup, { title: `Assigned to Me (${available.length})`, tone: "available", tickets: available, onView: viewTicket, onTakeAction: takeAction, onResolve: viewTicket, actionLoading: actionLoading, resolutionLoading: resolutionLoading })), inProgress.length > 0 && (_jsx(TicketGroup, { title: `In Progress (${inProgress.length})`, tone: "in-progress", tickets: inProgress, onView: viewTicket, onTakeAction: takeAction, onResolve: viewTicket, actionLoading: actionLoading, resolutionLoading: resolutionLoading })), solved.length > 0 && (_jsx(TicketGroup, { title: `Resolved by Me (${solved.length})`, tone: "solved", tickets: solved, onView: viewTicket, onTakeAction: takeAction, onResolve: viewTicket, actionLoading: actionLoading, resolutionLoading: resolutionLoading }))] }))] })] }), selected && (_jsx(ReportModal, { ticket: selected, onClose: () => setSelected(null), onTakeAction: takeAction, onResolve: (ticket) => void resolveIncident(ticket, resolutionNotes), onTechnicianStepChange: (index, checked) => updateTechnicianStep(selected.id, index, checked), actionLoading: actionLoading, resolutionLoading: resolutionLoading, resolutionNotesDraft: resolutionNotes, onResolutionNotesDraftChange: setResolutionNotes }))] }));
}
function TicketGroup({ title, tone, tickets, onView, onTakeAction, onResolve, actionLoading, resolutionLoading, }) {
    return (_jsxs("section", { className: `ticket-group ticket-group--${tone}`, children: [_jsx("h3", { children: title }), _jsx("div", { className: "ticket-grid", children: tickets.map(ticket => (_jsxs("article", { className: "ticket-card", children: [_jsx("div", { className: "ticket-severity-row", children: _jsx("b", { className: `severity severity--${ticket.severity.toLowerCase().replace(/\s+/g, '-')}`, children: ticket.severity }) }), _jsx("div", { className: "ticket-meta", children: _jsx(PersonName, { name: ticket.reporter, profilePhoto: ticket.reporterProfilePhoto, compact: true }) }), _jsx("p", { children: ticket.office }), ticket.actionTime && (_jsxs("div", { className: "ticket-action-time", children: ["Action taken at", ' ', ticket.actionTime, ticket.duration &&
                                    ` | Duration: ${ticket.duration}`] })), _jsxs("div", { className: "ticket-actions", children: [_jsx("button", { type: "button", onClick: () => onView(ticket), children: "View Report & AI" }), ticket.status === 'available' && (_jsx("button", { type: "button", className: "take-action", disabled: actionLoading === ticket.id, onClick: () => onTakeAction(ticket.id), children: actionLoading === ticket.id
                                        ? 'Updating...'
                                        : 'Take Action' })), ticket.status === 'in-progress' && (_jsx(_Fragment, { children: _jsx("button", { type: "button", className: "take-action", disabled: resolutionLoading, onClick: () => onResolve(ticket), children: "Resolve Incident" }) })), ticket.status === 'solved' && (_jsx("button", { type: "button", disabled: true, children: "Resolved" }))] })] }, ticket.id))) })] }));
}
function ReportModal({ ticket, onClose, onTakeAction, onResolve, onTechnicianStepChange, actionLoading, resolutionLoading, resolutionNotesDraft, onResolutionNotesDraftChange, }) {
    const footer = ticket.status === 'available' ? (_jsx("button", { className: "btn-primary", type: "button", disabled: actionLoading === ticket.id || resolutionLoading, onClick: () => onTakeAction(ticket.id), children: actionLoading === ticket.id ? 'Updating...' : 'Take Action' })) : ticket.status === 'in-progress' ? (_jsx("button", { className: "btn-primary", type: "button", disabled: resolutionLoading, onClick: () => onResolve(ticket, true), children: "Resolve Incident" })) : undefined;
    return (_jsx(IncidentDetailModal, { incident: {
            ...ticket.incidentDetail,
            status: ticket.status === 'in-progress'
                ? 'In Progress'
                : ticket.status === 'solved'
                    ? 'Resolved'
                    : ticket.incidentDetail.status,
        }, onClose: onClose, footer: footer, showSelfHelpChecklist: true, showTechnicianChecklist: ticket.status !== 'available', checkedTechnicianSteps: ticket.technicianCheckedSteps, onTechnicianStepChange: onTechnicianStepChange, resolutionNotesDraft: ticket.status === 'in-progress' ? resolutionNotesDraft : undefined, onResolutionNotesDraftChange: ticket.status === 'in-progress' ? onResolutionNotesDraftChange : undefined }));
}
export default MyAssignments;
