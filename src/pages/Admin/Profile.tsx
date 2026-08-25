import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthSession, getDefaultProfileAvatar, signOut } from '../../auth'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './Profile.css'

type Audience = 'administrator' | 'secretary' | 'it' | 'employee'
type View = 'profile' | 'settings'
type Account = { name: string; email: string; id: string; department: string; role: string; initial: string; profilePath: string; settingsPath: string }

const accounts: Record<Audience, Account> = {
  administrator: { name: 'Ricardo Mendoza', email: 'ricardomendoza@batangascity.gov', id: 'ADM-001', department: 'City Information Technology Office', role: 'Administrator', initial: 'R', profilePath: '/admin/profile', settingsPath: '/admin/settings' },
  secretary: { name: 'Teresa Lopez', email: 'teresalopez@batangascity.gov', id: 'SEC-001', department: "Mayor's Office", role: 'Secretary', initial: 'T', profilePath: '/secretary/profile', settingsPath: '/secretary/settings' },
  it: { name: 'Juan dela Cruz', email: 'juandelacruz@batangascity.gov', id: 'IT-001', department: 'Information Technology Office', role: 'IT Personnel', initial: 'J', profilePath: '/it/profile', settingsPath: '/it/settings' },
  employee: { name: 'Juan Dela Cruz', email: 'juandelacruz@batangascity.gov', id: 'EMP-001', department: 'City Information Technology Office', role: 'Employee', initial: 'J', profilePath: '/employee/profile', settingsPath: '/employee/settings' },
}

function accountKey() { return `batangai-account-${getAuthSession()?.username ?? 'guest'}` }
function avatarKey() { return `batangai-avatar-${getAuthSession()?.username ?? 'guest'}` }

function ProfileMenu({ account, avatar, onLogout }: { account: Account; avatar: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (event: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return <div className="profile-menu-root" ref={rootRef}>
    <button type="button" className="topbar-user profile-menu-trigger" onClick={() => setOpen(value => !value)} aria-haspopup="menu" aria-expanded={open} aria-label="Open account menu">
      <div className="topbar-avatar">{avatar ? <img src={avatar} alt="" /> : account.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div><div><strong>{account.name}</strong><span>{account.role}</span></div><span className="profile-menu-chevron">⌄</span>
    </button>
    {open && <div className="profile-menu-dropdown" role="menu">
      <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate(account.profilePath) }}>My Profile</button>
      <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate(account.settingsPath) }}>Settings</button>
      <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate(`${account.settingsPath}#security`) }}>Change Password</button>
      <span className="profile-menu-divider" />
      <button type="button" role="menuitem" className="danger" onClick={onLogout}>Logout</button>
    </div>}
  </div>
}

function Profile({ audience = 'administrator', view = 'profile' }: { audience?: Audience; view?: View }) {
  const navigate = useNavigate()
  const defaultAccount = accounts[audience]
  const [account, setAccount] = useState<Account>(() => ({ ...defaultAccount, ...JSON.parse(localStorage.getItem(accountKey()) || '{}') }))
  const [avatar, setAvatar] = useState(() => localStorage.getItem(avatarKey()) || getDefaultProfileAvatar())
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('batangai-theme') === 'dark' ? 'dark' : 'light')
  const [twoFactor, setTwoFactor] = useState(() => localStorage.getItem('batangai-two-factor') === 'true')
  const [password, setPassword] = useState({ next: '', confirm: '' })
  const fileRef = useRef<HTMLInputElement>(null)
  const info = useMemo(() => [['Full name', account.name], ['Email address', account.email], ['Employee ID', account.id], ['Department', account.department], ['Role', account.role]], [account])
  const navigation = audience === 'administrator'
    ? [['Dashboard', '/admin'], ['All Incidents', '/admin/incidents'], ['Manage & Assign', '/admin/manage-assign'], ['Device Monitoring', '/admin/device-monitoring'], ['User Management', '/admin/user-management'], ['Generate Reports', '/admin/generate-reports']]
    : audience === 'secretary'
      ? [['All Incidents', '/secretary/incidents'], ['Manage & Assign', '/secretary/manage-assign']]
      : audience === 'it'
        ? [['All Incidents', '/it/incidents'], ['My Assignments', '/it/my-assignments'], ['Device Monitoring', '/it/device-monitoring']]
        : [['Report Incident', '/employee/report-incident'], ['All Incidents', '/employee/incidents']]

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('batangai-theme', theme) }, [theme])
  const saveAccount = () => { localStorage.setItem(accountKey(), JSON.stringify(account)); setEditing(false); setNotice('Your account information has been updated.') }
  const uploadAvatar = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) { setNotice('Please choose an image file.'); return }
    const reader = new FileReader()
    reader.onload = () => { const image = String(reader.result); localStorage.setItem(avatarKey(), image); document.documentElement.style.setProperty('--saved-profile-avatar', `url("${image}")`); document.documentElement.classList.add('has-profile-avatar'); setAvatar(image); setNotice('Profile photo updated.') }
    reader.readAsDataURL(file)
  }
  const updatePassword = () => {
    if (password.next.length < 8) return setNotice('Password must contain at least 8 characters.')
    if (password.next !== password.confirm) return setNotice('Passwords do not match.')
    setPassword({ next: '', confirm: '' }); setNotice('Password updated successfully.')
  }
  const toggle2FA = () => { const next = !twoFactor; setTwoFactor(next); localStorage.setItem('batangai-two-factor', String(next)); setNotice(next ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.') }
  const handleLogout = () => { signOut(); navigate('/') }

  return <div className="admin-shell profile-shell"><aside className="admin-sidebar"><div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div><nav className="sidebar-nav" aria-label={`${account.role} navigation`}>{navigation.map(([label, path]) => <button key={path} type="button" onClick={() => navigate(path)}><span aria-hidden="true">•</span><span>{label}</span></button>)}<button type="button" className={view === 'profile' ? 'is-active' : ''} onClick={() => navigate(account.profilePath)}><span aria-hidden="true">•</span><span>Profile</span></button><button type="button" className={view === 'settings' ? 'is-active' : ''} onClick={() => navigate(account.settingsPath)}><span aria-hidden="true">•</span><span>Settings</span></button></nav></aside>
    <main className="admin-main"><header className="admin-topbar"><div className="topbar-title"><h1>{view === 'profile' ? 'My Profile' : 'Settings'}</h1><p>{view === 'profile' ? 'Review and update your account information.' : 'Manage appearance and account security.'}</p></div><AdminNotifications /><ProfileMenu account={account} avatar={avatar} onLogout={handleLogout} /></header>
      <div className="dashboard-content profile-page-content">{notice && <div className="profile-toast" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        {view === 'profile' ? <section className="profile-layout"><article className="dashboard-card profile-identity-card"><div className="profile-photo">{avatar ? <img src={avatar} alt="Profile" /> : account.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div><input ref={fileRef} type="file" accept="image/*" hidden onChange={e => uploadAvatar(e.target.files?.[0])} /><button type="button" className="profile-photo-button" onClick={() => fileRef.current?.click()}>Change photo</button><small>JPG, PNG, or WEBP. Your photo appears in the top bar.</small></article>
          <article className="dashboard-card profile-card"><div className="profile-card-heading"><div><h2>Account Information</h2><p>Keep your personal details accurate.</p></div><button type="button" className="profile-edit-button" onClick={() => editing ? saveAccount() : setEditing(true)}>{editing ? 'Save changes' : 'Edit information'}</button></div><div className="account-form">{info.map(([label, value]) => <label key={label}><span>{label}</span><input value={value} disabled={!editing || label === 'Employee ID' || label === 'Role'} onChange={e => setAccount(current => ({ ...current, [label === 'Full name' ? 'name' : label === 'Email address' ? 'email' : 'department']: e.target.value }))} /></label>)}</div></article>
        </section> : <section className="settings-layout"><article className="dashboard-card settings-card"><div><h2>Appearance</h2><p>Choose the display theme you prefer.</p></div><div className="theme-options"><button type="button" className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}>☀ <span>Light mode</span></button><button type="button" className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}>☾ <span>Dark mode</span></button></div></article>
          <article className="dashboard-card settings-card" id="security"><div><h2>Security</h2><p>Protect your account and sign-in details.</p></div><div className="security-row"><div><strong>Two-factor authentication</strong><span>Add a verification step when signing in.</span></div><button type="button" className={`security-switch${twoFactor ? ' enabled' : ''}`} onClick={toggle2FA} aria-pressed={twoFactor}><i /></button></div><div className="password-form"><h3>Change password</h3><label>New password<input type="password" value={password.next} onChange={e => setPassword(current => ({ ...current, next: e.target.value }))} placeholder="At least 8 characters" /></label><label>Confirm new password<input type="password" value={password.confirm} onChange={e => setPassword(current => ({ ...current, confirm: e.target.value }))} placeholder="Re-enter password" /></label><button type="button" className="incident-new" onClick={updatePassword}>Update password</button></div></article></section>}
      </div></main></div>
}

export default Profile
