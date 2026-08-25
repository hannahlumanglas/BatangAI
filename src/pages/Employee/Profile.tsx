import AdminProfile from '../Admin/Profile'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Profile() {
  return <AdminProfile audience="employee" />
}

export function ProfileMenu({ name, role, avatarInitial: _avatarInitial, onLogout }: { name: string; role: string; avatarInitial: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return <div className="profile-menu-root">
    <button type="button" className="topbar-user profile-menu-trigger" onClick={() => setOpen(value => !value)} aria-haspopup="menu" aria-expanded={open} aria-label="Open account menu"><div className="topbar-avatar">{name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div><div><strong>{name}</strong><span>{role}</span></div><span className="profile-menu-chevron">⌄</span></button>
    {open && <div className="profile-menu-dropdown" role="menu"><button type="button" role="menuitem" onClick={() => navigate('/employee/profile')}>My Profile</button><button type="button" role="menuitem" onClick={() => navigate('/employee/settings')}>Settings</button><button type="button" role="menuitem" onClick={() => navigate('/employee/settings#security')}>Change Password</button><span className="profile-menu-divider" /><button type="button" role="menuitem" className="danger" onClick={onLogout}>Logout</button></div>}
  </div>
}

export default Profile
