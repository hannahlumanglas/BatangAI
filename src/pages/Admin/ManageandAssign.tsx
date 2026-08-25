import { useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './ManageandAssign.css'

type IconName = 'dashboard' | 'incidents' | 'devices' | 'users' | 'reports' | 'profile' | 'logout' | 'menu' | 'bell' | 'search' | 'eye' | 'assign' | 'close' | 'phone' | 'mail' | 'sparkle'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    incidents: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" /></>,
    devices: <><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" /></>,
    reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    bell: <><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    assign: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" /><path d="M18 8v6M15 11h6" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    phone: <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 6 8 7 8-7" /></>,
    sparkle: <><path d="M12 3.5c.5 2.6 1.3 4.4 2.5 5.6 1.2 1.2 3 2 5.6 2.5-2.6.5-4.4 1.3-5.6 2.5-1.2 1.2-2 3-2.5 5.6-.5-2.6-1.3-4.4-2.5-5.6-1.2-1.2-3-2-5.6-2.5 2.6-.5 4.4-1.3 5.6-2.5 1.2-1.2 2-3 2.5-5.6Z" /></>,
  }
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

const navigation: { label: string; icon: IconName; path: string }[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { label: 'All Incidents', icon: 'incidents', path: '/admin/incidents' },
  { label: 'Manage & Assign', icon: 'assign', path: '/admin/manage-assign' },
  { label: 'Device Monitoring', icon: 'devices', path: '/admin/device-monitoring' },
  { label: 'User Management', icon: 'users', path: '/admin/user-management' },
  { label: 'Generate Reports', icon: 'reports', path: '/admin/generate-reports' },
  { label: 'Profile', icon: 'profile', path: '/admin/profile' },
]

type Severity = 'High' | 'Medium' | 'Low'
type Status = 'Pending' | 'In Progress' | 'Resolved'

type Channel = 'Phone Call' | 'Walk-in' | 'Web Form' | 'Email'

type Incident = {
  id: string
  reporter: string
  department: string
  severity: Severity
  status: Status
  assignedTo: string | null
  date: string
  time: string
  employeeId: string
  location: string
  deviceType: string
  connection: string
  channel: Channel
  encodedBy: string
  description: string
  aiClassification: string
  aiDuration: string
  aiSummary: string
  aiSteps: string[]
}

const initialIncidents: Incident[] = [
  {
    id: 'INC-2025-001', reporter: 'Juan Dela Cruz', department: 'Engineering Office', severity: 'High', status: 'Resolved',
    assignedTo: 'Mark Villanueva - IT Support', date: 'Jul 14, 2025', time: '10:15 AM',
    employeeId: 'EMP-014', location: 'Drafting Room - 2nd Floor', deviceType: 'Laptop', connection: 'WiFi',
    channel: 'Walk-in', encodedBy: 'Kristine Bautista',
    description: "Laptop repeatedly disconnects from the office WiFi network, especially during file transfers to the shared drive.",
    aiClassification: 'Network Connectivity Issue', aiDuration: '~15-30 minutes',
    aiSummary: 'Intermittent WiFi drops are commonly caused by signal interference, outdated drivers, or router configuration issues.',
    aiSteps: [
      'Check the WiFi signal strength near the affected device.',
      "Restart the laptop's wireless adapter.",
      'Update the WiFi driver to the latest version.',
      'Move closer to the access point and retest.',
      'Check the router logs for repeated disconnect events.',
    ],
  },
  {
    id: 'INC-2025-002', reporter: 'Ana Reyes', department: "City Treasurer's Office", severity: 'Medium', status: 'In Progress',
    assignedTo: 'Kristine Bautista - IT Support', date: 'Jul 15, 2025', time: '01:30 PM',
    employeeId: 'EMP-027', location: 'Cashiering Section - Ground Floor', deviceType: 'Desktop', connection: 'LAN',
    channel: 'Web Form', encodedBy: 'Ana Reyes',
    description: 'The payroll system times out whenever generating the monthly disbursement report.',
    aiClassification: 'Software Performance Issue', aiDuration: '~30-45 minutes',
    aiSummary: 'Timeouts during report generation typically point to database load, insufficient memory, or an outdated application build.',
    aiSteps: [
      'Confirm how long the report takes before timing out.',
      'Check available system memory during report generation.',
      'Clear the application cache and temporary files.',
      'Verify the payroll system is on the latest patched version.',
      'Escalate to the software vendor if the timeout persists.',
    ],
  },
  {
    id: 'INC-2025-003', reporter: 'Maria Santos', department: 'Health Office', severity: 'Low', status: 'Pending',
    assignedTo: null, date: 'Jul 16, 2025', time: '07:45 AM',
    employeeId: 'EMP-001', location: 'Nurse Station - Ground Floor', deviceType: 'Desktop', connection: 'LAN',
    channel: 'Phone Call', encodedBy: 'Liza Bautista',
    description: 'The LAN port on the desktop computer at the nurse station is not working. The indicator light does not turn on when cable is plugged in.',
    aiClassification: 'Hardware Malfunction', aiDuration: '~30-60 minutes',
    aiSummary: 'A hardware-level issue has been identified. This could involve a failed network interface card, damaged port, or faulty peripheral device.',
    aiSteps: [
      'Visually inspect the device and cable for physical damage.',
      'Try a different network cable or port on the switch.',
      'Check Device Manager for any driver errors or device flags.',
      'Update or reinstall network adapter drivers.',
      'Test the device on a different network to confirm if it is hardware-related.',
      'Document the hardware serial number and model for replacement request.',
    ],
  },
]

const itPersonnel = ['Mark Villanueva - IT Support', 'Kristine Bautista - IT Support', 'Paolo Fernandez - IT Support']

const statusTagClass: Record<Status, string> = { Pending: 'pending-tag', 'In Progress': 'progress-tag', Resolved: 'resolved-tag' }
const severityTagClass: Record<Severity, string> = { High: 'high-tag', Medium: 'medium-tag', Low: 'low-tag' }

/* ---------- Theme (light/dark) ---------- */

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = 'batangai-theme'

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme(current => (current === 'dark' ? 'light' : 'dark'))
  return { theme, toggleTheme }
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle-button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
        </svg>
      )}
    </button>
  )
}

function ProfileMenu({ name, role, avatarInitial: _avatarInitial, onLogout, profilePath = '/admin/profile' }: { name: string; role: string; avatarInitial: string; onLogout: () => void; profilePath?: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const goToProfile = () => { setOpen(false); navigate(profilePath) }

  return (
    <div className="profile-menu-root" ref={rootRef}>
      <button type="button" className="topbar-user profile-menu-trigger" onClick={() => setOpen(current => !current)} aria-haspopup="menu" aria-expanded={open}>
        <div className="topbar-avatar">{name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
        <div><strong>{name}</strong><span>{role}</span></div>
        <span className={`profile-menu-chevron${open ? ' open' : ''}`}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>

      {open && (
        <div className="profile-menu-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={goToProfile}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" /></svg>
            My Profile
          </button>
          <button type="button" role="menuitem" onClick={goToProfile}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" /></svg>
            Settings
          </button>
          <button type="button" role="menuitem" onClick={goToProfile}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            Change Password
          </button>
          <span className="profile-menu-divider" />
          <button type="button" role="menuitem" className="danger" onClick={() => { setOpen(false); onLogout() }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

function ManageAndAssign({ audience = 'administrator' }: { audience?: 'administrator' | 'secretary' | 'it' }) {
  const navigate = useNavigate()
  const isSecretary = audience === 'secretary'
  const isIT = audience === 'it'
  const roleNavigation = isSecretary
    ? navigation.filter(item => ['All Incidents', 'Manage & Assign', 'Profile'].includes(item.label)).map(item => ({ ...item, path: item.path.replace('/admin', '/secretary') }))
    : isIT
      ? navigation.filter(item => ['All Incidents', 'Manage & Assign', 'Device Monitoring', 'Profile'].includes(item.label)).map(item => ({ ...item, label: item.label === 'Manage & Assign' ? 'My Assignments' : item.label, path: item.label === 'Manage & Assign' ? '/it/my-assignments' : item.path.replace('/admin', '/it') }))
      : navigation
  const user = isSecretary ? { name: 'Teresa Lopez', role: 'Secretary', initial: 'T', profilePath: '/secretary/profile' } : isIT ? { name: 'Juan dela Cruz', role: 'IT Personnel', initial: 'J', profilePath: '/it/profile' } : { name: 'Ricardo Mendoza', role: 'Administrator', initial: 'R', profilePath: '/admin/profile' }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const { theme, toggleTheme } = useTheme()
  const handleLogout = () => { localStorage.removeItem('batangai-admin-auth'); navigate('/') }

  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All Statuses' | Status>('All Statuses')
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedPersonnel, setSelectedPersonnel] = useState(itPersonnel[0])
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | ''>('')

  const pendingCount = incidents.filter(i => i.status === 'Pending').length
  const inProgressCount = incidents.filter(i => i.status === 'In Progress').length
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length

  const filtered = incidents.filter(i => {
    const matchesStatus = statusFilter === 'All Statuses' || i.status === statusFilter
    const q = search.trim().toLowerCase()
    const matchesSearch = q === '' || i.id.toLowerCase().includes(q) || i.reporter.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const openAssign = (id: string) => { setViewingId(null); setAssigningId(id); setSelectedPersonnel(itPersonnel[0]) }
  const closeAssign = () => setAssigningId(null)
  const confirmAssign = () => {
    if (!assigningId) return
    setIncidents(current => current.map(i => i.id === assigningId ? { ...i, assignedTo: selectedPersonnel, status: i.status === 'Pending' ? 'In Progress' : i.status } : i))
    setAssigningId(null)
  }

  const openView = (id: string) => { setSelectedSeverity(''); setViewingId(id) }
  const closeView = () => setViewingId(null)
  const viewingIncident = incidents.find(i => i.id === viewingId) ?? null
  const updateSeverity = (id: string, severity: Severity) => {
    setIncidents(current => current.map(i => (i.id === id ? { ...i, severity } : i)))
  }

  return <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div>
      <nav className="sidebar-nav" aria-label={`${user.role} navigation`}>
        {roleNavigation.map(item => <button className={item.label === 'Manage & Assign' ? 'is-active' : ''} key={item.label} type="button" onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
      </nav>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="menu-button" type="button" aria-label="Toggle menu" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed(c => !c)}><Icon name="menu" /></button>
        <div className="topbar-title"><h1>{isIT ? 'My Assignments' : 'Manage & Assign Incidents'}</h1><p>{isIT ? 'View and manage the incident reports assigned to you.' : 'View all encoded incidents and assign IT personnel to unresolved reports.'}</p></div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <AdminNotifications />
        <ProfileMenu name={user.name} role={user.role} avatarInitial={user.initial} profilePath={user.profilePath} onLogout={handleLogout} />
      </header>

      <div className="dashboard-content">
        <section className="maa-stats">
          <article className="maa-stat maa-stat--pending"><i>◷</i><div><span>Pending</span><strong>{pendingCount}</strong></div></article>
          <article className="maa-stat maa-stat--progress"><i>⟳</i><div><span>In Progress</span><strong>{inProgressCount}</strong></div></article>
          <article className="maa-stat maa-stat--resolved"><i>✓</i><div><span>Resolved</span><strong>{resolvedCount}</strong></div></article>
        </section>

        <div className="maa-toolbar-card">
          <label className="maa-search">
            <Icon name="search" />
            <input type="text" placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <label className="maa-status-filter">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option>All Statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </label>
        </div>

        <article className="dashboard-card maa-table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Reporter</th><th>Severity</th><th>Status</th><th>Assigned To</th><th>Date</th><th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td><strong>{i.reporter}</strong><small>{i.department}</small></td>
                  <td><span className={`tag ${severityTagClass[i.severity]}`}>{i.severity}</span></td>
                  <td><span className={`tag ${statusTagClass[i.status]}`}>{i.status}</span></td>
                  <td><span className={i.assignedTo ? 'maa-assigned' : 'maa-unassigned'}>{i.assignedTo ?? 'Unassigned'}</span></td>
                  <td>{i.date}<br /><small>{i.time}</small></td>
                  <td>
                    <div className="maa-actions">
                      <button type="button" className="maa-view-btn" aria-label={`View ${i.id}`} onClick={() => openView(i.id)}><Icon name="eye" /></button>
                      <button type="button" className="maa-assign-btn" onClick={() => openAssign(i.id)}><Icon name="assign" /> {i.assignedTo ? 'Reassign' : 'Assign'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="maa-empty">No incidents match your search or filter.</td></tr>
              )}
            </tbody>
          </table>
          <p className="maa-showing">Showing {filtered.length} of {incidents.length} incidents</p>
        </article>
      </div>
    </main>

    {assigningId && (
      <div className="maa-modal-overlay" role="dialog" aria-modal="true" onClick={closeAssign}>
        <div className="maa-modal" onClick={e => e.stopPropagation()}>
          <div className="maa-modal-header">
            <h2>Assign IT Personnel</h2>
            <button type="button" className="maa-modal-close" aria-label="Close" onClick={closeAssign}><Icon name="close" /></button>
          </div>
          <p className="maa-modal-sub">Assigning incident <strong>{assigningId}</strong></p>
          <label className="maa-modal-field">
            Personnel
            <select value={selectedPersonnel} onChange={e => setSelectedPersonnel(e.target.value)}>
              {itPersonnel.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>
          <div className="maa-modal-footer">
            <button type="button" className="maa-btn-secondary" onClick={closeAssign}>Cancel</button>
            <button type="button" className="maa-btn-primary" onClick={confirmAssign}><Icon name="assign" /> Confirm Assignment</button>
          </div>
        </div>
      </div>
    )}

    {viewingIncident && (
      <div className="maa-modal-overlay" role="dialog" aria-modal="true" onClick={closeView}>
        <div className="maa-modal maa-modal--view" onClick={e => e.stopPropagation()}>
          <div className="maa-modal-header">
            <div>
              <h2>{viewingIncident.id}</h2>
              <div className="maa-view-header-meta">
                <span className={`tag ${severityTagClass[viewingIncident.severity]}`}>{viewingIncident.severity}</span>
                <span className="maa-encoded-by">Encoded by {viewingIncident.encodedBy}</span>
              </div>
            </div>
            <button type="button" className="maa-modal-close" aria-label="Close" onClick={closeView}><Icon name="close" /></button>
          </div>

          <div className="maa-view-divider" />

          <div className={`maa-severity-control${selectedSeverity ? '' : ' is-required'}`}>
            <div>
              <span className="maa-severity-control-label">Select Severity Level <em>*</em></span>
              {!selectedSeverity && <span id="severity-required-help" className="maa-severity-required">Required — choose a severity level.</span>}
            </div>
            <div className="maa-severity-group" role="radiogroup" aria-label="Severity level" aria-describedby={!selectedSeverity ? 'severity-required-help' : undefined} aria-required="true">
              {(['Low', 'Medium', 'High'] as Severity[]).map(level => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={selectedSeverity === level}
                  aria-invalid={!selectedSeverity}
                  className={`maa-severity-btn maa-severity-btn--${level.toLowerCase()}${selectedSeverity === level ? ' is-active' : ''}`}
                  onClick={() => { setSelectedSeverity(level); updateSeverity(viewingIncident.id, level) }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="maa-info-grid">
            <div className="maa-info-item"><span>Reporter</span><strong>{viewingIncident.reporter}</strong></div>
            <div className="maa-info-item"><span>Employee ID</span><strong>{viewingIncident.employeeId}</strong></div>
            <div className="maa-info-item"><span>Department</span><strong>{viewingIncident.department}</strong></div>
            <div className="maa-info-item"><span>Location</span><strong>{viewingIncident.location}</strong></div>
            <div className="maa-info-item"><span>Device Type</span><strong>{viewingIncident.deviceType}</strong></div>
            <div className="maa-info-item"><span>Connection</span><strong>{viewingIncident.connection}</strong></div>
          </div>

          <div>
            <p className="maa-problem-label">Problem Description</p>
            <p className="maa-problem-text">{viewingIncident.description}</p>
          </div>

          <div className="maa-ai-panel">
            <div className="maa-ai-panel-head">
              <span className="maa-ai-panel-title"><Icon name="sparkle" /> BatangAI Analysis</span>
              <span className="maa-ai-duration">{viewingIncident.aiDuration}</span>
            </div>
            <p className="maa-ai-headline">{viewingIncident.aiClassification}</p>
            <p className="maa-ai-summary">{viewingIncident.aiSummary}</p>
            <ol className="maa-ai-steps">
              {viewingIncident.aiSteps.map((step, index) => (
                <li key={step}><span className="maa-ai-step-num">{index + 1}</span>{step}</li>
              ))}
            </ol>
          </div>

          <button type="button" className="maa-assign-full" onClick={() => openAssign(viewingIncident.id)}>
            <Icon name="assign" /> {viewingIncident.assignedTo ? 'Reassign IT Personnel' : 'Assign IT Personnel'}
          </button>
        </div>
      </div>
    )}
  </div>
}

export default ManageAndAssign