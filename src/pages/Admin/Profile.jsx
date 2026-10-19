import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession, getDefaultProfileAvatar, getRoleDisplayName, getProfilePhotoUrl, saveAuthSession, signOut, } from '../../auth';
import logo from '../../assets/logo.png';
import { AdminNotifications } from './AdminNotifications';
import './Dashboard.css';
import './Profile.css';
import { API_BASE_URL } from '../../apiConfig';
import { useOffices } from '../../hooks/useOffices';
const UPDATE_USER_API_URL = `${API_BASE_URL}/update_user.php`;
function PasswordVisibilityButton({ visible, onClick }) {
    return _jsx("button", { type: "button", className: "password-visibility-button", onClick: onClick, "aria-label": visible ? 'Hide password' : 'Show password', title: visible ? 'Hide password' : 'Show password', children: _jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: visible ? _jsxs(_Fragment, { children: [_jsx("path", { d: "M3 3l18 18" }), _jsx("path", { d: "M10.6 10.6a2 2 0 0 0 2.8 2.8" }), _jsx("path", { d: "M9.9 5.1A10.8 10.8 0 0 1 12 5c5.1 0 8.7 4.5 9.5 7-.4 1.2-1.4 2.9-3 4.3M6.3 6.3C4.6 7.7 3.4 9.8 2.5 12c.8 2.5 4.4 7 9.5 7 1 0 1.9-.2 2.7-.5" })] }) : _jsxs(_Fragment, { children: [_jsx("path", { d: "M2.5 12S6.1 5 12 5s9.5 7 9.5 7-3.6 7-9.5 7S2.5 12 2.5 12Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] }) }) });
}
/*
|--------------------------------------------------------------------------
| Convert the authenticated user's role into the Profile audience.
|--------------------------------------------------------------------------
*/
function getAudienceFromRole(role) {
    switch (role) {
        case 'Administrator':
            return 'administrator';
        case 'Secretary':
            return 'secretary';
        case 'IT Personnel':
            return 'it';
        case 'Employee':
            return 'employee';
        default:
            return 'employee';
    }
}
/*
|--------------------------------------------------------------------------
| Build the account information from the authenticated session.
|--------------------------------------------------------------------------
*/
function getAccountFromSession(audience) {
    const session = getAuthSession();
    if (!session?.user) {
        return null;
    }
    const user = session.user;
    const fullName = user.fullName.trim().toLowerCase() === 'system administrator'
        ? 'Administrator'
        : user.fullName;
    const paths = {
        administrator: {
            profilePath: '/admin/profile',
            settingsPath: '/admin/settings',
        },
        secretary: {
            profilePath: '/secretary/profile',
            settingsPath: '/secretary/settings',
        },
        it: {
            profilePath: '/it/profile',
            settingsPath: '/it/settings',
        },
        employee: {
            profilePath: '/employee/profile',
            settingsPath: '/employee/settings',
        },
    };
    const path = paths[audience];
    return {
        name: fullName,
        email: user.email,
        id: user.employeeId,
        department: user.department,
        role: user.role,
        initial: fullName
            .split(/\s+/)
            .map(part => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase(),
        profilePath: path.profilePath,
        settingsPath: path.settingsPath,
    };
}
/*
|--------------------------------------------------------------------------
| Storage key for account information.
|--------------------------------------------------------------------------
*/
function accountKey() {
    const userID = getAuthSession()?.user.userID ?? 'guest';
    return `batangai-account-${userID}`;
}
/*
|--------------------------------------------------------------------------
| Profile navigation icons.
|--------------------------------------------------------------------------
*/
function ProfileNavIcon({ name, }) {
    const paths = {
        dashboard: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })] })),
        incidents: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2" }), _jsx("path", { d: "M9 4.5h6M9 10h6M9 14h6M9 18h3" })] })),
        assign: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M18 8v6M15 11h6" })] })),
        devices: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "13", rx: "1.5" }), _jsx("path", { d: "M8 21h8M12 17v4" })] })),
        users: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3" }), _jsx("circle", { cx: "17", cy: "9", r: "2" }), _jsx("path", { d: "M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" })] })),
        reports: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" }) })),
        profile: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] })),
        settings: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2.4-.7 2-3.4Z" })] })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
/*
|--------------------------------------------------------------------------
| Profile dropdown menu.
|--------------------------------------------------------------------------
*/
function ProfileMenu({ account, avatar, onLogout, }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const rootRef = useRef(null);
    useEffect(() => {
        const close = (event) => {
            if (rootRef.current &&
                !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => {
            document.removeEventListener('mousedown', close);
        };
    }, []);
    return (_jsxs("div", { className: "profile-menu-root", ref: rootRef, children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(value => !value), "aria-haspopup": "menu", "aria-expanded": open, "aria-label": "Open account menu", children: [_jsx("div", { className: "topbar-avatar", children: avatar ? (_jsx("img", { src: avatar, alt: "", onError: event => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = getDefaultProfileAvatar(account.name);
                            } })) : (account.initial) }), _jsxs("div", { children: [_jsx("strong", { children: account.name }), _jsx("span", { children: getRoleDisplayName(account.role) })] }), _jsx("span", { className: "profile-menu-chevron", children: "\u2304" })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate(account.profilePath);
                        }, children: "My Profile" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate(account.settingsPath);
                        }, children: "Settings" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate(`${account.settingsPath}#security`);
                        }, children: "Change Password" }), _jsx("span", { className: "profile-menu-divider" }), _jsx("button", { type: "button", role: "menuitem", className: "danger", onClick: onLogout, children: "Logout" })] }))] }));
}
/*
|--------------------------------------------------------------------------
| Main Profile component.
|--------------------------------------------------------------------------
*/
function Profile({ audience: requestedAudience = 'administrator', view = 'profile', }) {
    const navigate = useNavigate();
    const { offices } = useOffices();
    /*
    |--------------------------------------------------------------------------
    | Get currently authenticated user.
    |--------------------------------------------------------------------------
    */
    const session = getAuthSession();
    /*
    |--------------------------------------------------------------------------
    | If there is no logged-in user, return to login.
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (!session?.user) {
            navigate('/', {
                replace: true,
            });
        }
    }, [session, navigate]);
    useEffect(() => {
        localStorage.removeItem('batangai-two-factor');
    }, []);
    /*
    |--------------------------------------------------------------------------
    | Determine actual audience from logged-in user's role.
    |--------------------------------------------------------------------------
    */
    const actualAudience = session?.user
        ? getAudienceFromRole(session.user.role)
        : requestedAudience;
    /*
    |--------------------------------------------------------------------------
    | Build account from authentication session.
    |--------------------------------------------------------------------------
    */
    const sessionAccount = getAccountFromSession(actualAudience);
    /*
    |--------------------------------------------------------------------------
    | Fallback account.
    |--------------------------------------------------------------------------
    */
    const defaultAccount = sessionAccount ?? {
        name: 'BatangAI User',
        email: '',
        id: '',
        department: '',
        role: '',
        initial: 'BU',
        profilePath: '/',
        settingsPath: '/',
    };
    /*
    |--------------------------------------------------------------------------
    | Account state.
    |--------------------------------------------------------------------------
    */
    const [accountOverride, setAccountOverride] = useState(null);
    const account = accountOverride ?? defaultAccount;
    const setAccount = (update) => {
        setAccountOverride(current => update(current ?? defaultAccount));
    };
    /*
    |--------------------------------------------------------------------------
    | Profile avatar.
    |--------------------------------------------------------------------------
    |
    | Uses the profilePhoto saved in the authenticated session.
    | If no photo exists, a default avatar is generated.
    |--------------------------------------------------------------------------
    */
    const [avatar, setAvatar] = useState(() => {
        const currentSession = getAuthSession();
        if (!currentSession?.user) {
            return getDefaultProfileAvatar();
        }
        return getProfilePhotoUrl(currentSession.user.profilePhoto, currentSession.user.fullName, currentSession.user.role);
    });
    const handleAvatarLoadError = () => {
        const currentUser = getAuthSession()?.user;
        setAvatar(getDefaultProfileAvatar(currentUser?.fullName, currentUser?.role));
    };
    /*
    |--------------------------------------------------------------------------
    | Profile editing.
    |--------------------------------------------------------------------------
    */
    const [editing, setEditing] = useState(false);
    const [savingAccount, setSavingAccount] = useState(false);
    const [notice, setNotice] = useState('');
    /*
    |--------------------------------------------------------------------------
    | Uploading state.
    |--------------------------------------------------------------------------
    */
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [pendingPhoto, setPendingPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const photoPreviewUrlRef = useRef(null);
    useEffect(() => {
        return () => {
            if (photoPreviewUrlRef.current) {
                URL.revokeObjectURL(photoPreviewUrlRef.current);
            }
        };
    }, []);
    const updatePendingPhoto = (file) => {
        if (photoPreviewUrlRef.current) {
            URL.revokeObjectURL(photoPreviewUrlRef.current);
        }
        const previewUrl = file ? URL.createObjectURL(file) : null;
        photoPreviewUrlRef.current = previewUrl;
        setPendingPhoto(file);
        setPhotoPreview(previewUrl);
    };
    /*
    |--------------------------------------------------------------------------
    | Theme.
    |--------------------------------------------------------------------------
    */
    const [theme, setTheme] = useState(() => localStorage.getItem('batangai-theme') === 'dark'
        ? 'dark'
        : 'light');
    /*
    |--------------------------------------------------------------------------
    | Password.
    |--------------------------------------------------------------------------
    */
    const [password, setPassword] = useState({
        current: '',
        next: '',
        confirm: '',
    });
    const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const fileRef = useRef(null);
    /*
    |--------------------------------------------------------------------------
    | Account information displayed on the page.
    |--------------------------------------------------------------------------
    */
    const info = useMemo(() => [
        [
            'Full name',
            account.name,
        ],
        [
            'Email address',
            account.email,
        ],
        [
            'Employee ID',
            account.id,
        ],
        [
            'Office',
            account.department,
        ],
        [
            'Role',
            getRoleDisplayName(account.role),
        ],
    ], [account]);
    /*
    |--------------------------------------------------------------------------
    | Navigation based on role.
    |--------------------------------------------------------------------------
    */
    const navigation = actualAudience === 'administrator'
        ? [
            {
                label: 'Dashboard',
                path: '/admin',
                icon: 'dashboard',
            },
            {
                label: 'All Incidents',
                path: '/admin/incidents',
                icon: 'incidents',
            },
            {
                label: 'Manage & Assign',
                path: '/admin/manage-assign',
                icon: 'assign',
            },
            {
                label: 'My Assignments',
                path: '/admin/my-assignments',
                icon: 'assign',
            },
            {
                label: 'Device Monitoring',
                path: '/admin/device-monitoring',
                icon: 'devices',
            },
            {
                label: 'User Management',
                path: '/admin/user-management',
                icon: 'users',
            },
            {
                label: 'Generate Reports',
                path: '/admin/generate-reports',
                icon: 'reports',
            },
        ]
        : actualAudience === 'secretary'
            ? [
                {
                    label: 'All Incidents',
                    path: '/secretary/incidents',
                    icon: 'incidents',
                },
                {
                    label: 'Manage & Assign',
                    path: '/secretary/manage-assign',
                    icon: 'assign',
                },
            ]
            : actualAudience === 'it'
                ? [
                    {
                        label: 'All Incidents',
                        path: '/it/incidents',
                        icon: 'incidents',
                    },
                    {
                        label: 'My Assignments',
                        path: '/it/my-assignments',
                        icon: 'assign',
                    },
                    {
                        label: 'Device Monitoring',
                        path: '/it/device-monitoring',
                        icon: 'devices',
                    },
                ]
                : [
                    {
                        label: 'Report Incident',
                        path: '/employee/report-incident',
                        icon: 'reports',
                    },
                    {
                        label: 'All Incidents',
                        path: '/employee/incidents',
                        icon: 'incidents',
                    },
                ];
    /*
    |--------------------------------------------------------------------------
    | Theme effect.
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('batangai-theme', theme);
    }, [theme]);
    /*
    |--------------------------------------------------------------------------
    | Save profile information.
    |--------------------------------------------------------------------------
    */
    const saveAccount = async () => {
        const currentSession = getAuthSession();
        if (!currentSession?.user) {
            setNotice('You are not logged in.');
            return;
        }
        const fullName = account.name.trim();
        const email = account.email.trim().toLowerCase();
        const department = account.department.trim();
        if (!fullName || !email || !department) {
            setNotice('Please complete your name, email address, and office.');
            return;
        }
        setSavingAccount(true);
        setNotice('');
        try {
            const response = await fetch(UPDATE_USER_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    userID: String(currentSession.user.userID),
                    fullName,
                    email,
                    department,
                    role: currentSession.user.role,
                }),
            });
            let result;
            try {
                result = await response.json();
            }
            catch {
                throw new Error('The account service returned an invalid response.');
            }
            if (!response.ok || result.success !== true) {
                throw new Error(result.message || 'Unable to save your account information.');
            }
            const updatedAccount = { ...account, name: fullName, email, department };
            saveAuthSession({
                ...currentSession,
                user: {
                    ...currentSession.user,
                    fullName,
                    email,
                    department,
                },
            });
            localStorage.setItem(accountKey(), JSON.stringify(updatedAccount));
            setAccountOverride(updatedAccount);
            setEditing(false);
            setNotice('Your account information has been updated.');
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Unable to save your account information.');
        }
        finally {
            setSavingAccount(false);
        }
    };
    // Upload profile photos through the PHP API in local and hosted environments.
    const uploadAvatar = async (file) => {
        const currentSession = getAuthSession();
        if (!currentSession?.user) {
            setNotice('You are not logged in.');
            return;
        }
        /*
        |--------------------------------------------------------------------------
        | Validate image type.
        |--------------------------------------------------------------------------
        */
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        if (!allowedTypes.includes(file.type)) {
            setNotice('Please choose a JPG, PNG, or WEBP image.');
            return;
        }
        /*
        |--------------------------------------------------------------------------
        | Validate file size.
        |--------------------------------------------------------------------------
        */
        const maxFileSize = 5 * 1024 * 1024;
        if (file.size > maxFileSize) {
            setNotice('Profile photo must not exceed 5 MB.');
            return;
        }
        /*
        |--------------------------------------------------------------------------
        | Start uploading.
        |--------------------------------------------------------------------------
        */
        setUploadingPhoto(true);
        setNotice('Uploading profile photo...');
        try {
            const formData = new FormData();
            formData.append('userID', String(currentSession.user.userID));
            formData.append('profilePhoto', file);
            const response = await fetch(`${API_BASE_URL}/upload_profile_photo.php`, { method: 'POST', body: formData });
            const payload = await response.json();
            if (!payload || typeof payload !== 'object') {
                throw new Error('The upload service returned an invalid response.');
            }
            const result = payload;
            if (!response.ok || result.success !== true) {
                throw new Error(typeof result.message === 'string'
                    ? result.message
                    : 'Failed to upload profile photo.');
            }
            if (typeof result.profilePhoto !== 'string') {
                throw new Error('The upload service returned no profile photo.');
            }
            const uploadedProfilePhoto = result.profilePhoto;
            /*
            |--------------------------------------------------------------------------
            | Update authentication session with new photo.
            |--------------------------------------------------------------------------
            */
            const updatedSession = {
                ...currentSession,
                user: {
                    ...currentSession.user,
                    profilePhoto: uploadedProfilePhoto,
                },
            };
            saveAuthSession(updatedSession);
            // Let every mounted page refresh its avatar immediately.
            window.dispatchEvent(new Event('batangai-auth-updated'));
            /*
            |--------------------------------------------------------------------------
            | Build the new photo URL.
            |--------------------------------------------------------------------------
            */
            const newAvatar = getProfilePhotoUrl(uploadedProfilePhoto, currentSession.user.fullName, currentSession.user.role);
            /*
            |--------------------------------------------------------------------------
            | Immediately update the profile page.
            |--------------------------------------------------------------------------
            */
            setAvatar(newAvatar);
            /*
            |--------------------------------------------------------------------------
            | Reset file input so the same file can be selected again.
            |--------------------------------------------------------------------------
            */
            if (fileRef.current) {
                fileRef.current.value = '';
            }
            updatePendingPhoto(null);
            setNotice('Profile photo updated successfully.');
        }
        catch (error) {
            console.error('Profile photo upload error:', error);
            setNotice(error instanceof Error
                ? error.message
                : 'Failed to upload profile photo.');
        }
        finally {
            setUploadingPhoto(false);
        }
    };
    /*
    |--------------------------------------------------------------------------
    | Update password.
    |--------------------------------------------------------------------------
    */
    const updatePassword = async () => {
        const currentSession = getAuthSession();
        if (!currentSession?.user) {
            setNotice('You are not logged in.');
            return;
        }
        if (!password.current) {
            setNotice('Enter your current password.');
            return;
        }
        if (password.next.length < 8) {
            setNotice('Password must contain at least 8 characters.');
            return;
        }
        if (password.next !==
            password.confirm) {
            setNotice('Passwords do not match.');
            return;
        }
        try {
            setUpdatingPassword(true);
            const response = await fetch(UPDATE_USER_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'self_password',
                    userID: String(currentSession.user.userID),
                    currentPassword: password.current,
                    password: password.next,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to update password.');
            }
            setPassword({ current: '', next: '', confirm: '' });
            setNotice('Password updated successfully.');
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'Unable to update password.');
        }
        finally {
            setUpdatingPassword(false);
        }
    };
    /*
    |--------------------------------------------------------------------------
    | Logout.
    |--------------------------------------------------------------------------
    */
    const handleLogout = () => {
        signOut();
        navigate('/', {
            replace: true,
        });
    };
    /*
    |--------------------------------------------------------------------------
    | Render.
    |--------------------------------------------------------------------------
    */
    return (_jsxs("div", { className: "admin-shell profile-shell", children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsxs("nav", { className: "sidebar-nav", "aria-label": `${account.role} navigation`, children: [navigation.map(item => (_jsxs("button", { type: "button", onClick: () => navigate(item.path), children: [_jsx(ProfileNavIcon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.path))), _jsxs("button", { type: "button", className: view === 'profile'
                                    ? 'is-active'
                                    : '', onClick: () => navigate(account.profilePath), children: [_jsx(ProfileNavIcon, { name: "profile" }), _jsx("span", { children: "Profile" })] }), _jsxs("button", { type: "button", className: view === 'settings'
                                    ? 'is-active'
                                    : '', onClick: () => navigate(account.settingsPath), children: [_jsx(ProfileNavIcon, { name: "settings" }), _jsx("span", { children: "Settings" })] })] })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: view === 'profile'
                                            ? 'My Profile'
                                            : 'Settings' }), _jsx("p", { children: view === 'profile'
                                            ? 'Review and update your account information.'
                                            : 'Manage appearance and account security.' })] }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { account: account, avatar: avatar, onLogout: handleLogout })] }), _jsxs("div", { className: "dashboard-content profile-page-content", children: [notice && (_jsxs("div", { className: "profile-toast", role: "status", children: [notice, _jsx("button", { type: "button", onClick: () => setNotice(''), "aria-label": "Dismiss", children: "\u00D7" })] })), view === 'profile' ? (_jsxs("section", { className: "profile-layout", children: [_jsxs("article", { className: "dashboard-card profile-identity-card", children: [_jsx("div", { className: "profile-photo", children: avatar ? (_jsx("img", { src: photoPreview || avatar, alt: "Profile", onError: handleAvatarLoadError })) : (account.initial) }), _jsx("input", { ref: fileRef, type: "file", accept: "image/jpeg,image/png,image/webp", hidden: true, disabled: uploadingPhoto, onChange: event => updatePendingPhoto(event.target.files?.[0] ?? null) }), _jsx("button", { type: "button", className: "profile-photo-button", disabled: uploadingPhoto, onClick: () => fileRef.current?.click(), children: "Change photo" }), pendingPhoto && (_jsxs("div", { className: "profile-photo-actions", children: [_jsx("button", { type: "button", className: "profile-photo-button", disabled: uploadingPhoto, onClick: () => {
                                                            updatePendingPhoto(null);
                                                            if (fileRef.current)
                                                                fileRef.current.value = '';
                                                            setNotice('');
                                                        }, children: "Cancel" }), _jsx("button", { type: "button", className: "profile-photo-button", disabled: uploadingPhoto, onClick: () => void uploadAvatar(pendingPhoto), children: uploadingPhoto ? 'Saving...' : 'Save photo' })] })), _jsx("small", { children: "JPG, PNG, or WEBP. Maximum 5 MB. Your photo appears in the top bar." })] }), _jsxs("article", { className: "dashboard-card profile-card", children: [_jsxs("div", { className: "profile-card-heading", children: [_jsxs("div", { children: [_jsx("h2", { children: "Account Information" }), _jsx("p", { children: "Keep your personal details accurate." })] }), _jsx("button", { type: "button", className: "profile-edit-button", onClick: () => editing ? void saveAccount() : setEditing(true), disabled: savingAccount, children: savingAccount ? 'Saving...' : editing ? 'Save changes' : 'Edit information' })] }), _jsx("div", { className: "account-form", children: info.map(([label, value]) => (_jsxs("label", { children: [_jsx("span", { children: label }), label === 'Office' ? (_jsxs("select", { value: value, disabled: !editing || savingAccount, onChange: event => setAccount(current => ({ ...current, department: event.target.value })), children: [!offices.includes(value) && value && _jsx("option", { value: value, children: value }), offices.map(office => _jsx("option", { value: office, children: office }, office))] })) : (_jsx("input", { value: value, disabled: !editing || savingAccount || label === 'Employee ID' || label === 'Role', onChange: event => {
                                                                const newValue = event.target.value;
                                                                setAccount(current => ({
                                                                    ...current,
                                                                    ...(label === 'Full name'
                                                                        ? { name: newValue }
                                                                        : label === 'Email address'
                                                                            ? { email: newValue }
                                                                            : {}),
                                                                }));
                                                            } }))] }, label))) })] })] })) : (_jsxs("section", { className: "settings-layout", children: [_jsxs("article", { className: "dashboard-card settings-card", children: [_jsxs("div", { children: [_jsx("h2", { children: "Appearance" }), _jsx("p", { children: "Choose the display theme you prefer." })] }), _jsxs("div", { className: "theme-options", children: [_jsxs("button", { type: "button", className: theme === 'light'
                                                            ? 'selected'
                                                            : '', onClick: () => setTheme('light'), children: ["\u2600", _jsx("span", { children: "Light mode" })] }), _jsxs("button", { type: "button", className: theme === 'dark'
                                                            ? 'selected'
                                                            : '', onClick: () => setTheme('dark'), children: ["\u263E", _jsx("span", { children: "Dark mode" })] })] })] }), _jsxs("article", { className: "dashboard-card settings-card", id: "security", children: [_jsxs("div", { children: [_jsx("h2", { children: "Security" }), _jsx("p", { children: "Protect your account and sign-in details." })] }), _jsxs("div", { className: "password-form", children: [_jsx("h3", { children: "Change password" }), _jsxs("label", { children: ["Current password", _jsxs("span", { className: "password-input-wrap", children: [_jsx("input", { type: showPasswords.current ? 'text' : 'password', value: password.current, onChange: event => setPassword(current => ({ ...current, current: event.target.value })), placeholder: "Enter current password", autoComplete: "current-password" }), _jsx(PasswordVisibilityButton, { visible: showPasswords.current, onClick: () => setShowPasswords(current => ({ ...current, current: !current.current })) })] })] }), _jsxs("label", { children: ["New password", _jsxs("span", { className: "password-input-wrap", children: [_jsx("input", { type: showPasswords.next ? 'text' : 'password', value: password.next, onChange: event => setPassword(current => ({
                                                                            ...current,
                                                                            next: event.target
                                                                                .value,
                                                                        })), placeholder: "At least 8 characters", autoComplete: "new-password" }), _jsx(PasswordVisibilityButton, { visible: showPasswords.next, onClick: () => setShowPasswords(current => ({ ...current, next: !current.next })) })] })] }), _jsxs("label", { children: ["Confirm new password", _jsxs("span", { className: "password-input-wrap", children: [_jsx("input", { type: showPasswords.confirm ? 'text' : 'password', value: password.confirm, onChange: event => setPassword(current => ({
                                                                            ...current,
                                                                            confirm: event.target
                                                                                .value,
                                                                        })), placeholder: "Re-enter password", autoComplete: "new-password" }), _jsx(PasswordVisibilityButton, { visible: showPasswords.confirm, onClick: () => setShowPasswords(current => ({ ...current, confirm: !current.confirm })) })] })] }), _jsx("button", { type: "button", className: "incident-new", onClick: updatePassword, disabled: updatingPassword, children: updatingPassword
                                                            ? 'Updating...'
                                                            : 'Update password' })] })] })] }))] })] })] }));
}
export default Profile;
