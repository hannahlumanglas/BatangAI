import { useState, useEffect } from 'react'
import type { FormEvent, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from '../Admin/AdminNotifications'
import { ProfileMenu } from './Profile'
import '../Admin/Dashboard.css'
import './ReportIncident.css'

type IconName = 'report' | 'incidents' | 'profile' | 'menu' | 'logout' | 'check' | 'sparkle'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    report: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 12h5M10 16h5" /></>,
    incidents: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    sparkle: <><path d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
  }
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

const navigation: { label: string; icon: IconName; path: string }[] = [
  { label: 'Report Incident', icon: 'report', path: '/employee/report-incident' },
  { label: 'All Incidents', icon: 'incidents', path: '/employee/incidents' },
  { label: 'Profile', icon: 'profile', path: '/employee/profile' },
]

const ISSUE_CATEGORIES = ['Network', 'Hardware', 'Software', 'Account Access', 'Other']
const DEVICE_TYPES = ['Desktop Computer', 'Laptop', 'Printer', 'Router', 'Switch', 'Mobile Device', 'Other']
const CONNECTION_TYPES = ['Wi-Fi', 'LAN / Ethernet', 'VPN', 'Mobile Data', 'Other']
const EMPLOYEE_INCIDENTS_KEY = 'batangai-employee-incidents'

type EmployeeIncident = {
  id: string
  department: string
  location: string
  issueCategory: string
  deviceType: string
  connectionType: string
  affectedService: string
  description: string
  status: 'Pending'
  date: string
}

type IncidentFormValues = Omit<EmployeeIncident, 'id' | 'status' | 'date'>

const initialValues: IncidentFormValues = {
  department: 'City Engineering Office', location: '', issueCategory: '', deviceType: '', connectionType: '', affectedService: '', description: '',
}

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

function ReportIncident() {
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const { theme, toggleTheme } = useTheme()
  const [submitted, setSubmitted] = useState(false)
  const [values, setValues] = useState<IncidentFormValues>(initialValues)
  const [phase, setPhase] = useState<'form' | 'result'>('form')
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'unresolved' | null>(null)
  const handleLogout = () => { localStorage.removeItem('batangai-admin-auth'); navigate('/') }

  const analyze = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPhase('result')
  }

  const submit = () => {
    const saved = JSON.parse(localStorage.getItem(EMPLOYEE_INCIDENTS_KEY) ?? '[]') as EmployeeIncident[]
    const incident: EmployeeIncident = {
      ...values,
      id: `INC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      status: 'Pending',
      date: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()),
    }
    localStorage.setItem(EMPLOYEE_INCIDENTS_KEY, JSON.stringify([incident, ...saved]))
    setSubmitted(true)
    setValues(initialValues)
    setPhase('form')
    setResolutionStatus(null)
  }

  return (
    <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div>
        <nav className="sidebar-nav" aria-label="Employee navigation">
          {navigation.map(item => (
            <button key={item.label} type="button" className={item.label === 'Report Incident' ? 'is-active' : ''} onClick={() => navigate(item.path)}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="menu-button" type="button" aria-label="Toggle menu" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed(value => !value)}><Icon name="menu" /></button>
          <div className="topbar-title"><h1>Report Incident</h1><p>Submit a new IT incident report.</p></div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <AdminNotifications />
          <ProfileMenu name="Juan Dela Cruz" role="Employee" avatarInitial="J" onLogout={handleLogout} />
        </header>

        <div className="dashboard-content">
          <article className="dashboard-card employee-report-card">
            <h2><Icon name="report" /> Report an Incident</h2>
            <p className="employee-report-sub">Tell us what happened and the IT team will review your report.</p>
            {phase === 'form' ? <form className="incident-form" onSubmit={analyze}>
              <fieldset className="incident-form-section">
                <legend className="sr-only">Incident Details</legend>
                <div className="incident-form-section-header"><span className="incident-form-badge">1</span><h3>Incident Details</h3></div>
                <div className="incident-form-grid">
                  <label className="incident-field"><span className="incident-field-label">Department</span><input value={values.department} readOnly disabled /></label>
                  <label className="incident-field"><span className="incident-field-label">Location / Room <em>*</em></span><input required placeholder="e.g. 2nd Floor, IT Room" value={values.location} onChange={e => setValues(v => ({ ...v, location: e.target.value }))} /></label>
                  <label className="incident-field"><span className="incident-field-label">Issue Category <em>*</em></span><select required value={values.issueCategory} onChange={e => setValues(v => ({ ...v, issueCategory: e.target.value }))}><option value="">Select a category</option>{ISSUE_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
                  <label className="incident-field"><span className="incident-field-label">Device Type <em>*</em></span><select required value={values.deviceType} onChange={e => setValues(v => ({ ...v, deviceType: e.target.value }))}><option value="">Select a device type</option>{DEVICE_TYPES.map(item => <option key={item}>{item}</option>)}</select></label>
                  <label className="incident-field"><span className="incident-field-label">Connection Type <em>*</em></span><select required value={values.connectionType} onChange={e => setValues(v => ({ ...v, connectionType: e.target.value }))}><option value="">Select a connection type</option>{CONNECTION_TYPES.map(item => <option key={item}>{item}</option>)}</select></label>
                </div>
              </fieldset>
              <fieldset className="incident-form-section">
                <legend className="sr-only">Problem Description</legend>
                <div className="incident-form-section-header"><span className="incident-form-badge">2</span><h3>Problem Description</h3></div>
                <div className="incident-form-grid incident-form-grid--single">
                  <label className="incident-field"><span className="incident-field-label">Affected Issue / Service <em>*</em></span><input required placeholder="e.g. Records System login" value={values.affectedService} onChange={e => setValues(v => ({ ...v, affectedService: e.target.value }))} /></label>
                  <label className="incident-field"><span className="incident-field-label">Detailed Problem Description <em>*</em></span><textarea required rows={4} placeholder="Describe what happened, when it started, and any error messages you saw." value={values.description} onChange={e => setValues(v => ({ ...v, description: e.target.value }))} /></label>
                </div>
              </fieldset>
              <button className="incident-new" type="submit"><Icon name="sparkle" /> Analyze with BatangAI</button>
              {submitted && <p className="employee-report-success"><Icon name="check" /> Your incident report has been submitted.</p>}
            </form> : <section className="employee-ai-result" aria-live="polite">
              <div className="employee-ai-result-heading"><Icon name="sparkle" /><div><h3>BatangAI Analysis Result</h3><p>Review the analysis before submitting your incident.</p></div></div>
              <div className="employee-ai-block"><span>Incident Summary</span><p>{values.affectedService} — {values.description}</p></div>
              <div className="employee-ai-block"><span>AI Classification</span><strong>{values.issueCategory} issue</strong></div>
              <div className="employee-ai-block"><span>Possible Cause</span><p>The issue may be caused by a device, connection, or service configuration problem in the reporting location.</p></div>
              <div className="employee-ai-block"><span>Recommended Troubleshooting Steps</span><ol><li>Check the device and its network connection.</li><li>Restart the device, then try again.</li><li>Record any error message and send the report to IT.</li></ol></div>
              <section className="employee-resolution-check"><h3>Were you able to resolve the issue?</h3><p>Using the steps above, did you fix the problem? Your answer determines how this report is handled.</p><div className="employee-resolution-options"><button type="button" className={`employee-resolution-option resolved${resolutionStatus === 'resolved' ? ' selected' : ''}`} onClick={() => setResolutionStatus('resolved')}><b>✓</b><strong>Yes, Resolved!</strong><span>Mark as resolved by user</span></button><button type="button" className={`employee-resolution-option unresolved${resolutionStatus === 'unresolved' ? ' selected' : ''}`} onClick={() => setResolutionStatus('unresolved')}><b>×</b><strong>Not Resolved</strong><span>Assign to IT personnel</span></button></div></section>
              <div className="employee-ai-actions"><button className="employee-ai-back" type="button" onClick={() => setPhase('form')}>Edit Report</button><button className="incident-new" type="button" onClick={submit} disabled={!resolutionStatus}><Icon name="check" /> Submit Incident</button></div>
            </section>}
          </article>
        </div>
      </main>
    </div>
  )
}

export default ReportIncident
