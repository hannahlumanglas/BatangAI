import { useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'

type IconName = 'dashboard' | 'incidents' | 'devices' | 'users' | 'reports' | 'profile' | 'logout' | 'menu' | 'document' | 'resolved' | 'progress' | 'pending' | 'monitor' | 'search' | 'bell' | 'chart' | 'pie' | 'online' | 'warning' | 'offline' | 'arrow' | 'wrench' | 'robot' | 'sparkle' | 'trending' | 'assign'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    incidents: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" /></>, devices: <><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></>, users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" /></>, reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>, profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" /></>, logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>, menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>, document: <><path d="M7 3h7l4 4v14H7zM14 3v5h5M10 12h5M10 16h5" /></>, resolved: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></>, progress: <><path d="M20 12a8 8 0 1 1-3-6.2" /><path d="M20 4v5h-5" /></>, pending: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, monitor: <><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></>, search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>, bell: <><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" /></>, chart: <><path d="M4 20V11M10 20V5M16 20v-8M22 20H2" /></>, pie: <><path d="M12 3v9h9A9 9 0 0 0 12 3Z" /><path d="M10 5.2a8 8 0 1 0 8.8 8.8H10Z" /></>, online: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></>, warning: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>, offline: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>, arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.4 3.4Z" />,
    robot: <><rect x="4" y="8" width="16" height="11" rx="2.5" /><path d="M12 8V4M9 4h6" /><circle cx="9" cy="13.5" r="1.3" /><circle cx="15" cy="13.5" r="1.3" /><path d="M8.5 17h7" /></>,
    sparkle: <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M6 6l2.2 2.2M15.8 15.8 18 18M18 6l-2.2 2.2M8.2 15.8 6 18" />,
    trending: <><path d="M3 17 9.5 10.5 13.5 14.5 21 7" /><path d="M15.5 7H21v5.5" /></>,
    assign: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" /><path d="M18 8v6M15 11h6" /></>,
  }
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function StatCard({ icon, number, title, tone }: { icon: IconName; number: string; title: string; tone: string }) {
  return <article className={`stat-card stat-card--${tone}`}><div className="stat-icon"><Icon name={icon} /></div><div><h3>{title}</h3><strong>{number}</strong></div></article>
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

const periodOptions = ['This Month', 'Last Month', 'This Quarter', 'This Year']

const departmentDataByPeriod: Record<string, { label: string; value: number }[]> = {
  'This Month': [
    { label: 'IT Department', value: 12 },
    { label: 'Engineering Office', value: 10 },
    { label: 'Health Office', value: 7 },
    { label: "City Mayor's Office", value: 5 },
    { label: "Treasurer's Office", value: 4 },
    { label: 'Others', value: 2 },
  ],
  'Last Month': [
    { label: 'IT Department', value: 9 },
    { label: 'Engineering Office', value: 13 },
    { label: 'Health Office', value: 6 },
    { label: "City Mayor's Office", value: 4 },
    { label: "Treasurer's Office", value: 3 },
    { label: 'Others', value: 3 },
  ],
  'This Quarter': [
    { label: 'IT Department', value: 15 },
    { label: 'Engineering Office', value: 14 },
    { label: 'Health Office', value: 9 },
    { label: "City Mayor's Office", value: 6 },
    { label: "Treasurer's Office", value: 5 },
    { label: 'Others', value: 3 },
  ],
  'This Year': [
    { label: 'IT Department', value: 15 },
    { label: 'Engineering Office', value: 15 },
    { label: 'Health Office', value: 12 },
    { label: "City Mayor's Office", value: 9 },
    { label: "Treasurer's Office", value: 7 },
    { label: 'Others', value: 5 },
  ],
}

const severityDataByPeriod: Record<string, { high: number; medium: number; low: number; highPct: number; medPct: number; lowPct: number }> = {
  'This Month': { high: 1, medium: 1, low: 1, highPct: 39, medPct: 35, lowPct: 26 },
  'Last Month': { high: 2, medium: 1, low: 1, highPct: 50, medPct: 25, lowPct: 25 },
  'This Quarter': { high: 3, medium: 4, low: 5, highPct: 25, medPct: 33, lowPct: 42 },
  'This Year': { high: 8, medium: 10, low: 14, highPct: 25, medPct: 31, lowPct: 44 },
}

const CHART_MAX = 15
const PLOT_HEIGHT = 140

/* ---------- Theme (light/dark) ---------- */

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = 'batangai-theme'

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
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

function PeriodFilter({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false)
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

  return (
    <div className="period-filter" ref={rootRef}>
      <button type="button" onClick={() => setOpen(current => !current)} aria-haspopup="menu" aria-expanded={open}>
        {value}<span className={`period-filter-chevron${open ? ' open' : ''}`}>⌄</span>
      </button>
      {open && (
        <div className="period-filter-dropdown" role="menu">
          {periodOptions.map(option => (
            <button
              key={option}
              type="button"
              role="menuitem"
              className={option === value ? 'is-selected' : ''}
              onClick={() => { onChange(option); setOpen(false) }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileMenu({ name, role, onLogout }: { name: string; role: string; avatarInitial: string; onLogout: () => void }) {
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

function Dashboard() {
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const [chartPeriod, setChartPeriod] = useState('This Month')
  const [severityPeriod, setSeverityPeriod] = useState('This Month')
  const handleLogout = () => { localStorage.removeItem('batangai-admin-auth'); navigate('/') }
  const departmentData = departmentDataByPeriod[chartPeriod]
  const severity = severityDataByPeriod[severityPeriod]

  return <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div>
      <nav className="sidebar-nav" aria-label="Administrator navigation">{navigation.map(item => <button className={item.label === 'Dashboard' ? 'is-active' : ''} key={item.label} type="button" onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><button className="menu-button" type="button" aria-label="Toggle menu" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}><Icon name="menu" /></button><div className="topbar-title"><h1>Admin Dashboard</h1><p>System-wide overview of incidents, devices, and users.</p></div><ThemeToggle theme={theme} onToggle={toggleTheme} /><AdminNotifications /><ProfileMenu name="Ricardo Mendoza" role="Administrator" avatarInitial="R" onLogout={handleLogout} /></header>
      <div className="dashboard-content">
        <section className="statistics-grid"><StatCard icon="document" number="23" title="Total Incidents" tone="blue" /><StatCard icon="resolved" number="15" title="Resolved" tone="green" /><StatCard icon="progress" number="5" title="In Progress" tone="purple" /><StatCard icon="pending" number="3" title="Pending" tone="orange" /></section>
        <section className="dashboard-grid charts-grid">
          <article className="dashboard-card chart-card">
            <header><h2><Icon name="chart" /> Incidents by Department</h2><PeriodFilter value={chartPeriod} onChange={setChartPeriod} /></header>
            <div className="bar-chart">
              <div className="y-axis"><b>15</b><b>10</b><b>5</b><b>0</b></div>
              <div className="chart-plot">
                <i /><i /><i />
                {departmentData.map(d => (
                  <div className="bar-item" key={d.label}>
                    <em style={{ bottom: `${Math.round((d.value / CHART_MAX) * PLOT_HEIGHT) + 9}px` }}>{d.value}</em>
                    <strong style={{ height: `${Math.round((d.value / CHART_MAX) * PLOT_HEIGHT)}px` }} />
                    <span>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
          <article className="dashboard-card severity-card">
            <header><h2><Icon name="pie" /> Severity Breakdown</h2><PeriodFilter value={severityPeriod} onChange={setSeverityPeriod} /></header>
            <div className="severity-content">
              <div className="donut-chart" style={{ background: `conic-gradient(var(--danger) 0 ${severity.highPct}%, var(--warning) ${severity.highPct}% ${severity.highPct + severity.medPct}%, var(--success) ${severity.highPct + severity.medPct}%)` }} />
              <div className="severity-list">
                <p className="high"><i />High <b>{severity.high}</b><strong>{severity.highPct}%</strong></p>
                <p className="medium"><i />Medium <b>{severity.medium}</b><strong>{severity.medPct}%</strong></p>
                <p className="low"><i />Low <b>{severity.low}</b><strong>{severity.lowPct}%</strong></p>
              </div>
            </div>
          </article>
        </section>
        <section className="dashboard-grid details-grid">
          <article className="dashboard-card recent-card">
            <h2><Icon name="document" /> Recent Incidents</h2>
            <table>
              <thead><tr><th>ID</th><th>Title</th><th>Department</th><th>Severity</th><th>Status</th><th>Reported At</th><th /></tr></thead>
              <tbody>
                <tr><td>INC-2025-001</td><td>Cannot connect to office WiFi</td><td>Health Office</td><td><span className="tag high-tag">High</span></td><td><span className="tag resolved-tag">Resolved</span></td><td>May 22, 2025<br />10:30 AM</td><td>⋮</td></tr>
                <tr><td>INC-2025-002</td><td>Slow internet connection</td><td>Engineering Office</td><td><span className="tag medium-tag">Medium</span></td><td><span className="tag progress-tag">In Progress</span></td><td>May 21, 2025<br />02:15 PM</td><td>⋮</td></tr>
                <tr><td>INC-2025-003</td><td>Router not responding</td><td>Mayor's Office</td><td><span className="tag low-tag">Low</span></td><td><span className="tag pending-tag">Pending</span></td><td>May 20, 2025<br />09:45 AM</td><td>⋮</td></tr>
                <tr><td>INC-2025-004</td><td>Email server unreachable</td><td>Treasurer's Office</td><td><span className="tag medium-tag">Medium</span></td><td><span className="tag progress-tag">In Progress</span></td><td>May 19, 2025<br />11:20 AM</td><td>⋮</td></tr>
                <tr><td>INC-2025-005</td><td>File sharing not working</td><td>IT Department</td><td><span className="tag low-tag">Low</span></td><td><span className="tag resolved-tag">Resolved</span></td><td>May 18, 2025<br />03:40 PM</td><td>⋮</td></tr>
              </tbody>
            </table>
            <button className="view-all" type="button" onClick={() => navigate('/admin/incidents')}>View All Incidents <Icon name="arrow" /></button>
          </article>
          <article className="dashboard-card device-card">
            <header><h2><Icon name="monitor" /> Device Status</h2><button className="view-devices" type="button" onClick={() => navigate('/admin/device-monitoring')}>View All Devices <Icon name="arrow" /></button></header>
            <div className="device-row online"><Icon name="online" /><p><strong>Online Devices</strong><span>Active and monitored</span></p><b>8</b></div>
            <div className="device-row warning"><Icon name="wrench" /><p><strong>Maintenance</strong><span>Under maintenance</span></p><b>2</b></div>
            <div className="device-row offline"><Icon name="offline" /><p><strong>Offline Devices</strong><span>Not responding</span></p><b>1</b></div>
          </article>
        </section>
        <section className="dashboard-grid">
          <article className="dashboard-card ai-insights-card">
            <h2><Icon name="robot" /> AI Insights <Icon name="sparkle" /></h2>
            <div className="ai-insights-body">
              <div className="ai-insight-item">
                <div className="ai-insight-icon ai-insight-icon--blue"><Icon name="trending" /></div>
                <p>Recurring issue detected on Core Router R-03.</p>
              </div>
              <div className="ai-insight-item">
                <div className="ai-insight-icon ai-insight-icon--purple"><Icon name="users" /></div>
                <p>Engineering Office has the highest incident count.</p>
              </div>
              <div className="ai-insight-item">
                <div className="ai-insight-icon ai-insight-icon--orange"><Icon name="warning" /></div>
                <p>1 Offline device requires immediate attention.</p>
              </div>
              <div className="ai-recommended-action">
                <span>Recommended Action</span>
                <p>Restart Router R-03 and inspect WAN interface.</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  </div>
}

export default Dashboard
