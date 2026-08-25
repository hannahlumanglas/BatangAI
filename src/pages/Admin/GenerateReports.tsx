import { useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './GenerateReports.css'

type IconName = 'dashboard' | 'incidents' | 'devices' | 'users' | 'reports' | 'profile' | 'logout' | 'menu' | 'bell' | 'download' | 'check' | 'alert' | 'assign'

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
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>,
    assign: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" /><path d="M18 8v6M15 11h6" /></>,
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

const reportTypes = ['All Incidents Report', 'Resolved Incidents Report', 'Pending Incidents Report', 'Device Status Report', 'User Activity Report']
const months = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const years = ['2025', '2024', '2023']

/* ---------- Mock data (frontend-only) ---------- */

type MockIncident = { id: string; title: string; department: string; severity: string; status: string; date: string }
type MockDevice = { name: string; type: string; status: string; location: string }
type MockUserActivity = { name: string; role: string; action: string; timestamp: string }

const mockIncidents: MockIncident[] = [
  { id: 'INC-2025-001', title: 'Cannot connect to office WiFi', department: 'Health Office', severity: 'High', status: 'Resolved', date: '2025-05-22' },
  { id: 'INC-2025-002', title: 'Slow internet connection', department: 'Engineering Office', severity: 'Medium', status: 'In Progress', date: '2025-05-21' },
  { id: 'INC-2025-003', title: 'Router not responding', department: "Mayor's Office", severity: 'Low', status: 'Pending', date: '2025-05-20' },
  { id: 'INC-2025-004', title: 'Email server unreachable', department: "Treasurer's Office", severity: 'Medium', status: 'In Progress', date: '2025-04-19' },
  { id: 'INC-2025-005', title: 'File sharing not working', department: 'IT Department', severity: 'Low', status: 'Resolved', date: '2025-04-18' },
  { id: 'INC-2025-006', title: 'Printer not responding', department: "Treasurer's Office", severity: 'Medium', status: 'Resolved', date: '2025-03-16' },
  { id: 'INC-2025-007', title: 'CAD software uploads very slow', department: 'Engineering Office', severity: 'Medium', status: 'Pending', date: '2025-03-15' },
  { id: 'INC-2025-008', title: 'Cannot access patient records', department: 'Health Office', severity: 'High', status: 'Resolved', date: '2025-02-10' },
  { id: 'INC-2024-041', title: 'VPN drops intermittently', department: 'IT Department', severity: 'High', status: 'Resolved', date: '2024-11-08' },
  { id: 'INC-2024-032', title: 'Payroll system timeout', department: "Treasurer's Office", severity: 'Medium', status: 'Resolved', date: '2024-08-02' },
]

const mockDevices: MockDevice[] = [
  { name: 'RTR-MAIN-01', type: 'Router', status: 'Online', location: 'Server Room A' },
  { name: 'SWT-MAIN-01', type: 'Switch', status: 'Online', location: 'Server Room A' },
  { name: 'RTR-HLT-02', type: 'Router', status: 'Online', location: 'City Health Office' },
  { name: 'SWT-ENG-03', type: 'Switch', status: 'Warning', location: 'City Engineering Office' },
  { name: 'RTR-TRS-04', type: 'Router', status: 'Warning', location: "City Treasurer's Office" },
  { name: 'RTR-MYR-07', type: 'Router', status: 'Offline', location: "City Mayor's Office" },
]

const mockUserActivity: MockUserActivity[] = [
  { name: 'Maria Santos', role: 'Employee', action: 'Submitted incident report', timestamp: '2025-05-22 08:30 AM' },
  { name: 'Juan dela Cruz', role: 'IT Personnel', action: 'Resolved incident INC-2025-001', timestamp: '2025-05-22 11:10 AM' },
  { name: 'Ricardo Mendoza', role: 'Administrator', action: 'Approved new user account', timestamp: '2025-05-21 09:05 AM' },
  { name: 'Ana Dela Cruz', role: 'IT Personnel', action: 'Escalated incident INC-2025-003', timestamp: '2025-05-20 02:45 PM' },
  { name: 'Jose Reyes', role: 'Employee', action: 'Logged in', timestamp: '2025-05-19 07:58 AM' },
]

const MONTH_TO_INDEX = new Map(months.slice(1).map((m, i) => [m, i + 1]))

function escapeCSVCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCSV(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCSVCell).join(',')).join('\n')
}

function matchesPeriod(dateStr: string, month: string, year: string): boolean {
  const [rowYear, rowMonth] = dateStr.split('-').map(Number)
  if (String(rowYear) !== year) return false
  if (month === 'All Months') return true
  return rowMonth === MONTH_TO_INDEX.get(month)
}

interface BuiltReport {
  headers: string[]
  rows: (string | number)[][]
  filename: string
}

function buildReport(reportType: string, month: string, year: string): BuiltReport {
  const periodLabel = (month === 'All Months' ? year : `${month}-${year}`).replace(/\s+/g, '-')
  const slug = reportType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  if (reportType === 'Device Status Report') {
    return {
      headers: ['Device Name', 'Type', 'Status', 'Location'],
      rows: mockDevices.map((d) => [d.name, d.type, d.status, d.location]),
      filename: `${slug}-${periodLabel}.csv`,
    }
  }

  if (reportType === 'User Activity Report') {
    return {
      headers: ['Name', 'Role', 'Action', 'Timestamp'],
      rows: mockUserActivity.map((u) => [u.name, u.role, u.action, u.timestamp]),
      filename: `${slug}-${periodLabel}.csv`,
    }
  }

  const statusFilter = reportType === 'Resolved Incidents Report' ? 'Resolved'
    : reportType === 'Pending Incidents Report' ? 'Pending'
    : null

  const rows = mockIncidents
    .filter((incident) => matchesPeriod(incident.date, month, year))
    .filter((incident) => !statusFilter || incident.status === statusFilter)
    .map((incident) => [incident.id, incident.title, incident.department, incident.severity, incident.status, incident.date])

  return {
    headers: ['ID', 'Title', 'Department', 'Severity', 'Status', 'Date'],
    rows,
    filename: `${slug}-${periodLabel}.csv`,
  }
}

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

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

function ProfileMenu({ name, role, avatarInitial: _avatarInitial, onLogout }: { name: string; role: string; avatarInitial: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleEscape = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const goToProfile = () => { setOpen(false); navigate('/admin/profile') }

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
          <button type="button" role="menuitem" onClick={() => navigate('/admin/settings')}>
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

function GenerateReports() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [reportType, setReportType] = useState(reportTypes[0])
  const [month, setMonth] = useState(months[0])
  const [year, setYear] = useState(years[0])
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')
  const handleLogout = () => { localStorage.removeItem('batangai-admin-auth'); navigate('/') }

  const handleGenerate = () => {
    const { headers, rows, filename } = buildReport(reportType, month, year)

    if (rows.length === 0) {
      setMessageTone('error')
      setMessage(`No records found for ${reportType.toLowerCase()}${month === 'All Months' ? '' : ` in ${month}`} ${year}.`)
      return
    }

    downloadCSV(filename, toCSV(headers, rows))
    setMessageTone('success')
    setMessage(`${filename} downloaded — ${rows.length} record${rows.length === 1 ? '' : 's'}.`)
  }

  return <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div>
      <nav className="sidebar-nav" aria-label="Administrator navigation">
        {navigation.map(item => <button className={item.label === 'Generate Reports' ? 'is-active' : ''} key={item.label} type="button" onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
      </nav>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="menu-button" type="button" aria-label="Toggle menu" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed(c => !c)}><Icon name="menu" /></button>
        <div className="topbar-title"><h1>Generate Reports</h1><p>Generate and print incident reports by type and period.</p></div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <AdminNotifications />
        <ProfileMenu name="Ricardo Mendoza" role="Administrator" avatarInitial="R" onLogout={handleLogout} />
      </header>

      <div className="dashboard-content">
        <article className="dashboard-card gr-card">
          <h2><Icon name="reports" /> Report Configuration</h2>
          <div className="gr-grid">
            <label>Report Type
              <select value={reportType} onChange={e => setReportType(e.target.value)}>{reportTypes.map(t => <option key={t}>{t}</option>)}</select>
            </label>
            <label>Month (optional)
              <select value={month} onChange={e => setMonth(e.target.value)}>{months.map(m => <option key={m}>{m}</option>)}</select>
            </label>
            <label>Year
              <select value={year} onChange={e => setYear(e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select>
            </label>
          </div>
          <button className="incident-new gr-generate" type="button" onClick={handleGenerate}>
            <Icon name="download" /> Generate Report
          </button>
          {message && (
            <p className={`gr-message${messageTone === 'error' ? ' gr-message--error' : ''}`}>
              <Icon name={messageTone === 'error' ? 'alert' : 'check'} /> {message}
            </p>
          )}
        </article>
      </div>
    </main>
  </div>
}

export default GenerateReports
