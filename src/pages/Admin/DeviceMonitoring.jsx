import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { getAuthSession, getCurrentUserName, getCurrentUserRole, getRoleDisplayName, getProfilePhotoUrl, signOut, } from '../../auth';
import { AdminNotifications } from './AdminNotifications';
import './Dashboard.css';
import './DeviceMonitoring.css';
import './DeviceMonitoringOverrides.css';
import { API_BASE_URL } from '../../apiConfig';
import { useOffices } from '../../hooks/useOffices';
import { useAppDialog } from '../../components/AppDialog';
const NETWORK_DEVICE_TYPES = ['Router', 'Switch', 'Access Point'];
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
        plus: _jsx("path", { d: "M12 5v14M5 12h14" }),
        online: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m8 12 2.7 2.7L16.5 9" })] })),
        warning: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 7v6M12 17h.01" })] })),
        offline: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m9 9 6 6m0-6-6 6" })] })),
        chevron: _jsx("path", { d: "m6 9 6 6 6-6" }),
        dots: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "5", r: "1.6" }), _jsx("circle", { cx: "12", cy: "12", r: "1.6" }), _jsx("circle", { cx: "12", cy: "19", r: "1.6" })] })),
        switch: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "2", y: "8", width: "20", height: "8", rx: "1.5" }), _jsx("path", { d: "M6 12h.01M10 12h.01M14 12h.01M18 12h.01" })] })),
        link: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M9 15 15 9" }), _jsx("path", { d: "M13 5.5 15 3.6a3.4 3.4 0 0 1 4.9 4.9L18 10.4M11 18.4l-1.9 1.9a3.4 3.4 0 0 1-4.9-4.9L6.1 13.5" })] })),
        clock: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 7v5l3.2 2" })] })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" }), _jsx("path", { d: "M18 8v6M15 11h6" })] })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
function StatCard({ icon, number, title, tone, }) {
    return (_jsxs("article", { className: `stat-card stat-card--${tone}`, children: [_jsx("div", { className: "stat-icon", children: _jsx(Icon, { name: icon }) }), _jsxs("div", { children: [_jsx("h3", { children: title }), _jsx("strong", { children: number })] })] }));
}
const navigation = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { label: 'All Incidents', icon: 'incidents', path: '/admin/incidents' },
    { label: 'Manage & Assign', icon: 'assign', path: '/admin/manage-assign' },
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
    { label: 'Profile', icon: 'profile', path: '/admin/profile' },
];
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
    const toggleTheme = () => setTheme(current => (current === 'dark' ? 'light' : 'dark'));
    return { theme, toggleTheme };
}
function ThemeToggle({ theme, onToggle, }) {
    const isDark = theme === 'dark';
    return (_jsx("button", { type: "button", className: "theme-toggle-button", onClick: onToggle, "aria-label": isDark ? 'Switch to light mode' : 'Switch to dark mode', "aria-pressed": isDark, title: isDark ? 'Switch to light mode' : 'Switch to dark mode', children: isDark ? (_jsxs("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "4.2" }), _jsx("path", { d: "M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" }) })) }));
}
/* ---------- Profile Menu ---------- */
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
    const initials = name
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    return (_jsxs("div", { className: "profile-menu-root", ref: rootRef, children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(current => !current), "aria-haspopup": "menu", "aria-expanded": open, children: [_jsx("div", { className: "topbar-avatar", children: avatar ? (_jsx("img", { src: avatar, alt: "" })) : (initials) }), _jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("span", { children: getRoleDisplayName(role) })] }), _jsx("span", { className: `profile-menu-chevron${open ? ' open' : ''}`, children: _jsx("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] }), "My Profile"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate(profilePath.replace('/profile', '/settings'));
                        }, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" })] }), "Settings"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] }), "Change Password"] }), _jsx("span", { className: "profile-menu-divider" }), _jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: () => {
                            setOpen(false);
                            onLogout();
                        }, children: [_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) }), "Logout"] })] }))] }));
}
const DEVICES_URL = `${API_BASE_URL}/devices.php`;
const USERS_URL = `${API_BASE_URL}/users.php`;
function statusIcon(status) {
    return status === 'unknown' ? 'warning' : status;
}
function deviceIcon(type) {
    return type === 'Switch' ? 'switch' : 'devices';
}
function formatDeviceDateTime(value) {
    if (!value)
        return 'Never';
    // MySQL DATETIME values have no timezone suffix, while API Date values are
    // serialized as ISO strings. Preserve local wall time for the former and
    // let Date convert the latter into the browser's local timezone.
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    let date;
    if (match) {
        const [, year, month, day, hour, minute, second = '0'] = match;
        date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    }
    else {
        date = new Date(value);
    }
    if (Number.isNaN(date.getTime()))
        return value;
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}
function DeviceCard({ device, expanded, onToggle, onEdit, onDelete, deleting, }) {
    return (_jsxs("article", { className: `dashboard-card dm-card${expanded ? ' expanded' : ''}`, children: [_jsxs("div", { className: "dm-card-header", role: "button", tabIndex: 0, "aria-expanded": expanded, onClick: onToggle, onKeyDown: e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle();
                    }
                }, children: [_jsxs("div", { className: "dm-card-id", children: [_jsx("div", { className: `dm-card-icon${device.type === 'Switch'
                                    ? ' dm-card-icon--switch'
                                    : ''}`, children: _jsx(Icon, { name: deviceIcon(device.type) }) }), _jsx("span", { children: _jsx("strong", { children: device.name }) })] }), _jsxs("div", { className: "dm-card-header-right", children: [_jsxs("p", { className: device.status, children: [_jsx(Icon, { name: statusIcon(device.status) }), device.status === 'online'
                                        ? 'Online'
                                        : device.status === 'offline'
                                            ? 'Offline'
                                            : 'Unknown'] }), _jsx(Icon, { name: "chevron" })] })] }), _jsx("div", { className: "dm-card-details", children: _jsxs("div", { className: "dm-card-details-inner", children: [_jsx("div", { className: "dm-details-grid", children: _jsxs("dl", { className: "dm-details-list", children: [_jsxs("div", { children: [_jsx("dt", { children: "Type" }), _jsx("dd", { children: device.type })] }), _jsxs("div", { children: [_jsx("dt", { children: "IP Address" }), _jsx("dd", { children: device.ip })] }), _jsxs("div", { children: [_jsx("dt", { children: "Location" }), _jsx("dd", { children: device.location })] }), _jsxs("div", { children: [_jsx("dt", { children: "Office" }), _jsx("dd", { children: device.department })] }), _jsxs("div", { children: [_jsx("dt", { children: "User" }), _jsx("dd", { children: device.assignedUserName || 'Unassigned' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Firmware Version" }), _jsx("dd", { children: device.firmware })] }), _jsxs("div", { children: [_jsx("dt", { children: "Date Registered" }), _jsx("dd", { children: formatDeviceDateTime(device.registeredAt) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Last Pinged" }), _jsx("dd", { children: formatDeviceDateTime(device.lastPingAt) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Last Seen" }), _jsx("dd", { children: formatDeviceDateTime(device.lastSeen) })] })] }) }), _jsxs("div", { className: "dm-card-actions", children: [_jsx("button", { className: "dm-edit", type: "button", onClick: onEdit, children: "Edit Device" }), _jsx("button", { className: "dm-delete", type: "button", disabled: deleting, onClick: onDelete, children: deleting ? 'Deleting…' : 'Delete Device' })] })] }) })] }));
}
function AddDeviceModal({ onClose, onAdd, onEdit, initialDevice, users, }) {
    const { offices, loading: officesLoading } = useOffices();
    const isEditing = Boolean(initialDevice);
    const initialType = NETWORK_DEVICE_TYPES.find(option => option === initialDevice?.type) ?? NETWORK_DEVICE_TYPES[0];
    const [name, setName] = useState(initialDevice?.name ?? '');
    const [type, setType] = useState(initialType);
    const selectedType = type || NETWORK_DEVICE_TYPES[0];
    const [ip, setIp] = useState(initialDevice?.ip ?? '');
    const [location, setLocation] = useState(initialDevice?.location ?? '');
    const [department, setDepartment] = useState(initialDevice?.department ?? '');
    const selectedDepartment = department || offices[0] || '';
    const [assignedUserId, setAssignedUserId] = useState(String(initialDevice?.assignedUserId ?? ''));
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const selectedUser = users.find(user => String(user.userID) === assignedUserId);
    const [firmware, setFirmware] = useState(initialDevice?.firmware === '—' ? '' : initialDevice?.firmware ?? '');
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const validate = () => {
        const next = {};
        if (!name.trim()) {
            next.name = 'Property number is required.';
        }
        if (!ip.trim()) {
            next.ip = 'IP address is required.';
        }
        else if (!ipPattern.test(ip.trim())) {
            next.ip =
                'Enter a valid IP address (e.g. 10.10.0.5).';
        }
        if (!location.trim()) {
            next.location = 'Location is required.';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate())
            return;
        setSaving(true);
        try {
            const device = {
                name: name.trim(),
                type: selectedType,
                ip: ip.trim(),
                location: location.trim(),
                department: selectedDepartment,
                firmware: firmware.trim(),
                assignedUserId: assignedUserId || null,
            };
            if (initialDevice) {
                if (!onEdit)
                    throw new Error('Device editing is unavailable.');
                await onEdit(initialDevice.id, device);
            }
            else {
                await onAdd(device);
            }
        }
        catch (error) {
            setErrors({
                submit: error instanceof Error
                    ? error.message
                    : 'Unable to add the device.',
            });
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "modal-overlay", role: "presentation", onMouseDown: e => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }, children: _jsxs("div", { className: "add-device-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "add-device-title", children: [_jsxs("div", { className: "add-device-header", children: [_jsxs("div", { children: [_jsx("h2", { id: "add-device-title", children: isEditing ? 'Edit Device' : 'Add Device' }), _jsx("p", { children: isEditing
                                        ? 'Update the registered device details.'
                                        : 'Register a new device to start monitoring it.' })] }), _jsx("button", { type: "button", className: "modal-close", "aria-label": "Close", onClick: onClose, children: "\u00D7" })] }), _jsxs("form", { className: "add-device-body", onSubmit: handleSubmit, children: [_jsxs("div", { className: "dm-form-grid", children: [_jsxs("div", { className: "dm-field", children: [_jsxs("label", { className: "dm-field-label", htmlFor: "dev-name", children: ["Property Number", _jsx("em", { children: "*" })] }), _jsx("input", { id: "dev-name", type: "text", placeholder: "e.g. PROP-2024-001", required: true, value: name, onChange: e => setName(e.target.value), "aria-invalid": !!errors.name }), errors.name && (_jsx("span", { className: "dm-field-error", children: errors.name }))] }), _jsxs("div", { className: "dm-field", children: [_jsxs("label", { className: "dm-field-label", htmlFor: "dev-type", children: ["Device Type", _jsx("em", { children: "*" })] }), _jsx("select", { id: "dev-type", required: true, value: selectedType, onChange: e => setType(e.target.value), children: NETWORK_DEVICE_TYPES.map(t => (_jsx("option", { children: t }, t))) })] }), _jsxs("div", { className: "dm-field", children: [_jsxs("label", { className: "dm-field-label", htmlFor: "dev-ip", children: ["IP Address", _jsx("em", { children: "*" })] }), _jsx("input", { id: "dev-ip", type: "text", placeholder: "10.10.0.5", required: true, value: ip, onChange: e => setIp(e.target.value), "aria-invalid": !!errors.ip }), errors.ip && (_jsx("span", { className: "dm-field-error", children: errors.ip }))] }), _jsxs("div", { className: "dm-field", children: [_jsxs("label", { className: "dm-field-label", htmlFor: "dev-location", children: ["Location", _jsx("em", { children: "*" })] }), _jsx("input", { id: "dev-location", type: "text", placeholder: "e.g. City Hall, 2nd Floor", required: true, value: location, onChange: e => setLocation(e.target.value), "aria-invalid": !!errors.location }), errors.location && (_jsx("span", { className: "dm-field-error", children: errors.location }))] }), _jsxs("div", { className: "dm-field", children: [_jsxs("label", { className: "dm-field-label", htmlFor: "dev-department", children: ["Office", _jsx("em", { children: "*" })] }), _jsx("select", { id: "dev-department", required: true, disabled: officesLoading || offices.length === 0, value: selectedDepartment, onChange: e => setDepartment(e.target.value), children: offices.map(d => (_jsx("option", { children: d }, d))) })] }), _jsxs("div", { className: "dm-field", children: [_jsxs("label", { className: "dm-field-label", htmlFor: "dev-user", children: ["User ", _jsx("span", { children: "(optional)" })] }), _jsxs("div", { className: `dm-user-picker${userDropdownOpen ? ' is-open' : ''}`, children: [_jsxs("button", { id: "dev-user", type: "button", className: "dm-user-picker-trigger", "aria-haspopup": "listbox", "aria-expanded": userDropdownOpen, onClick: () => setUserDropdownOpen(open => !open), children: [_jsx("span", { children: selectedUser
                                                                ? `${selectedUser.fullName} • ${selectedUser.employeeId} • ${selectedUser.department}`
                                                                : 'No assigned user' }), _jsx("i", { "aria-hidden": "true" })] }), userDropdownOpen && (_jsxs("div", { className: "dm-user-picker-options", role: "listbox", "aria-labelledby": "dev-user", children: [_jsx("button", { type: "button", role: "option", "aria-selected": !assignedUserId, className: !assignedUserId ? 'selected' : '', onClick: () => { setAssignedUserId(''); setUserDropdownOpen(false); }, children: "No assigned user" }), users.map(user => {
                                                            const value = String(user.userID);
                                                            const selected = value === assignedUserId;
                                                            return (_jsxs("button", { type: "button", role: "option", "aria-selected": selected, className: selected ? 'selected' : '', onClick: () => { setAssignedUserId(value); setUserDropdownOpen(false); }, children: [_jsx("strong", { children: user.fullName }), _jsxs("span", { children: [user.employeeId, " - ", user.department] })] }, value));
                                                        })] }))] })] }), _jsxs("div", { className: "dm-field", children: [_jsxs("label", { className: "dm-field-label", htmlFor: "dev-firmware", children: ["Firmware Version ", _jsx("span", { children: "(optional)" })] }), _jsx("input", { id: "dev-firmware", type: "text", placeholder: "e.g. v4.2.1", value: firmware, onChange: e => setFirmware(e.target.value) })] })] }), errors.submit && (_jsx("p", { className: "dm-form-error", role: "alert", children: errors.submit })), _jsxs("div", { className: "add-device-footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: onClose, disabled: saving, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: saving, children: isEditing ? 'Save Changes' : 'Add Device' })] })] })] }) }));
}
function DeviceMonitoring({ audience = 'administrator', }) {
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useAppDialog();
    const isIT = audience === 'it';
    const roleNavigation = isIT
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
    /* ---------- Current logged-in user ---------- */
    const session = getAuthSession();
    const currentUser = session?.user;
    const currentUserName = currentUser?.fullName ||
        getCurrentUserName() ||
        (isIT ? 'IT Personnel' : 'Administrator');
    const currentUserRole = currentUser?.role ||
        getCurrentUserRole() ||
        (isIT ? 'IT Personnel' : 'Administrator');
    const profilePath = isIT
        ? '/it/profile'
        : '/admin/profile';
    /* ---------- Profile photo synchronization ---------- */
    const [profileAvatar, setProfileAvatar] = useState(() => getProfilePhotoUrl(currentUser?.profilePhoto, currentUser?.fullName, currentUser?.role));
    useEffect(() => {
        const updateProfilePhoto = () => {
            const updatedSession = getAuthSession();
            const updatedUser = updatedSession?.user;
            if (!updatedUser)
                return;
            setProfileAvatar(getProfilePhotoUrl(updatedUser.profilePhoto, updatedUser.fullName, updatedUser.role));
        };
        /*
         * Read the latest profile photo immediately when
         * the component mounts.
         */
        updateProfilePhoto();
        /*
         * Listen for the custom event dispatched by
         * Admin/Profile.tsx after a successful upload.
         */
        window.addEventListener('batangai-auth-updated', updateProfilePhoto);
        return () => {
            window.removeEventListener('batangai-auth-updated', updateProfilePhoto);
        };
    }, []);
    /* ---------- Page state ---------- */
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [deviceList, setDeviceList] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [deviceError, setDeviceError] = useState('');
    const deviceRequestInFlight = useRef(false);
    const [refreshingAll, setRefreshingAll] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [query, setQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [expandedId, setExpandedId] = useState(null);
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    const loadDevices = useCallback(async () => {
        // Do not stack another full network scan if a previous one is still running.
        if (deviceRequestInFlight.current)
            return;
        deviceRequestInFlight.current = true;
        try {
            const response = await fetch(DEVICES_URL);
            const data = (await response.json());
            if (!response.ok ||
                !data.success ||
                !Array.isArray(data.devices)) {
                throw new Error(data.message ||
                    'Unable to load devices.');
            }
            setDeviceList(data.devices);
            setDeviceError('');
        }
        catch (error) {
            setDeviceError(error instanceof Error
                ? error.message
                : 'Unable to load devices.');
        }
        finally {
            deviceRequestInFlight.current = false;
            setLoadingDevices(false);
        }
    }, []);
    useEffect(() => {
        const initialLoad = window.setTimeout(() => {
            void loadDevices();
            void fetch(USERS_URL)
                .then(response => response.json())
                .then((data) => {
                if (data.success &&
                    Array.isArray(data.users)) {
                    setUsers(data.users.filter(user => user.status?.toLowerCase() === 'active' &&
                        user.role?.toLowerCase() === 'employee'));
                }
            })
                .catch(() => setUsers([]));
        }, 0);
        const refreshInterval = window.setInterval(() => {
            void loadDevices();
        }, 15_000);
        return () => {
            window.clearTimeout(initialLoad);
            window.clearInterval(refreshInterval);
        };
    }, [loadDevices]);
    const filtered = useMemo(() => {
        return deviceList.filter(d => {
            const normalizedQuery = query.trim().toLowerCase();
            const matchesQuery = normalizedQuery === '' ||
                d.name
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                d.ip.includes(query) ||
                d.id
                    .toLowerCase()
                    .includes(normalizedQuery);
            const matchesType = typeFilter === 'All Types' ||
                d.type === typeFilter;
            const matchesStatus = statusFilter === 'All Statuses' ||
                d.status === statusFilter.toLowerCase();
            return (matchesQuery &&
                matchesType &&
                matchesStatus);
        });
    }, [
        deviceList,
        query,
        typeFilter,
        statusFilter,
    ]);
    const counts = useMemo(() => ({
        total: deviceList.length,
        online: deviceList.filter(d => d.status === 'online').length,
        offline: deviceList.filter(d => d.status === 'offline').length,
    }), [deviceList]);
    const handleAddDevice = async (device) => {
        const response = await fetch(DEVICES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'add',
                ...device,
            }),
        });
        const data = (await response.json());
        if (!response.ok ||
            !data.success ||
            !data.device) {
            throw new Error(data.message ||
                'Unable to add the device.');
        }
        setDeviceList(list => [
            data.device,
            ...list,
        ]);
        setShowAddModal(false);
        setExpandedId(data.device.id);
    };
    const handleUpdateDevice = async (deviceId, device) => {
        const response = await fetch(DEVICES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', deviceID: deviceId, ...device }),
        });
        const data = await response.json();
        if (!response.ok || !data.success || !data.device) {
            throw new Error(data.message || 'Unable to update the device.');
        }
        setDeviceList(list => list.map(item => item.id === deviceId ? data.device : item));
        setEditingDevice(null);
    };
    const refreshDevice = async (device) => {
        const response = await fetch(DEVICES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ping', deviceID: device.id }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to refresh device status.');
        }
        let result = data;
        if (data.pending && data.requestID) {
            for (let attempt = 0; attempt < 24; attempt += 1) {
                await new Promise(resolve => window.setTimeout(resolve, 1000));
                const statusResponse = await fetch(DEVICES_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'ping_status',
                        deviceID: device.id,
                        requestID: data.requestID,
                    }),
                });
                const statusData = await statusResponse.json();
                if (!statusResponse.ok || !statusData.success) {
                    throw new Error(statusData.message || 'Unable to retrieve refreshed status.');
                }
                result = statusData;
                if (!statusData.pending)
                    break;
            }
        }
        if (result.pending || !result.status || result.status === 'unknown') {
            throw new Error('The monitoring agent did not return a result. Check that it is running inside the device network.');
        }
        setDeviceList(list => list.map(item => item.id === device.id
            ? {
                ...item,
                status: result.status,
                lastSeen: result.lastSeen ?? item.lastSeen,
                lastPingAt: result.lastPingAt ?? null,
            }
            : item));
    };
    const refreshAllDevices = async () => {
        if (refreshingAll || deviceList.length === 0)
            return;
        setRefreshingAll(true);
        try {
            const results = await Promise.allSettled(deviceList.map(refreshDevice));
            const failures = results.filter(result => result.status === 'rejected');
            if (failures.length > 0) {
                const firstError = failures[0].status === 'rejected' ? failures[0].reason : null;
                const detail = firstError instanceof Error ? ` ${firstError.message}` : '';
                void showAlert(`Could not refresh ${failures.length} of ${deviceList.length} devices.${detail}`);
            }
        }
        finally {
            setRefreshingAll(false);
        }
    };
    const deleteDevice = async (device) => {
        if (!await showConfirm(`Delete ${device.name} (${device.id})? This cannot be undone.`, 'Delete device?'))
            return;
        setDeletingId(device.id);
        try {
            const response = await fetch(DEVICES_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', deviceID: device.id }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to delete device.');
            }
            setDeviceList(list => list.filter(item => item.id !== device.id));
            setExpandedId(current => current === device.id ? null : current);
        }
        catch (error) {
            void showAlert(error instanceof Error ? error.message : 'Unable to delete device.');
        }
        finally {
            setDeletingId(null);
        }
    };
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": `${currentUserRole} navigation`, children: roleNavigation.map(item => (_jsxs("button", { className: item.label ===
                                'Device Monitoring'
                                ? 'is-active'
                                : '', type: "button", onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(current => !current), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: "Device Monitoring" }), _jsx("p", { children: "Track the status and health of all network devices." })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: currentUserName, role: currentUserRole, avatar: profileAvatar, profilePath: profilePath, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content", children: [_jsxs("section", { className: "statistics-grid dm-stats", children: [_jsx(StatCard, { icon: "devices", number: String(counts.total), title: "Total Devices", tone: "blue" }), _jsx(StatCard, { icon: "online", number: String(counts.online), title: "Online", tone: "green" }), _jsx(StatCard, { icon: "offline", number: String(counts.offline), title: "Offline", tone: "red" })] }), _jsxs("div", { className: "incident-tools dm-device-tools", children: [_jsxs("label", { className: "incident-search", children: [_jsx(Icon, { name: "search" }), _jsx("input", { type: "text", placeholder: "Search by name, ID, or IP address...", value: query, onChange: e => setQuery(e.target.value) })] }), _jsxs("div", { className: "dm-toolbar-actions", children: [_jsxs("div", { className: "dm-filter-group", children: [_jsx("label", { className: "dm-filter-select", "aria-label": "Filter by device type", children: _jsxs("select", { "aria-label": "Filter by device type", value: typeFilter, onChange: e => setTypeFilter(e.target.value), children: [_jsx("option", { children: "All Types" }), _jsx("option", { children: "Router" }), _jsx("option", { children: "Switch" }), _jsx("option", { children: "Access Point" })] }) }), _jsx("label", { className: "dm-filter-select", "aria-label": "Filter by device status", children: _jsxs("select", { "aria-label": "Filter by device status", value: statusFilter, onChange: e => setStatusFilter(e.target.value), children: [_jsx("option", { children: "All Statuses" }), _jsx("option", { children: "Online" }), _jsx("option", { children: "Offline" })] }) })] }), _jsxs("button", { type: "button", className: "incident-new", onClick: () => setShowAddModal(true), children: [_jsx(Icon, { name: "plus" }), "Add Device"] }), _jsxs("button", { type: "button", className: "incident-new dm-ping-all", disabled: refreshingAll || deviceList.length === 0, onClick: () => void refreshAllDevices(), children: [_jsx(Icon, { name: "online" }), refreshingAll ? 'PINGING…' : 'PING'] })] })] }), loadingDevices ? (_jsx("div", { className: "dm-grid", children: _jsx("div", { className: "dashboard-card dm-empty", children: "Loading devices\u2026" }) })) : deviceError ? (_jsx("div", { className: "dm-grid", children: _jsxs("div", { className: "dashboard-card dm-empty", children: [deviceError, ' ', _jsx("button", { type: "button", className: "dm-retry", onClick: () => void loadDevices(), children: "Retry" })] }) })) : filtered.length === 0 ? (_jsx("div", { className: "dm-grid", children: _jsx("div", { className: "dashboard-card dm-empty", children: "No devices match your search or filters." }) })) : (_jsx("div", { className: "dm-grid", children: filtered.map(device => (_jsx(DeviceCard, { device: device, expanded: expandedId === device.id, deleting: deletingId === device.id, onDelete: () => void deleteDevice(device), onEdit: () => setEditingDevice(device), onToggle: () => setExpandedId(current => current === device.id
                                        ? null
                                        : device.id) }, device.id))) }))] })] }), showAddModal && (_jsx(AddDeviceModal, { onClose: () => setShowAddModal(false), onAdd: handleAddDevice, users: users })), editingDevice && (_jsx(AddDeviceModal, { onClose: () => setEditingDevice(null), onAdd: handleAddDevice, onEdit: handleUpdateDevice, initialDevice: editingDevice, users: users }))] }));
}
export default DeviceMonitoring;
