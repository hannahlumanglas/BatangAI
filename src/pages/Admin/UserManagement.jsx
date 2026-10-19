import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { AdminNotifications } from './AdminNotifications';
import './Dashboard.css';
import './UserManagement.css';
import { getAuthSession, getRoleDisplayName, getProfilePhotoUrl, signOut, } from '../../auth';
import { API_BASE_URL } from '../../apiConfig';
import { useOffices } from '../../hooks/useOffices';
import { useSystemOptions } from '../../hooks/useSystemOptions';
import { useAppDialog } from '../../components/AppDialog';
/* --------- API ---------- */
const USERS_API_URL = `${API_BASE_URL}/users.php`;
const UPDATE_USER_API_URL = `${API_BASE_URL}/update_user.php`;
const CREATE_USER_API_URL = `${API_BASE_URL}/create_user.php`;
const UPDATE_USER_STATUS_API_URL = `${API_BASE_URL}/update_user_status.php`;
/* ---------- Helpers ---------- */
function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
function formatJoinedDate(value) {
    if (!value)
        return 'â€”';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
function normalizeRole(value) {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'admin' || normalized === 'administrator') {
        return 'Administrator';
    }
    if (normalized === 'secretary') {
        return 'Secretary';
    }
    if (normalized === 'it personnel' ||
        normalized === 'it support' ||
        normalized === 'it_personnel' ||
        normalized === 'it-personnel') {
        return 'IT Personnel';
    }
    return 'Employee';
}
function normalizeStatus(value) {
    return value.trim().toLowerCase() === 'inactive'
        ? 'Inactive'
        : 'Active';
}
async function updateUserOnServer(payload) {
    const response = await fetch(UPDATE_USER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    }
    catch {
        throw new Error(responseText.trim().startsWith('<')
            ? 'The server returned an error page instead of JSON. Check the PHP server log and try again.'
            : 'The server returned an invalid response. Please try again.');
    }
    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update the user.');
    }
}
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
        shield: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M12 3 20 6v5c0 5-3.3 8-8 10-4.7-2-8-5-8-10V6l8-3Z" }), _jsx("path", { d: "m8 14 8-8M8 6l8 8" })] })),
        admin: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 18h16M6 18l1-8 5 3 5-3 1 8M9 7l3-4 3 4" }) })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" }), _jsx("path", { d: "M18 8v6M15 11h6" })] })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
/* ---------- Small shared pieces ---------- */
function StatusBadge({ status }) {
    return (_jsxs("span", { className: `status status--${status.toLowerCase()}`, children: [_jsx("i", {}), status] }));
}
/* ---------- Navigation ---------- */
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
/* =========================================================
   USER DIRECTORY ROW
   ========================================================= */
function UserDirectoryRow({ user, onSelect, }) {
    return (_jsx("div", { className: "um-directory-row", children: _jsxs("button", { className: "um-directory-name", type: "button", onClick: () => onSelect(user.id), children: [_jsx("span", { className: "user-card-avatar", children: _jsx("img", { src: getProfilePhotoUrl(user.profilePhoto, user.name, user.role), alt: "" }) }), _jsx("span", { children: _jsx("strong", { children: user.name }) })] }) }));
}
function getRoleLabel(role) {
    return getRoleDisplayName(role);
}
/* =========================================================
   CHANGE PASSWORD
   Existing UI retained.
   ========================================================= */
function PasswordVisibilityIcon({ visible }) {
    return (_jsxs("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" }), _jsx("circle", { cx: "12", cy: "12", r: "2.7" }), visible && _jsx("path", { d: "M4 20 20 4" })] }));
}
function ChangePasswordCard({ user, onSaved, resetMode = false, }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updating, setUpdating] = useState(false);
    const administratorEmail = getAuthSession()?.user.email ?? '';
    const handleUpdate = async () => {
        setError('');
        setSuccess('');
        if (!currentPassword) {
            setError('Enter your current Administrator password to continue.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            setError('Password must contain at least one uppercase letter.');
            return;
        }
        if (!/[a-z]/.test(newPassword)) {
            setError('Password must contain at least one lowercase letter.');
            return;
        }
        if (!/[0-9]/.test(newPassword)) {
            setError('Password must contain at least one number.');
            return;
        }
        if (!/[^a-zA-Z0-9]/.test(newPassword)) {
            setError('Password must contain at least one special character.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        const targetUserID = user.userID;
        if (targetUserID === undefined ||
            targetUserID === null ||
            String(targetUserID).trim() === '') {
            setError('Unable to identify the selected user.');
            return;
        }
        const session = getAuthSession();
        const adminUserID = session?.user?.userID;
        if (adminUserID === undefined ||
            adminUserID === null ||
            String(adminUserID).trim() === '') {
            setError('Administrator session not found. Please log in again.');
            return;
        }
        setUpdating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/change_password.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    adminUserID,
                    userID: targetUserID,
                    currentPassword,
                    newPassword,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to update the password.');
            }
            setSuccess(data.message || `Password updated for ${user.name}.`);
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
            await onSaved();
        }
        catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : 'Unable to update the password. Please try again.');
        }
        finally {
            setUpdating(false);
        }
    };
    return (_jsxs("article", { className: `dashboard-card um-password-card${resetMode ? ' is-reset-mode' : ''}`, children: [_jsx("header", { className: "um-panel-heading", children: _jsxs("div", { children: [_jsx("p", { className: "um-eyebrow", children: "Security" }), _jsx("h2", { children: resetMode ? 'Security' : 'Password & Security' }), _jsx("span", { children: resetMode ? `Reset the password for ${user.name}'s account. Enter your current Administrator password to authorize.` : `Confirm your current Administrator password before setting a new password for ${user.name}.` })] }) }), _jsx("input", { className: "um-autofill-username", type: "email", name: "username", value: administratorEmail, autoComplete: "username", readOnly: true, tabIndex: -1, "aria-hidden": "true" }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Current Password" }), _jsxs("div", { className: "um-password-input-wrap", children: [_jsx("input", { type: showCurrentPassword ? 'text' : 'password', name: "current-password", value: currentPassword, onChange: e => { setCurrentPassword(e.target.value); setError(''); setSuccess(''); }, placeholder: "Enter your current password", autoComplete: "current-password", disabled: updating }), _jsx("button", { type: "button", onClick: () => setShowCurrentPassword(value => !value), "aria-label": showCurrentPassword ? 'Hide current password' : 'Show current password', children: _jsx(PasswordVisibilityIcon, { visible: showCurrentPassword }) })] })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "New Password" }), _jsxs("div", { className: "um-password-input-wrap", children: [_jsx("input", { type: showNewPassword ? 'text' : 'password', value: newPassword, onChange: e => { setNewPassword(e.target.value); setError(''); setSuccess(''); }, placeholder: "Enter new password", autoComplete: "new-password", disabled: updating }), _jsx("button", { type: "button", onClick: () => setShowNewPassword(value => !value), "aria-label": showNewPassword ? 'Hide new password' : 'Show new password', children: _jsx(PasswordVisibilityIcon, { visible: showNewPassword }) })] })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Confirm New Password" }), _jsxs("div", { className: "um-password-input-wrap", children: [_jsx("input", { type: showConfirmPassword ? 'text' : 'password', value: confirmPassword, onChange: e => { setConfirmPassword(e.target.value); setError(''); setSuccess(''); }, placeholder: "Re-enter new password", autoComplete: "new-password", disabled: updating }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(value => !value), "aria-label": showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password', children: _jsx(PasswordVisibilityIcon, { visible: showConfirmPassword }) })] })] }), error && (_jsx("p", { className: "um-form-message um-form-error", children: error })), success && (_jsx("p", { className: "um-form-message um-form-success", children: success })), _jsx("div", { className: "um-password-actions", children: _jsx("button", { type: "button", className: "um-btn-primary", onClick: handleUpdate, disabled: updating, children: updating ? 'Updating Password...' : 'Update Password' }) })] }));
}
/* SELECTED USER DETAILS*/
function UserDetails({ user, onSaved, onClose, onToggleStatus, }) {
    const { offices } = useOffices();
    const { options: systemOptions } = useSystemOptions();
    const departmentOptions = offices.includes(user.department) ? offices : [user.department, ...offices];
    const [values, setValues] = useState({ name: user.name, email: user.email, department: user.department, role: user.role });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const save = async () => {
        if (!values.name.trim() || !values.department.trim() || !values.email.trim()) {
            setError('Complete all account fields before saving.');
            return;
        }
        try {
            setSaving(true);
            setError('');
            await updateUserOnServer({ action: 'update', userID: user.id, fullName: values.name.trim(), email: values.email.trim(), department: values.department.trim(), role: values.role });
            await onSaved();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save user changes.');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "um-inline-profile-content", children: [_jsxs("article", { className: "dashboard-card um-account-card um-inline-account-card", children: [_jsxs("header", { className: "um-panel-heading um-account-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "um-eyebrow", children: "USER PROFILE" }), _jsx("h2", { children: "User details" })] }), _jsx("button", { type: "button", className: "um-inline-close", "aria-label": "Close user profile", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "um-account-profile", children: [_jsx("span", { className: "um-account-avatar", children: _jsx("img", { src: getProfilePhotoUrl(user.profilePhoto, user.name, user.role), alt: `${user.name} profile` }) }), _jsxs("div", { className: "um-account-identity", children: [_jsxs("div", { className: "um-account-name-line", children: [_jsx("strong", { children: user.name }), _jsx(StatusBadge, { status: user.status })] }), _jsxs("div", { className: "um-inline-user-meta", children: [_jsxs("span", { children: [_jsxs("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }), _jsx("path", { d: "m3 7 9 6 9-6" })] }), user.email] }), _jsxs("span", { children: [_jsxs("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "8", r: "3.5" }), _jsx("path", { d: "M5 20a7 7 0 0 1 14 0" })] }), getRoleLabel(user.role)] }), _jsxs("span", { children: [_jsx("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M8 9h1m6 0h1m-8 3h1m6 0h1" }) }), user.department] })] })] })] }), _jsxs("section", { className: "um-inline-info-section", children: [_jsx("h3", { className: "um-inline-section-title", children: "Account Information" }), _jsxs("div", { className: "um-inline-edit-grid", children: [_jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Full Name" }), _jsx("input", { value: values.name, onChange: e => setValues(current => ({ ...current, name: e.target.value })) })] }), _jsxs("div", { className: "um-field", children: [_jsx("span", { children: "Employee ID" }), _jsx("div", { className: "um-inline-readonly-value", children: user.employeeId }), _jsx("small", { className: "um-inline-readonly-note", children: "Automatically generated when the account is created" })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Email Address" }), _jsx("input", { type: "email", value: values.email, onChange: e => setValues(current => ({ ...current, email: e.target.value })) })] }), _jsxs("div", { className: "um-field", children: [_jsx("span", { children: "Date Joined" }), _jsx("div", { className: "um-inline-readonly-value", children: user.joined || 'Not available' }), _jsx("small", { className: "um-inline-readonly-note", children: "Automatically set when the account is created" })] })] })] }), _jsxs("section", { className: "um-inline-info-section", children: [_jsx("h3", { className: "um-inline-section-title", children: "Access" }), _jsxs("div", { className: "um-inline-edit-grid um-inline-role-grid", children: [_jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Office" }), _jsxs("select", { value: values.department, onChange: e => setValues(current => ({ ...current, department: e.target.value })), children: [_jsx("option", { value: "", disabled: true, children: "Select office" }), departmentOptions.map(department => _jsx("option", { value: department, children: department }, department))] })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Role" }), _jsx("select", { value: values.role, onChange: e => setValues(current => ({ ...current, role: e.target.value })), children: (systemOptions.user_role ?? []).map(role => _jsx("option", { value: role, children: role === 'Secretary' ? 'Front Desk' : role === 'IT Personnel' ? 'Technician' : role }, role)) })] })] })] }), error && _jsx("p", { className: "um-form-message um-form-error", children: error })] }), _jsx(ChangePasswordCard, { user: user, onSaved: onSaved, resetMode: true }), _jsxs("footer", { className: "um-inline-save-actions", children: [_jsx("span", { className: "um-inline-save-spacer" }), _jsx("button", { type: "button", className: user.status === 'Active' ? 'um-btn-danger' : 'um-btn-primary', onClick: () => void onToggleStatus(user), children: user.status === 'Active' ? 'Disable Account' : 'Enable Account' }), _jsx("button", { type: "button", className: "um-btn-primary", disabled: saving, onClick: save, children: saving ? 'Saving...' : 'Save Changes' })] })] }));
}
/* CREATE USER MODAL */
function CreateUserModal({ onClose, onCreated, }) {
    const { offices, loading: officesLoading, error: officesError } = useOffices();
    const { options: systemOptions } = useSystemOptions();
    const session = getAuthSession();
    const [form, setForm] = useState({
        fullName: '',
        department: '',
        email: '',
        role: 'Employee',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
    const [departmentOpen, setDepartmentOpen] = useState(false);
    const [departmentHighlight, setDepartmentHighlight] = useState(0);
    const departmentRef = useRef(null);
    const filteredDepartments = useMemo(() => {
        const search = form.department.trim().toLowerCase();
        if (!search) {
            return [...offices];
        }
        return offices.filter(office => office.toLowerCase().includes(search));
    }, [form.department, offices]);
    useEffect(() => {
        if (!departmentOpen)
            return;
        const handleOutsideClick = (event) => {
            if (departmentRef.current &&
                !departmentRef.current.contains(event.target)) {
                setDepartmentOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [departmentOpen]);
    const selectDepartment = (department) => {
        updateField('department', department);
        setDepartmentOpen(false);
        setDepartmentHighlight(0);
    };
    const updateField = (field, value) => {
        if (field === 'department')
            setDepartmentHighlight(0);
        setForm(current => ({
            ...current,
            [field]: value,
        }));
        setError('');
        setSuccess('');
    };
    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long.';
        }
        return '';
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!session?.user?.userID) {
            setError('Administrator session could not be verified. Please log in again.');
            return;
        }
        if (!form.fullName.trim() ||
            !form.department.trim() ||
            !form.email.trim() ||
            !form.password ||
            !form.confirmPassword) {
            setError('Please complete all required fields.');
            return;
        }
        if (!offices.includes(form.department.trim())) {
            setError('Please select an office from the list.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }
        if (form.password !==
            form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        const passwordError = validatePassword(form.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(CREATE_USER_API_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: form.fullName.trim(),
                    department: form.department.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    role: form.role,
                }),
            });
            const data = await response.json();
            if (!response.ok ||
                !data.success) {
                throw new Error(data.message ||
                    'Unable to create the user account.');
            }
            const created = data.user;
            const newUser = {
                id: String(created.userID ??
                    created.employeeId),
                userID: created.userID,
                employeeId: created.employeeId ??
                    `EMP-${String(created.userID).padStart(4, '0')}`,
                name: created.fullName ??
                    form.fullName.trim(),
                initial: getInitials(created.fullName ??
                    form.fullName.trim()),
                email: created.email ??
                    form.email.trim(),
                department: created.department ??
                    form.department.trim(),
                role: normalizeRole(created.role ??
                    form.role),
                status: normalizeStatus(created.status ??
                    'Active'),
                joined: formatJoinedDate(created.dateCreated),
                profilePhoto: created.profilePhoto ??
                    null,
            };
            setSuccess('User account created successfully.');
            onCreated(newUser);
        }
        catch (err) {
            setError(err instanceof Error
                ? err.message
                : 'Unable to create the user account.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "um-modal-backdrop", role: "presentation", onMouseDown: e => {
            if (e.target === e.currentTarget &&
                !submitting) {
                onClose();
            }
        }, children: _jsxs("section", { className: "um-create-user-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "create-user-title", onMouseDown: e => e.stopPropagation(), children: [_jsxs("div", { className: "um-modal-header", children: [_jsxs("div", { children: [_jsx("h2", { id: "create-user-title", children: "Create User Account" }), _jsx("p", { children: "Add a new Employee, Front Desk, or Technician account." })] }), _jsx("button", { type: "button", className: "um-modal-close", onClick: onClose, disabled: submitting, "aria-label": "Close", children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18" }) }) })] }), _jsxs("form", { className: "um-create-user-form", onSubmit: handleSubmit, children: [_jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Full Name" }), _jsx("input", { type: "text", value: form.fullName, onChange: e => updateField('fullName', e.target.value), placeholder: "Enter full name", autoComplete: "name", disabled: submitting, required: true })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Employee ID" }), _jsx("input", { type: "text", value: "Automatically assigned when saved", autoComplete: "off", readOnly: true, "aria-readonly": "true" })] }), _jsxs("div", { className: "um-field", ref: departmentRef, children: [_jsx("span", { children: "Office" }), officesError && _jsx("small", { className: "um-form-error", role: "alert", children: officesError }), _jsxs("div", { style: {
                                        position: 'relative',
                                        width: '100%',
                                    }, children: [_jsx("input", { type: "text", value: form.department, onChange: e => {
                                                updateField('department', e.target.value);
                                                setDepartmentOpen(true);
                                            }, onFocus: () => {
                                                setDepartmentOpen(true);
                                                setDepartmentHighlight(0);
                                            }, onKeyDown: e => {
                                                if (!departmentOpen) {
                                                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                                                        e.preventDefault();
                                                        setDepartmentOpen(true);
                                                    }
                                                    return;
                                                }
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setDepartmentHighlight(current => filteredDepartments.length === 0
                                                        ? 0
                                                        : Math.min(current + 1, filteredDepartments.length - 1));
                                                }
                                                else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setDepartmentHighlight(current => Math.max(current - 1, 0));
                                                }
                                                else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const highlighted = filteredDepartments[departmentHighlight];
                                                    if (highlighted) {
                                                        selectDepartment(highlighted);
                                                    }
                                                }
                                                else if (e.key === 'Escape') {
                                                    e.preventDefault();
                                                    setDepartmentOpen(false);
                                                }
                                            }, placeholder: "Search or select office", autoComplete: "off", disabled: submitting || officesLoading || offices.length === 0, required: true, "aria-autocomplete": "list", "aria-expanded": departmentOpen, "aria-controls": "department-options", role: "combobox" }), departmentOpen && (_jsx("div", { id: "department-options", role: "listbox", style: {
                                                position: 'absolute',
                                                top: 'calc(100% + 6px)',
                                                left: 0,
                                                right: 0,
                                                zIndex: 1000,
                                                maxHeight: '240px',
                                                overflowY: 'auto',
                                                border: '1px solid rgba(100, 116, 139, 0.35)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg, #ffffff)',
                                                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
                                                padding: '6px',
                                            }, children: filteredDepartments.length > 0 ? (filteredDepartments.map((department, index) => (_jsx("button", { type: "button", role: "option", "aria-selected": form.department === department, onMouseDown: e => e.preventDefault(), onClick: () => selectDepartment(department), style: {
                                                    display: 'block',
                                                    width: '100%',
                                                    border: 0,
                                                    borderRadius: '7px',
                                                    padding: '10px 12px',
                                                    background: index === departmentHighlight
                                                        ? 'rgba(37, 99, 235, 0.10)'
                                                        : 'transparent',
                                                    color: 'inherit',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    font: 'inherit',
                                                    lineHeight: 1.35,
                                                }, children: department }, department)))) : (_jsx("div", { style: {
                                                    padding: '10px 12px',
                                                    color: '#64748b',
                                                    fontSize: '0.9rem',
                                                }, children: "No office found." })) }))] })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Email Address" }), _jsx("input", { type: "email", value: form.email, onChange: e => updateField('email', e.target.value), placeholder: "Enter email address", autoComplete: "email", disabled: submitting, required: true })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Account Role" }), _jsx("select", { value: form.role, onChange: e => updateField('role', e.target
                                        .value), disabled: submitting, required: true, children: (systemOptions.user_role ?? []).map(role => _jsx("option", { value: role, children: role === 'Secretary' ? 'Front Desk' : role === 'IT Personnel' ? 'Technician' : role }, role)) })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Password" }), _jsxs("div", { className: "um-password-input-wrap um-create-password-wrap", children: [_jsx("input", { type: showCreatePassword ? 'text' : 'password', value: form.password, onChange: e => updateField('password', e.target.value), placeholder: "Enter password", autoComplete: "new-password", disabled: submitting, required: true }), _jsx("button", { type: "button", onClick: () => setShowCreatePassword(value => !value), "aria-label": showCreatePassword ? 'Hide password' : 'Show password', children: _jsx(PasswordVisibilityIcon, { visible: showCreatePassword }) })] })] }), _jsxs("label", { className: "um-field", children: [_jsx("span", { children: "Confirm Password" }), _jsxs("div", { className: "um-password-input-wrap um-create-password-wrap", children: [_jsx("input", { type: showCreateConfirmPassword ? 'text' : 'password', value: form.confirmPassword, onChange: e => updateField('confirmPassword', e.target.value), placeholder: "Re-enter password", autoComplete: "new-password", disabled: submitting, required: true }), _jsx("button", { type: "button", onClick: () => setShowCreateConfirmPassword(value => !value), "aria-label": showCreateConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password', children: _jsx(PasswordVisibilityIcon, { visible: showCreateConfirmPassword }) })] })] }), _jsx("p", { className: "um-password-hint", children: "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character." }), error && (_jsx("p", { className: "um-form-message um-form-error", children: error })), success && (_jsx("p", { className: "um-form-message um-form-success", children: success })), _jsxs("div", { className: "um-modal-actions", children: [_jsx("button", { type: "button", className: "um-btn-secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx("button", { type: "submit", className: "um-btn-primary", disabled: submitting, children: submitting
                                        ? 'Creating Account...'
                                        : 'Create Account' })] })] })] }) }));
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
/* PROFILE MENU*/
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
    return (_jsxs("div", { className: "profile-menu-root", ref: rootRef, children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(current => !current), "aria-haspopup": "menu", "aria-expanded": open, children: [_jsx("div", { className: "topbar-avatar", children: avatar ? (_jsx("img", { src: avatar, alt: "" })) : (getInitials(name)) }), _jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("span", { children: role })] }), _jsx("span", { className: `profile-menu-chevron${open ? ' open' : ''}`, children: _jsx("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] }), "My Profile"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => navigate('/admin/settings'), children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" })] }), "Settings"] }), _jsxs("button", { type: "button", role: "menuitem", onClick: goToProfile, children: [_jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] }), "Change Password"] }), _jsx("span", { className: "profile-menu-divider" }), _jsxs("button", { type: "button", role: "menuitem", className: "danger", onClick: () => {
                            setOpen(false);
                            onLogout();
                        }, children: [_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) }), "Logout"] })] }))] }));
}
/* PAGE*/
function UserManagement() {
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useAppDialog();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { theme, toggleTheme, } = useTheme();
    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [usersError, setUsersError] = useState('');
    const session = getAuthSession();
    const adminName = (session?.user?.fullName?.trim().toLowerCase() === 'system administrator'
        ? 'Administrator'
        : session?.user?.fullName) ||
        'Administrator';
    const adminRole = session?.user?.role ||
        'Administrator';
    const currentUser = session?.user;
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
    /* LOAD USERS FROM DATABASE */
    const loadUsers = async () => {
        setLoadingUsers(true);
        setUsersError('');
        try {
            const response = await fetch(USERS_API_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Unable to load users. Server returned ${response.status}.`);
            }
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message ||
                    'Unable to load users.');
            }
            const databaseUsers = Array.isArray(data.users)
                ? data.users
                : [];
            const mappedUsers = databaseUsers.map((item) => {
                const storedName = String(item.fullName ?? item.name ?? 'Unknown User');
                const name = storedName.trim().toLowerCase() === 'system administrator'
                    ? 'Administrator'
                    : storedName;
                const userID = item.userID ??
                    item.id;
                const employeeId = String(item.employeeId ??
                    item.employeeID ??
                    '');
                return {
                    id: String(userID ??
                        employeeId ??
                        name),
                    userID: userID,
                    employeeId,
                    name,
                    initial: getInitials(name),
                    email: String(item.email ?? ''),
                    department: String(item.department ??
                        ''),
                    role: normalizeRole(String(item.role ??
                        'Employee')),
                    status: normalizeStatus(String(item.status ??
                        'Active')),
                    joined: formatJoinedDate(String(item.dateCreated ??
                        item.createdAt ??
                        '')),
                    profilePhoto: item.profilePhoto
                        ? String(item.profilePhoto)
                        : null,
                };
            });
            setUsers(mappedUsers);
        }
        catch (error) {
            setUsersError(error instanceof Error
                ? error.message
                : 'Unable to load users.');
        }
        finally {
            setLoadingUsers(false);
        }
    };
    useEffect(() => {
        const refreshUsers = () => {
            void loadUsers();
        };
        refreshUsers();
        window.addEventListener('focus', refreshUsers);
        window.addEventListener('batangai-auth-updated', refreshUsers);
        return () => {
            window.removeEventListener('focus', refreshUsers);
            window.removeEventListener('batangai-auth-updated', refreshUsers);
        };
    }, []);
    /* FILTER USERS */
    useEffect(() => {
        if (!selectedUserId)
            return;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setSelectedUserId(null);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [selectedUserId]);
    /* ---------- Search / Filter ---------- */
    const shown = useMemo(() => users.filter(user => (!roleFilter || user.role === roleFilter) &&
        (!departmentFilter || user.department === departmentFilter) &&
        user.name
            .toLowerCase()
            .includes(query
            .toLowerCase()
            .trim())), [departmentFilter, query, roleFilter, users]);
    const roleCounts = useMemo(() => ({
        total: users.length,
        administrator: users.filter(user => user.role === 'Administrator').length,
        helpdesk: users.filter(user => user.role === 'Secretary').length,
        employee: users.filter(user => user.role === 'Employee').length,
        itPersonnel: users.filter(user => user.role === 'IT Personnel').length,
    }), [users]);
    const { offices } = useOffices();
    const { options: systemOptions } = useSystemOptions();
    const departments = offices;
    const selectedUser = users.find(user => user.id === selectedUserId) ?? null;
    /* LOGOUT */
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    /* SELECT USER*/
    const handleSelect = (id) => {
        setSelectedUserId(id);
    };
    const handleToggleUserStatus = async (user) => {
        const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        const verb = nextStatus === 'Inactive' ? 'disable' : 're-enable';
        if (!await showConfirm(`Are you sure you want to ${verb} ${user.name}'s account?`, `${verb === 'disable' ? 'Disable' : 'Re-enable'} account?`))
            return;
        const adminUserID = session?.user?.userID;
        if (adminUserID === undefined || adminUserID === null || String(adminUserID).trim() === '') {
            void showAlert('Administrator session not found. Please log in again.');
            return;
        }
        const targetUserID = user.userID;
        if (targetUserID === undefined || targetUserID === null || String(targetUserID).trim() === '') {
            void showAlert('Unable to identify the selected user.');
            return;
        }
        try {
            const response = await fetch(UPDATE_USER_STATUS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ adminUserID, userID: targetUserID, status: nextStatus }),
            });
            const data = await response.json();
            if (!response.ok || !data.success)
                throw new Error(data.message || 'Unable to update the account status.');
            const updatedStatus = data.user?.status === 'Inactive' ? 'Inactive' : 'Active';
            setUsers(current => current.map(item => item.id === user.id ? { ...item, status: updatedStatus } : item));
            void showAlert(data.message || `${user.name}'s account is now ${updatedStatus}.`);
        }
        catch (requestError) {
            void showAlert(requestError instanceof Error ? requestError.message : 'Unable to update the account status. Please try again.');
        }
    };
    /* AFTER CREATE */
    const handleUserCreated = (createdUser) => {
        setUsers(current => [
            createdUser,
            ...current,
        ]);
        setShowCreateUser(false);
        setSelectedUserId(createdUser.id);
        setQuery('');
        setRoleFilter('');
        setDepartmentFilter('');
    };
    /* RENDER*/
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": "Administrator navigation", children: navigation.map(item => (_jsxs("button", { className: item.label ===
                                'User Management'
                                ? 'is-active'
                                : '', type: "button", onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(current => !current), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: "User Management" }), _jsx("p", { children: "Manage all system accounts and permissions." })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: adminName, role: adminRole, avatar: profileAvatar, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content", children: [!selectedUser && _jsxs(_Fragment, { children: [_jsx("section", { className: "statistics-grid um-stats", "aria-label": "User counts", children: [
                                            ['Total User', roleCounts.total, 'blue'],
                                            ['Administrator', roleCounts.administrator, 'purple'],
                                            ['Front Desk', roleCounts.helpdesk, 'orange'],
                                            ['Employee', roleCounts.employee, 'green'],
                                            ['Technician', roleCounts.itPersonnel, 'red'],
                                        ].map(([label, count, tone]) => (_jsxs("article", { className: `stat-card stat-card--${tone} um-role-stat`, children: [_jsx("div", { className: "stat-icon", children: _jsx(Icon, { name: "users" }) }), _jsxs("div", { children: [_jsx("h3", { children: label }), _jsx("strong", { children: loadingUsers ? '…' : count })] })] }, label))) }), _jsxs("section", { className: "incident-tools um-tools", children: [_jsxs("label", { className: "incident-search", children: [_jsx(Icon, { name: "search" }), _jsx("input", { value: query, onChange: e => setQuery(e.target.value), placeholder: "Search users by name..." })] }), _jsxs("div", { className: "um-toolbar-actions", children: [_jsx("label", { className: "um-filter-select", "aria-label": "Filter by role", children: _jsxs("select", { value: roleFilter, onChange: event => setRoleFilter(event.target.value), children: [_jsx("option", { value: "", children: "All Roles" }), (systemOptions.user_role ?? []).map(role => _jsx("option", { value: role, children: role === 'Secretary' ? 'Front Desk' : role === 'IT Personnel' ? 'Technician' : role }, role))] }) }), _jsx("label", { className: "um-filter-select", "aria-label": "Filter by office", children: _jsxs("select", { value: departmentFilter, onChange: event => setDepartmentFilter(event.target.value), children: [_jsx("option", { value: "", children: "All Offices" }), departments.map(item => _jsx("option", { children: item }, item))] }) }), _jsx("button", { type: "button", className: "um-btn-primary um-create-user-btn", onClick: () => setShowCreateUser(true), children: "+ Create User" })] })] }), usersError && (_jsx("p", { className: "um-form-message um-form-error", children: usersError })), loadingUsers ? (_jsx("div", { className: "um-empty", children: "Loading users..." })) : shown.length >
                                        0 ? (_jsx("section", { className: "um-directory", "aria-label": "User directory", children: _jsx("div", { className: "um-directory-list", children: shown.map(user => _jsx(UserDirectoryRow, { user: user, onSelect: handleSelect }, user.id)) }) })) : (_jsx("div", { className: "um-empty", children: "No users match your search or filters." }))] }), selectedUser && (_jsx("section", { className: "um-inline-user-details", "aria-label": `Profile and account security for ${selectedUser.name}`, children: _jsx(UserDetails, { user: selectedUser, onClose: () => setSelectedUserId(null), onSaved: async () => { await loadUsers(); }, onToggleStatus: handleToggleUserStatus }, selectedUser.id) }))] })] }), showCreateUser && (_jsx(CreateUserModal, { onClose: () => setShowCreateUser(false), onCreated: handleUserCreated }))] }));
}
export default UserManagement;
