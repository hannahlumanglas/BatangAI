import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession } from '../../auth';
import { API_BASE_URL } from '../../apiConfig';
import { loadUserAppData, saveUserAppData } from '../../utils/userAppData';
const INCIDENTS_URL = `${API_BASE_URL}/get_incidents.php`;
const REFRESH_INTERVAL_MS = 15_000;
function relativeTime(value) {
    if (!value)
        return 'Recently';
    const timestamp = new Date(value.trim().replace(' ', 'T')).getTime();
    if (Number.isNaN(timestamp))
        return 'Recently';
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (minutes < 1)
        return 'Just now';
    if (minutes < 60)
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}
function timestamp(value) {
    if (!value)
        return 0;
    const parsed = new Date(value.trim().replace(' ', 'T')).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}
function notificationForReport(incident) {
    const issue = incident.affectedIssue?.trim() || incident.issueCategory?.trim() || 'Incident requires attention';
    return {
        id: `incident-${incident.incidentID}-reported`,
        title: 'New incident report',
        detail: `${issue} · ${incident.employeeName?.trim() || 'Employee'}`,
        time: relativeTime(incident.createdAt),
        incidentID: String(incident.incidentID),
    };
}
function notificationForAssignment(incident) {
    const issue = incident.affectedIssue?.trim() || incident.issueCategory?.trim() || 'Incident requires attention';
    const assignedAt = incident.assignedAt?.trim() || '';
    return {
        id: `incident-${incident.incidentID}-assigned-${assignedAt}`,
        title: 'Incident assigned to you',
        detail: `${issue} · ${incident.incidentID}`,
        time: relativeTime(assignedAt || incident.createdAt),
        incidentID: String(incident.incidentID),
    };
}
function notificationForEmployee(incident) {
    const status = incident.status?.trim() || 'Pending';
    const issue = incident.affectedIssue?.trim() || incident.issueCategory?.trim() || 'Your incident report';
    return {
        id: `incident-${incident.incidentID}-status-${status.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Incident ${status.toLowerCase()}`,
        detail: `${issue} · ${incident.incidentID}`,
        time: relativeTime(incident.resolvedAt || incident.startedAt || incident.createdAt),
        incidentID: String(incident.incidentID),
    };
}
function readStorageKey() {
    const user = getAuthSession()?.user;
    return `batangai-read-notifications-${user?.role ?? 'guest'}-${user?.email ?? 'guest'}`;
}
function initializedStorageKey() {
    const user = getAuthSession()?.user;
    return `batangai-notifications-initialized-${user?.role ?? 'guest'}-${user?.email ?? 'guest'}`;
}
function loadReadIds() {
    try {
        const saved = localStorage.getItem(readStorageKey());
        const parsed = saved ? JSON.parse(saved) : [];
        return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
    }
    catch {
        return new Set();
    }
}
export function AdminNotifications() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [readIds, setReadIds] = useState(loadReadIds);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const rootRef = useRef(null);
    const databaseStateLoaded = useRef(false);
    const notificationsInitialized = useRef(false);
    const saveReadIds = useCallback((next) => {
        setReadIds(next);
        localStorage.setItem(readStorageKey(), JSON.stringify([...next]));
        void saveUserAppData('notification_read_ids', [...next]).catch(saveError => {
            console.error('Unable to save notification read state to the database:', saveError);
        });
    }, []);
    const loadNotifications = useCallback(async (signal) => {
        setLoading(true);
        setError(false);
        try {
            const user = getAuthSession()?.user;
            const userId = user?.userID;
            const role = user?.role;
            if (userId === undefined ||
                userId === null ||
                !['Administrator', 'Secretary', 'IT Personnel', 'Employee'].includes(role ?? '')) {
                setNotifications([]);
                return;
            }
            if (!databaseStateLoaded.current) {
                try {
                    const savedData = await loadUserAppData(signal);
                    if (signal?.aborted)
                        return;
                    const savedIds = savedData.notification_read_ids;
                    if (Array.isArray(savedIds)) {
                        const ids = savedIds.filter((id) => typeof id === 'string');
                        setReadIds(new Set(ids));
                        localStorage.setItem(readStorageKey(), JSON.stringify(ids));
                    }
                    else {
                        const legacyIds = loadReadIds();
                        setReadIds(legacyIds);
                        if (legacyIds.size)
                            void saveUserAppData('notification_read_ids', [...legacyIds]);
                    }
                    notificationsInitialized.current = savedData.notification_initialized === true
                        || localStorage.getItem(initializedStorageKey()) === 'true';
                    if (notificationsInitialized.current && savedData.notification_initialized !== true) {
                        void saveUserAppData('notification_initialized', true);
                    }
                }
                catch (storageError) {
                    console.error('Unable to restore notification state from the database:', storageError);
                    setReadIds(loadReadIds());
                    notificationsInitialized.current = localStorage.getItem(initializedStorageKey()) === 'true';
                }
                finally {
                    databaseStateLoaded.current = true;
                }
            }
            const response = await fetch(`${INCIDENTS_URL}?userID=${encodeURIComponent(String(userId))}`, { signal, cache: 'no-store', credentials: 'include' });
            const data = await response.json();
            if (!response.ok || !data.success || !Array.isArray(data.incidents)) {
                throw new Error('Unable to load notifications');
            }
            const eventIncidents = role === 'IT Personnel'
                ? data.incidents
                    .filter(incident => String(incident.assignedTo ?? '') === String(userId) &&
                    Boolean(incident.assignedAt) &&
                    incident.assigned?.toLowerCase() === 'yes')
                    .sort((a, b) => timestamp(b.assignedAt) - timestamp(a.assignedAt))
                : data.incidents
                    .filter(incident => Boolean(incident.createdAt))
                    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
            const eventNotifications = role === 'IT Personnel'
                ? eventIncidents.map(notificationForAssignment)
                : role === 'Employee'
                    ? eventIncidents.map(notificationForEmployee)
                    : eventIncidents.map(notificationForReport);
            if (!notificationsInitialized.current) {
                saveReadIds(new Set([
                    ...loadReadIds(),
                    ...eventNotifications.map(notification => notification.id),
                ]));
                localStorage.setItem(initializedStorageKey(), 'true');
                notificationsInitialized.current = true;
                void saveUserAppData('notification_initialized', true).catch(saveError => {
                    console.error('Unable to save notification initialization state:', saveError);
                });
            }
            setNotifications(eventNotifications.slice(0, 6));
        }
        catch (requestError) {
            if (requestError.name !== 'AbortError')
                setError(true);
        }
        finally {
            if (!signal?.aborted)
                setLoading(false);
        }
    }, [saveReadIds]);
    useEffect(() => {
        const controller = new AbortController();
        const initialLoad = window.setTimeout(() => void loadNotifications(controller.signal), 0);
        const refreshTimer = window.setInterval(() => void loadNotifications(), REFRESH_INTERVAL_MS);
        return () => {
            controller.abort();
            window.clearTimeout(initialLoad);
            window.clearInterval(refreshTimer);
        };
    }, [loadNotifications]);
    useEffect(() => {
        if (!open)
            return;
        const closeOnOutsideClick = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target))
                setOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape')
                setOpen(false);
        };
        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);
    const unread = useMemo(() => notifications.filter(notification => !readIds.has(notification.id)).length, [notifications, readIds]);
    const markAllRead = () => {
        saveReadIds(new Set([...readIds, ...notifications.map(notification => notification.id)]));
    };
    const openNotification = (notification) => {
        saveReadIds(new Set([...readIds, notification.id]));
        setOpen(false);
        const role = getAuthSession()?.user.role;
        const incidentPath = role === 'IT Personnel'
            ? '/it/my-assignments'
            : role === 'Employee'
                ? '/employee/incidents'
                : role === 'Secretary'
                    ? '/secretary/incidents'
                    : '/admin/incidents';
        navigate(incidentPath, {
            state: { openIncidentId: notification.incidentID },
        });
    };
    if (!['Administrator', 'Secretary', 'IT Personnel', 'Employee'].includes(getAuthSession()?.user.role ?? '')) {
        return null;
    }
    return (_jsxs("div", { className: "notification-menu-root", ref: rootRef, children: [_jsxs("button", { className: "notification-button", type: "button", "aria-label": unread ? `Notifications, ${unread} unread` : 'Notifications', "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen(current => !current), children: [_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" }) }), unread > 0 && _jsx("b", { children: unread > 99 ? '99+' : unread })] }), open && (_jsxs("section", { className: "notification-dropdown", "aria-label": "Notifications", role: "menu", "aria-busy": loading, children: [_jsxs("div", { className: "notification-dropdown-header", children: [_jsx("h2", { children: "Notifications" }), unread > 0 ? (_jsx("button", { type: "button", onClick: markAllRead, children: "Mark all as read" })) : (_jsx("span", { className: "notification-all-read", children: "All caught up" }))] }), _jsxs("div", { className: "notification-list", children: [loading && _jsx("p", { className: "notification-state", children: "Loading notifications\u2026" }), !loading && error && _jsx("p", { className: "notification-state", children: "Notifications are unavailable. Please try again." }), !loading && !error && notifications.length === 0 && _jsx("p", { className: "notification-state", children: "No new incident notifications." }), !loading && !error && notifications.map(notification => {
                                const isRead = readIds.has(notification.id);
                                return (_jsxs("button", { className: `notification-item${isRead ? ' is-read' : ''}`, role: "menuitem", type: "button", onClick: () => openNotification(notification), children: [_jsx("span", { className: "notification-indicator", "aria-hidden": "true" }), _jsxs("span", { children: [_jsx("strong", { children: notification.title }), _jsx("span", { children: notification.detail }), _jsx("time", { children: notification.time })] })] }, notification.id));
                            })] })] }))] }));
}
