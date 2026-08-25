import { useState, useEffect } from 'react'
import type { FormEvent, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from '../Admin/AdminNotifications'
import { ProfileMenu } from './Profile'
import '../Admin/Dashboard.css'
import './Incidents.css'

type IconName = 'report' | 'incidents' | 'profile' | 'menu' | 'logout' | 'eye' | 'more' | 'edit' | 'trash' | 'close'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    report: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 12h5M10 16h5" /></>,
    incidents: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
    eye: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    more: <><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></>,
    edit: <><path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m13.8 7.2 3 3" /></>,
    trash: <><path d="M4 7h16M10 11v5M14 11v5M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

const navigation: { label: string; icon: IconName; path: string }[] = [
  { label: 'Report Incident', icon: 'report', path: '/employee/report-incident' },
  { label: 'All Incidents', icon: 'incidents', path: '/employee/incidents' },
  { label: 'Profile', icon: 'profile', path: '/employee/profile' },
]

type Status = 'Pending' | 'In Progress' | 'Resolved'
type EmployeeIncident = { id: string; department: string; location: string; issueCategory: string; deviceType: string; connectionType: string; severity: 'High' | 'Medium' | 'Low'; affectedService: string; description: string; status: Status; date: string }
const EMPLOYEE_INCIDENTS_KEY = 'batangai-employee-incidents'
const statusTagClass: Record<Status, string> = { Pending: 'pending-tag', 'In Progress': 'progress-tag', Resolved: 'resolved-tag' }

/* ---------- Theme (light/dark) — same pattern used across every admin page ---------- */

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
    <button type="button" className="theme-toggle-button" onClick={onToggle} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={isDark} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
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

function Incidents() {
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const { theme, toggleTheme } = useTheme()
  const [incidents, setIncidents] = useState<EmployeeIncident[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(EMPLOYEE_INCIDENTS_KEY) ?? '[]') as Partial<EmployeeIncident>[]
      return saved.map(incident => ({ ...incident, severity: incident.severity ?? 'Low' })) as EmployeeIncident[]
    } catch { return [] }
  })
  const [viewing, setViewing] = useState<EmployeeIncident | null>(null)
  const [editing, setEditing] = useState<EmployeeIncident | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const handleLogout = () => { localStorage.removeItem('batangai-admin-auth'); navigate('/') }
  const saveIncidents = (next: EmployeeIncident[]) => { setIncidents(next); localStorage.setItem(EMPLOYEE_INCIDENTS_KEY, JSON.stringify(next)) }
  const deleteIncident = (id: string) => { saveIncidents(incidents.filter(incident => incident.id !== id)); setMenuOpenId(null) }
  const saveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editing) return
    saveIncidents(incidents.map(incident => incident.id === editing.id ? editing : incident))
    setEditing(null)
  }

  return (
    <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div>
        <nav className="sidebar-nav" aria-label="Employee navigation">
          {navigation.map(item => (
            <button key={item.label} type="button" className={item.label === 'All Incidents' ? 'is-active' : ''} onClick={() => navigate(item.path)}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="menu-button" type="button" aria-label="Toggle menu" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed(value => !value)}><Icon name="menu" /></button>
          <div className="topbar-title"><h1>All Incidents</h1><p>View reported incidents and their current status.</p></div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <AdminNotifications />
          <ProfileMenu name="Juan Dela Cruz" role="Employee" avatarInitial="J" onLogout={handleLogout} />
        </header>

        <div className="dashboard-content">
          <article className="dashboard-card employee-incidents-card">
            <div className="employee-table-wrap">
              <table>
                <thead>
                  <tr><th>Incident ID</th><th>Issue / Service</th><th>Category</th><th>Severity</th><th>Status</th><th>Reported</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {incidents.length === 0 && <tr><td className="employee-empty" colSpan={7}>No incident reports yet. Submit one from Report Incident.</td></tr>}
                  {incidents.map(i => (
                    <tr key={i.id}>
                      <td>{i.id}</td>
                      <td>{i.affectedService}</td>
                      <td>{i.issueCategory}</td>
                      <td><span className={`tag ${i.severity.toLowerCase()}-tag`}>{i.severity}</span></td>
                      <td><span className={`tag ${statusTagClass[i.status]}`}>{i.status}</span></td>
                      <td>{i.date}</td>
                      <td className="employee-actions">
                        <button type="button" className="employee-view-button" onClick={() => setViewing(i)} aria-label={`View ${i.id}`}><Icon name="eye" /> View</button>
                        <div className="employee-more-wrap">
                          <button type="button" className="employee-more-button" onClick={() => setMenuOpenId(menuOpenId === i.id ? null : i.id)} aria-label={`More actions for ${i.id}`} aria-expanded={menuOpenId === i.id}><Icon name="more" /></button>
                          {menuOpenId === i.id && <div className="employee-action-menu"><button type="button" onClick={() => { setEditing(i); setMenuOpenId(null) }}><Icon name="edit" /> Edit</button><button type="button" className="danger" onClick={() => deleteIncident(i.id)}><Icon name="trash" /> Delete</button></div>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </main>

      {viewing && <div className="employee-modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setViewing(null) }}><section className="employee-incident-modal" role="dialog" aria-modal="true" aria-labelledby="employee-view-title"><header><div><h2 id="employee-view-title">{viewing.id}</h2><p>Reported {viewing.date}</p></div><button type="button" onClick={() => setViewing(null)} aria-label="Close"><Icon name="close" /></button></header><div className="employee-detail-grid"><div><span>Department</span><strong>{viewing.department}</strong></div><div><span>Location / Room</span><strong>{viewing.location}</strong></div><div><span>Issue Category</span><strong>{viewing.issueCategory}</strong></div><div><span>Device Type</span><strong>{viewing.deviceType}</strong></div><div><span>Connection Type</span><strong>{viewing.connectionType}</strong></div><div><span>Severity</span><strong><span className={`tag ${viewing.severity.toLowerCase()}-tag`}>{viewing.severity}</span></strong></div><div><span>Status</span><strong><span className={`tag ${statusTagClass[viewing.status]}`}>{viewing.status}</span></strong></div></div><section><h3>Affected Issue / Service</h3><p>{viewing.affectedService}</p></section><section><h3>Detailed Problem Description</h3><p>{viewing.description}</p></section></section></div>}

      {editing && <div className="employee-modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null) }}><form className="employee-incident-modal employee-edit-modal" onSubmit={saveEdit}><header><div><h2>Edit Incident</h2><p>{editing.id}</p></div><button type="button" onClick={() => setEditing(null)} aria-label="Close"><Icon name="close" /></button></header><div className="employee-edit-grid">{([['location', 'Location / Room'], ['issueCategory', 'Issue Category'], ['deviceType', 'Device Type'], ['connectionType', 'Connection Type'], ['affectedService', 'Affected Issue / Service'], ['description', 'Detailed Problem Description']] as const).map(([field, label]) => <label key={field}>{label}{field === 'description' ? <textarea required value={editing[field]} onChange={event => setEditing({ ...editing, [field]: event.target.value })} /> : <input required value={editing[field]} onChange={event => setEditing({ ...editing, [field]: event.target.value })} />}</label>)}<label>Severity<select value={editing.severity} onChange={event => setEditing({ ...editing, severity: event.target.value as EmployeeIncident['severity'] })}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></label></div><footer><button type="button" className="employee-cancel" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="incident-new">Save Changes</button></footer></form></div>}
    </div>
  )
}

export default Incidents
