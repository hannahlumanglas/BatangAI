import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AdminProfile from '../Admin/Profile';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession, getRoleDisplayName, getProfilePhotoUrl, } from '../../auth';
import './Profile.css';
function Profile() {
    return _jsx(AdminProfile, { audience: "employee" });
}
export function ProfileMenu({ name, role, avatar, avatarInitial, onLogout, }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const session = getAuthSession();
    const currentUser = session?.user;
    const profileAvatar = getProfilePhotoUrl(currentUser?.profilePhoto, currentUser?.fullName, currentUser?.role);
    const initials = name
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    return (_jsxs("div", { className: "profile-menu-root", children: [_jsxs("button", { type: "button", className: "topbar-user profile-menu-trigger", onClick: () => setOpen(value => !value), "aria-haspopup": "menu", "aria-expanded": open, "aria-label": "Open account menu", children: [_jsx("div", { className: "topbar-avatar", children: avatar || profileAvatar ? (_jsx("img", { src: avatar || profileAvatar, alt: "" })) : (avatarInitial || initials) }), _jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("span", { children: getRoleDisplayName(role) })] }), _jsx("span", { className: "profile-menu-chevron", children: "\u2304" })] }), open && (_jsxs("div", { className: "profile-menu-dropdown", role: "menu", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate('/employee/profile');
                        }, children: "My Profile" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate('/employee/settings');
                        }, children: "Settings" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            navigate('/employee/settings#security');
                        }, children: "Change Password" }), _jsx("span", { className: "profile-menu-divider" }), _jsx("button", { type: "button", role: "menuitem", className: "danger", onClick: onLogout, children: "Logout" })] }))] }));
}
export default Profile;
