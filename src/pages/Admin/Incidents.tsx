import { useState, useEffect, useRef, useMemo } from 'react'
import type { ChangeEvent, FormEvent, JSX, MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './Incidents.css'

type IconName = 'dashboard' | 'incidents' | 'devices' | 'users' | 'reports' | 'profile' | 'logout' | 'menu' | 'bell' | 'search' | 'view' | 'more' | 'sparkle' | 'check-circle' | 'x-circle' | 'walk' | 'assign'

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
    view: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    more: <><circle cx="12" cy="5" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="12" cy="19" r="1.3" /></>,
    sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></>,
    'check-circle': <><circle cx="12" cy="12" r="9" /><path d="m8.3 12.3 2.4 2.4L15.8 9.6" /></>,
    'x-circle': <><circle cx="12" cy="12" r="9" /><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" /></>,
    walk: <><circle cx="13" cy="4.5" r="1.8" /><path d="M13 7.3 9.5 9l1 3.2-3 2.3M13 7.3l2.5 2.2-.8 3.3 2.8 3M9.5 9l3.5-.5 2 1.5" /></>,
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

const initialIncidents = [
  ['INC-2025-001', 'Maria Santos', 'Cannot access patient records...', 'City Health Office', 'High', 'Resolved', 'Jul 10, 2025', '08:30 AM'],
  ['INC-2025-002', 'Jose Reyes', 'CAD software uploads very slow', 'City Engineering Office', 'Medium', 'In Progress', 'Jul 15, 2025', '09:00 AM'],
  ['INC-2025-003', 'Ana Dela Cruz', 'Internet connection intermittently...', "City Mayor's Office", 'Low', 'Pending', 'Jul 16, 2025', '10:15 AM'],
  ['INC-2025-004', 'John Paul Garcia', 'Printer not responding', "City Treasurer's Office", 'Medium', 'In Progress', 'Jul 16, 2025', '11:45 AM'],
  ['INC-2025-005', 'Liza Manalo', 'Email not receiving messages', 'City Social Welfare Office', 'Low', 'Resolved', 'Jul 17, 2025', '02:20 PM'],
]

const STATUS_OPTIONS = ['All Status', 'Pending', 'In Progress', 'Resolved']
const SEVERITY_OPTIONS = ['All Severity', 'High', 'Medium', 'Low']
const DEPARTMENT_OPTIONS = ['All Departments', ...Array.from(new Set(initialIncidents.map((row) => row[3])))]

/* ===========================================================
   Incident Detail modal — types and mock data for the View action.
   Keyed by incident ID; frontend-only, mirrors the same BatangAI
   analysis format used by the New Incident flow below.
   =========================================================== */

interface IncidentAIAnalysis {
  title: string
  summary: string
  steps: string[]
}

interface IncidentDetailInfo {
  reportType: string
  location: string
  deviceType: string
  connectionType: string
  category: string
  affectedIssue: string
  problemDescription: string
  aiAnalysis: IncidentAIAnalysis
  encodedBy: string
  assignedTo: string | null
  assignedBy: string | null
  assignedAt: string | null
  actionStarted: string | null
  resolvedAt: string | null
}

const incidentDetails: Record<string, IncidentDetailInfo> = {
  'INC-2025-001': {
    reportType: 'Walk-in',
    location: 'Room 201 - Records Section',
    deviceType: 'Desktop',
    connectionType: 'LAN',
    category: 'No Connectivity',
    affectedIssue: 'Cannot access patient records system',
    problemDescription: 'All workstations in Room 201 lost internet connectivity since 8AM. We cannot access the online patient records system. Very urgent as we have patients waiting.',
    aiAnalysis: {
      title: 'Network Connectivity Failure',
      summary: 'The reported issue indicates a complete loss of network connectivity, which may stem from misconfigured network settings, a faulty cable, or an unresponsive gateway device.',
      steps: [
        'Check if the network cable is properly plugged in (for LAN) or if Wi-Fi adapter is enabled.',
        'Restart the network adapter via Device Manager or Settings > Network.',
        'Run ipconfig /release and ipconfig /renew in Command Prompt.',
        'Ping the default gateway (e.g., 192.168.1.1) to test local network connectivity.',
        'If ping fails, check the switch or router the device is connected to for any indicator lights.',
        'Try connecting a different device to the same port to isolate if the issue is device-specific.',
        'Contact IT if the issue persists after these steps.',
      ],
    },
    encodedBy: 'Liza Bautista',
    assignedTo: 'Juan dela Cruz',
    assignedBy: 'Liza Bautista',
    assignedAt: 'Jul 10, 2025 08:45 AM',
    actionStarted: 'Jul 10, 2025 09:15 AM',
    resolvedAt: 'Jul 10, 2025 10:45 AM',
  },
  'INC-2025-002': {
    reportType: 'Phone Call',
    location: 'Engineering Office - 2nd Floor',
    deviceType: 'Desktop',
    connectionType: 'LAN',
    category: 'Software / Application Error',
    affectedIssue: 'CAD software uploads very slow',
    problemDescription: 'CAD file uploads to the shared server have been extremely slow since yesterday, delaying design submissions for the road widening project.',
    aiAnalysis: {
      title: 'Software Performance Degradation',
      summary: 'Slow uploads to a shared server typically point to network bandwidth contention, an outdated client version, or a server-side storage limit.',
      steps: [
        'Clear the application cache and restart the affected program.',
        'Confirm the software is on the latest supported version.',
        'Test the upload speed to the server from a different workstation.',
        'Check the shared server for available storage space.',
        'Escalate to IT if uploads remain slow after these checks.',
      ],
    },
    encodedBy: 'Liza Bautista',
    assignedTo: 'Mark Villanueva',
    assignedBy: 'Liza Bautista',
    assignedAt: 'Jul 15, 2025 09:20 AM',
    actionStarted: 'Jul 15, 2025 09:40 AM',
    resolvedAt: null,
  },
  'INC-2025-003': {
    reportType: 'Online Form',
    location: "Mayor's Office - Reception",
    deviceType: 'Laptop',
    connectionType: 'Wi-Fi',
    category: 'Network Connectivity',
    affectedIssue: 'Internet connection intermittently drops',
    problemDescription: 'Wi-Fi connection keeps dropping every 10-15 minutes throughout the day, making video calls unreliable.',
    aiAnalysis: {
      title: 'Intermittent Wi-Fi Disconnection',
      summary: 'Frequent Wi-Fi drops are commonly caused by signal interference, an overloaded access point, or an outdated wireless driver.',
      steps: [
        'Move closer to the access point to rule out a weak signal.',
        'Restart the laptop\u2019s Wi-Fi adapter or toggle airplane mode.',
        'Update the wireless network driver to the latest version.',
        'Check how many devices are connected to the same access point.',
        'Escalate to Network Operations if drops continue after these steps.',
      ],
    },
    encodedBy: 'Liza Bautista',
    assignedTo: null,
    assignedBy: null,
    assignedAt: null,
    actionStarted: null,
    resolvedAt: null,
  },
  'INC-2025-004': {
    reportType: 'Walk-in',
    location: "Treasurer's Office - Cashier Section",
    deviceType: 'Printer',
    connectionType: 'LAN',
    category: 'Printer / Peripheral',
    affectedIssue: 'Printer not responding',
    problemDescription: 'The shared printer at the cashier section stopped responding to print jobs since this morning, delaying the issuance of official receipts.',
    aiAnalysis: {
      title: 'Printer Communication Error',
      summary: 'A printer that stops responding usually points to a stalled print spooler, a network path issue, or an outdated driver.',
      steps: [
        'Restart the print spooler service on the workstation.',
        'Confirm the printer is powered on and shows a network/LAN light.',
        'Update or reinstall the printer driver.',
        'Print a test page directly from the printer\u2019s control panel.',
        'Escalate to IT if the printer still does not respond.',
      ],
    },
    encodedBy: 'Liza Bautista',
    assignedTo: 'Juan dela Cruz',
    assignedBy: 'Liza Bautista',
    assignedAt: 'Jul 16, 2025 12:00 PM',
    actionStarted: 'Jul 16, 2025 12:20 PM',
    resolvedAt: null,
  },
  'INC-2025-005': {
    reportType: 'Phone Call',
    location: 'Social Welfare Office - Admin Desk',
    deviceType: 'Desktop',
    connectionType: 'LAN',
    category: 'Email / Communication',
    affectedIssue: 'Email not receiving messages',
    problemDescription: 'Outlook has not received any new emails since yesterday afternoon despite the internet connection being stable.',
    aiAnalysis: {
      title: 'Email Sync Failure',
      summary: 'A mailbox that stops receiving mail is usually caused by a sync delay, a full mailbox quota, or a corrupted client profile.',
      steps: [
        'Verify the mailbox is under its storage quota.',
        'Force a manual send/receive and check the outbox for stuck messages.',
        'Confirm mail server status with IT Operations.',
        'Reset the email client profile if syncing continues to fail.',
      ],
    },
    encodedBy: 'Liza Bautista',
    assignedTo: 'Mark Villanueva',
    assignedBy: 'Liza Bautista',
    assignedAt: 'Jul 17, 2025 02:35 PM',
    actionStarted: 'Jul 17, 2025 02:50 PM',
    resolvedAt: 'Jul 17, 2025 03:30 PM',
  },
}

/* ===========================================================
   New Incident modal — types, mock data, and helpers
   =========================================================== */

interface IncidentFormValues {
  department: string
  location: string
  issueCategory: string
  deviceType: string
  connectionType: string
  severity: string
  affectedService: string
  description: string
}

const initialIncidentFormValues: IncidentFormValues = {
  department: '',
  location: '',
  issueCategory: '',
  deviceType: '',
  connectionType: '',
  severity: '',
  affectedService: '',
  description: '',
}

interface AIAnalysisResult {
  summary: string
  classification: string
  possibleCause: string
  troubleshootingSteps: string[]
  confidenceScore: number
}

type ModalPhase = 'form' | 'analyzing' | 'result'

// Mock "logged-in user" department — stands in for a real auth/session lookup. Frontend-only.
const MOCK_CURRENT_DEPARTMENT = 'City Engineering Office'

const ISSUE_CATEGORIES = [
  'Network Connectivity',
  'Hardware Malfunction',
  'Software / Application Error',
  'Email / Communication',
  'Printer / Peripheral',
  'Server / System Downtime',
  'Security / Access Issue',
  'Other',
]

const DEVICE_TYPES = [
  'Desktop Computer',
  'Laptop',
  'Printer',
  'Router',
  'Switch',
]

const CONNECTION_TYPES = [
  'LAN',
  'Wi-Fi',
]

const REQUIRED_FIELDS: (keyof IncidentFormValues)[] = [
  'location', 'issueCategory', 'deviceType', 'connectionType', 'affectedService', 'description',
]

const FIELD_LABELS: Record<keyof IncidentFormValues, string> = {
  department: 'Department',
  location: 'Location / Room',
  issueCategory: 'Issue Category',
  deviceType: 'Device Type',
  connectionType: 'Connection Type',
  severity: 'Severity Level',
  affectedService: 'Affected Issue / Service',
  description: 'Detailed Problem Description',
}

const CLASSIFICATION_FALLBACKS = [
  'Network Connectivity Issue',
  'Hardware Fault',
  'Software / Configuration Error',
  'Access & Permissions Issue',
]

const CAUSES_BY_CATEGORY: Record<string, string> = {
  'Network Connectivity': 'Intermittent packet loss on the local switch, or a weak Wi-Fi signal in the reporting location.',
  'Hardware Malfunction': 'A failing internal component or a loose physical connection on the affected device.',
  'Software / Application Error': 'An outdated client version or a corrupted local configuration file.',
  'Email / Communication': 'Mail server sync delay, or the mailbox has reached its storage limit.',
  'Printer / Peripheral': 'A stalled print spooler service or an outdated printer driver.',
  'Server / System Downtime': 'Scheduled maintenance overlap or an unresponsive backend service.',
  'Security / Access Issue': 'An expired credential, or a permissions change that has not propagated yet.',
  Other: 'The symptoms do not map cleanly to a known category and may need on-site inspection.',
}

const STEPS_BY_CATEGORY: Record<string, string[]> = {
  'Network Connectivity': [
    'Restart the router or switch nearest to the reporting location.',
    'Confirm the device is on the correct VLAN or Wi-Fi network.',
    'Run a ping/traceroute to the affected server to isolate the failing hop.',
    'Escalate to Network Operations if the issue persists after restart.',
  ],
  'Hardware Malfunction': [
    'Power-cycle the device and check all physical cable connections.',
    'Test the device on a different port or peripheral to isolate the fault.',
    'Check the device event log for recurring hardware errors.',
    'Schedule a technician visit if the fault is confirmed.',
  ],
  'Software / Application Error': [
    'Clear the application cache and restart the affected program.',
    'Confirm the software is on the latest supported version.',
    'Reproduce the error and capture the exact error message.',
    'Reinstall the application if the update does not resolve it.',
  ],
  'Email / Communication': [
    'Verify the mailbox is under its storage quota.',
    'Force a manual sync and check the outbox for stuck messages.',
    'Confirm mail server status with IT Operations.',
    'Reset the email client profile if syncing continues to fail.',
  ],
  'Printer / Peripheral': [
    'Restart the print spooler service.',
    'Update or reinstall the printer driver.',
    'Confirm the printer is reachable on the network.',
    'Print a test page to confirm the fix.',
  ],
  'Server / System Downtime': [
    'Check the system status dashboard for ongoing maintenance windows.',
    'Restart the affected service if it is safe to do so.',
    'Review server logs around the time of the failure.',
    'Escalate to the Systems team if downtime exceeds SLA.',
  ],
  'Security / Access Issue': [
    'Confirm the account credentials have not expired.',
    "Verify the user's access group has the correct permissions.",
    'Reset and reissue credentials if necessary.',
    'Escalate to the Security team for audit if unauthorized access is suspected.',
  ],
  Other: [
    'Gather additional details and screenshots from the reporter.',
    'Cross-check with recent related incident reports.',
    'Assign to the relevant department for on-site inspection.',
    'Update this report once a root cause is confirmed.',
  ],
}

function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length]
}

// Simulates an AI analysis response from deterministic mock data. No network call — frontend-only.
function generateMockAnalysis(values: IncidentFormValues): AIAnalysisResult {
  const seed = values.description.length + values.affectedService.length + values.location.length

  const classification = values.issueCategory || pick(CLASSIFICATION_FALLBACKS, seed)
  const possibleCause = CAUSES_BY_CATEGORY[values.issueCategory] ?? CAUSES_BY_CATEGORY.Other
  const troubleshootingSteps = STEPS_BY_CATEGORY[values.issueCategory] ?? STEPS_BY_CATEGORY.Other
  const confidenceScore = 78 + (seed % 18) // stays within a believable 78–95% band

  const trimmedDescription = values.description.length > 140
    ? `${values.description.slice(0, 140)}…`
    : values.description

  return {
    summary: `${values.affectedService} is affected by a reported issue at ${values.location}. Reporter notes: "${trimmedDescription}"`,
    classification,
    possibleCause,
    troubleshootingSteps,
    confidenceScore,
  }
}

const ANALYSIS_DELAY_MS = 2000

/* ===========================================================
   Page component
   =========================================================== */

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
          <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate(profilePath.replace('/profile', '/settings')) }}>
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

function Incidents({ audience = 'administrator' }: { audience?: 'administrator' | 'secretary' | 'it' }) {
  const navigate = useNavigate()
  const isSecretary = audience === 'secretary'
  const isIT = audience === 'it'
  const roleNavigation = isSecretary
    ? navigation.filter(item => ['All Incidents', 'Manage & Assign', 'Profile'].includes(item.label)).map(item => ({ ...item, path: item.path.replace('/admin', '/secretary') }))
    : isIT
      ? navigation.filter(item => ['All Incidents', 'Manage & Assign', 'Device Monitoring', 'Profile'].includes(item.label)).map(item => ({ ...item, label: item.label === 'Manage & Assign' ? 'My Assignments' : item.label, path: item.label === 'Manage & Assign' ? '/it/my-assignments' : item.path.replace('/admin', '/it') }))
      : navigation
  const user = isSecretary ? { name: 'Teresa Lopez', role: 'Secretary', initial: 'T', profilePath: '/secretary/profile' } : isIT ? { name: 'Juan dela Cruz', role: 'IT Personnel', initial: 'J', profilePath: '/it/profile' } : { name: 'Ricardo Mendoza', role: 'Administrator', initial: 'R', profilePath: '/admin/profile' }
  const { theme, toggleTheme } = useTheme()
  const handleLogout = () => { localStorage.removeItem('batangai-admin-auth'); navigate('/') }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [incidents, setIncidents] = useState(initialIncidents)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [severityFilter, setSeverityFilter] = useState('All Severity')
  const [departmentFilter, setDepartmentFilter] = useState('All Departments')

  const filteredIncidents = useMemo(() => {
    const q = query.trim().toLowerCase()
    return incidents.filter(([id, reporter, description, department, severity, status]) => {
      const matchesQuery = q === '' || `${id} ${reporter} ${description} ${department}`.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All Status' || status === statusFilter
      const matchesSeverity = severityFilter === 'All Severity' || severity === severityFilter
      const matchesDepartment = departmentFilter === 'All Departments' || department === departmentFilter
      return matchesQuery && matchesStatus && matchesSeverity && matchesDepartment
    })
  }, [query, statusFilter, severityFilter, departmentFilter])

  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false)
  const [phase, setPhase] = useState<ModalPhase>('form')
  const [values, setValues] = useState<IncidentFormValues>(initialIncidentFormValues)
  const [errors, setErrors] = useState<Partial<Record<keyof IncidentFormValues, string>>>({})
  const [result, setResult] = useState<AIAnalysisResult | null>(null)
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'unresolved' | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const closeViewing = () => setViewingId(null)
  const deleteIncident = (id: string) => {
    if (window.confirm(`Delete incident ${id}? This action cannot be undone.`)) {
      setIncidents(current => current.filter(([incidentId]) => incidentId !== id))
      setActionMenuId(null)
      if (viewingId === id) closeViewing()
    }
  }

  // Close the incident detail modal on ESC.
  useEffect(() => {
    if (!viewingId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeViewing()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [viewingId])


  const openNewIncident = () => {
    setEditingId(null)
    setValues({ ...initialIncidentFormValues, department: MOCK_CURRENT_DEPARTMENT })
    setErrors({})
    setResult(null)
    setResolutionStatus(null)
    setPhase('form')
    setIsNewIncidentOpen(true)
  }

  const openEditIncident = (id: string) => {
    const row = incidents.find(([incidentId]) => incidentId === id)
    if (!row) return
    const detail = incidentDetails[id]
    setEditingId(id)
    setValues({ department: row[3], location: detail?.location ?? '', issueCategory: detail?.category ?? '', deviceType: detail?.deviceType ?? '', connectionType: detail?.connectionType ?? '', severity: row[4], affectedService: detail?.affectedIssue ?? row[2], description: detail?.problemDescription ?? row[2] })
    setErrors({})
    setResult(null)
    setResolutionStatus(null)
    setPhase('form')
    setActionMenuId(null)
    setIsNewIncidentOpen(true)
  }

  const submitIncident = () => {
    const status = resolutionStatus === 'resolved' ? 'Resolved' : 'Pending'
    if (editingId) {
      setIncidents(current => current.map(row => row[0] === editingId ? [row[0], row[1], values.affectedService, values.department, values.severity || row[4], status, row[6], row[7]] : row))
    } else {
      const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())
      const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date())
      setIncidents(current => [[`INC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`, user.name, values.affectedService, values.department, values.severity || 'Low', status, date, time], ...current])
    }
    closeNewIncident()
  }

  const closeNewIncident = () => setIsNewIncidentOpen(false)

  // Close on ESC, in either the form or the result phase.
  useEffect(() => {
    if (!isNewIncidentOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeNewIncident()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isNewIncidentOpen])

  const handleFieldChange = (field: keyof IncidentFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleInputChange = (field: keyof IncidentFormValues) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => handleFieldChange(field, event.target.value)

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof IncidentFormValues, string>> = {}
    REQUIRED_FIELDS.forEach((field) => {
      if (!values[field] || !values[field].trim()) {
        nextErrors[field] = `${FIELD_LABELS[field]} is required.`
      }
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleAnalyze = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setPhase('analyzing')
    setResolutionStatus(null)
    window.setTimeout(() => {
      setResult(generateMockAnalysis(values))
      setPhase('result')
    }, ANALYSIS_DELAY_MS)
  }

  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) closeNewIncident()
  }

  return <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div>
      <nav className="sidebar-nav" aria-label={`${user.role} navigation`}>
        {roleNavigation.map(item => <button className={item.label === 'All Incidents' ? 'is-active' : ''} key={item.label} type="button" onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
      </nav>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="menu-button" type="button" aria-label="Toggle menu" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}><Icon name="menu" /></button>
        <div className="topbar-title"><h1>All Incident Reports</h1><p>Monitor all network incident reports across all departments.</p></div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <AdminNotifications />
        <ProfileMenu name={user.name} role={user.role} avatarInitial={user.initial} profilePath={user.profilePath} onLogout={handleLogout} />
      </header>

      <div className="dashboard-content">
        <section className="incident-tools">
          <label className="incident-search"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search incidents..." /></label>
          <button className="incident-new" type="button" onClick={openNewIncident}>+ New Incident</button>
        </section>

        <section className="incident-filters">
          <label className="incident-filter-select">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="incident-filter-select">
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              {SEVERITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="incident-filter-select">
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              {DEPARTMENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </section>

        <article className="dashboard-card incidents-table-card">
          <table>
            <thead><tr><th>ID</th><th>REPORTER</th><th>DEPARTMENT</th><th>SEVERITY</th><th>STATUS</th><th>ACTION</th><th className="incident-table-spacer" aria-hidden="true" /></tr></thead>
            <tbody>
              {filteredIncidents.map(([id, reporter, , department, severity, status]) => (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{reporter}</td>
                  <td>{department}</td>
                  <td><span className={`tag ${severity.toLowerCase()}-tag`}>{severity}</span></td>
                  <td><span className={`tag status-${status.toLowerCase().replace(' ', '-')} ${status === 'Resolved' ? 'resolved-tag' : status === 'In Progress' ? 'progress-tag' : 'pending-tag'}`}>{status}</span></td>
                  <td className="incident-actions">
                    <button className="view-all incident-view" type="button" onClick={() => setViewingId(id)}><Icon name="view" /> View</button>
                    <div className="incident-more-menu">
                      <button className="more-button" type="button" aria-label={`More actions for ${id}`} aria-expanded={actionMenuId === id} onClick={() => setActionMenuId(current => current === id ? null : id)}><Icon name="more" /></button>
                      {actionMenuId === id && <div className="incident-row-menu"><button type="button" onClick={() => openEditIncident(id)}>Edit</button><button className="incident-delete-action" type="button" onClick={() => deleteIncident(id)}>Delete</button></div>}
                    </div>
                  </td>
                  <td className="incident-table-spacer" aria-hidden="true" />
                </tr>
              ))}
              {filteredIncidents.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text)', padding: '32px 21px' }}>No incidents match your search or filters.</td></tr>
              )}
            </tbody>
          </table>
          <footer className="incidents-footer">
            <strong>Showing {filteredIncidents.length} of {incidents.length} results</strong>
            <div className="incidents-pagination">
              <button type="button">‹</button>
              <button className="current" type="button">1</button>
              <button type="button">›</button>
            </div>
          </footer>
        </article>
      </div>
    </main>

    {isNewIncidentOpen && phase !== 'result' && (
      <div className="modal-overlay" ref={overlayRef} onMouseDown={handleOverlayMouseDown}>
        <div className="new-incident-modal" role="dialog" aria-modal="true" aria-labelledby="new-incident-title">
          <header className="new-incident-header">
            <div>
              <h2 id="new-incident-title">{editingId ? 'Edit Incident Report' : 'Report a Network Incident'}</h2>
              <p>{editingId ? 'Update the incident information, then review the BatangAI analysis.' : 'Fill out the form below. BatangAI will analyze and provide troubleshooting steps.'}</p>
            </div>
            <button className="modal-close" type="button" aria-label="Close dialog" onClick={closeNewIncident}>×</button>
          </header>

          <form className="new-incident-body" onSubmit={handleAnalyze} noValidate>
            <div className="incident-form">
              <fieldset className="incident-form-section" disabled={phase === 'analyzing'}>
                <legend className="sr-only">Incident Details</legend>
                <div className="incident-form-section-header">
                  <span className="incident-form-badge">1</span>
                  <h3>Incident Details</h3>
                </div>

                <div className="incident-form-grid">
                  <label className="incident-field">
                    <span className="incident-field-label">Department</span>
                    <input type="text" value={values.department} readOnly disabled title="Auto-filled from your account" />
                  </label>

                  <label className="incident-field">
                    <span className="incident-field-label">Location / Room <em>*</em></span>
                    <input
                      type="text"
                      placeholder="e.g. 2nd Floor, IT Room"
                      value={values.location}
                      onChange={handleInputChange('location')}
                      aria-invalid={Boolean(errors.location)}
                    />
                    {errors.location && <span className="incident-field-error">{errors.location}</span>}
                  </label>

                  <label className="incident-field">
                    <span className="incident-field-label">Issue Category <em>*</em></span>
                    <select value={values.issueCategory} onChange={handleInputChange('issueCategory')} aria-invalid={Boolean(errors.issueCategory)}>
                      <option value="">Select a category</option>
                      {ISSUE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    {errors.issueCategory && <span className="incident-field-error">{errors.issueCategory}</span>}
                  </label>

                  <label className="incident-field">
                    <span className="incident-field-label">Device Type <em>*</em></span>
                    <select value={values.deviceType} onChange={handleInputChange('deviceType')} aria-invalid={Boolean(errors.deviceType)}>
                      <option value="">Select a device type</option>
                      {DEVICE_TYPES.map((device) => <option key={device} value={device}>{device}</option>)}
                    </select>
                    {errors.deviceType && <span className="incident-field-error">{errors.deviceType}</span>}
                  </label>

                  <label className="incident-field">
                    <span className="incident-field-label">Connection Type <em>*</em></span>
                    <select value={values.connectionType} onChange={handleInputChange('connectionType')} aria-invalid={Boolean(errors.connectionType)}>
                      <option value="">Select a connection type</option>
                      {CONNECTION_TYPES.map((connection) => <option key={connection} value={connection}>{connection}</option>)}
                    </select>
                    {errors.connectionType && <span className="incident-field-error">{errors.connectionType}</span>}
                  </label>

                  <label className="incident-field">
                    <span className="incident-field-label">Severity <em>*</em></span>
                    <select value={values.severity} onChange={handleInputChange('severity')} aria-invalid={Boolean(errors.severity)}>
                      <option value="">Select severity</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                    </select>
                    {errors.severity && <span className="incident-field-error">{errors.severity}</span>}
                  </label>

                </div>
              </fieldset>

              <fieldset className="incident-form-section" disabled={phase === 'analyzing'}>
                <legend className="sr-only">Problem Description</legend>
                <div className="incident-form-section-header">
                  <span className="incident-form-badge">2</span>
                  <h3>Problem Description</h3>
                </div>

                <div className="incident-form-grid incident-form-grid--single">
                  <label className="incident-field">
                    <span className="incident-field-label">Affected Issue / Service <em>*</em></span>
                    <input
                      type="text"
                      placeholder="e.g. Records System login"
                      value={values.affectedService}
                      onChange={handleInputChange('affectedService')}
                      aria-invalid={Boolean(errors.affectedService)}
                    />
                    {errors.affectedService && <span className="incident-field-error">{errors.affectedService}</span>}
                  </label>

                  <label className="incident-field">
                    <span className="incident-field-label">Detailed Problem Description <em>*</em></span>
                    <textarea
                      rows={4}
                      placeholder="Describe what happened, when it started, and any error messages you saw."
                      value={values.description}
                      onChange={handleInputChange('description')}
                      aria-invalid={Boolean(errors.description)}
                    />
                    {errors.description && <span className="incident-field-error">{errors.description}</span>}
                  </label>
                </div>
              </fieldset>
            </div>

            {phase === 'analyzing' && (
              <div className="analyzing-overlay" role="status" aria-live="polite">
                <span className="analyzing-spinner" aria-hidden="true" />
                <p>BatangAI is analyzing the report…</p>
              </div>
            )}

            <footer className="new-incident-footer">
              <button className="btn-secondary btn-block" type="button" onClick={closeNewIncident} disabled={phase === 'analyzing'}>
                Cancel
              </button>
              <button className="btn-primary btn-block" type="submit" disabled={phase === 'analyzing'}>
                {phase === 'analyzing' ? 'Analyzing…' : <><Icon name="sparkle" /> Analyze with BatangAI</>}
              </button>
            </footer>
          </form>
        </div>
      </div>
    )}

    {isNewIncidentOpen && phase === 'result' && result && (
      <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeNewIncident() }}>
        <div className="ai-analysis-modal" role="dialog" aria-modal="true" aria-labelledby="ai-analysis-title">
          <header className="ai-analysis-header">
            <h2 id="ai-analysis-title">AI Analysis Result</h2>
            <button className="modal-close" type="button" aria-label="Close dialog" onClick={closeNewIncident}>×</button>
          </header>

          <div className="ai-analysis-body">
            <section className="ai-analysis-block">
              <h3>Incident Summary</h3>
              <p>{result.summary}</p>
            </section>

            <section className="ai-analysis-block">
              <h3>AI Classification</h3>
              <span className="ai-classification-tag">{result.classification}</span>
            </section>

            <section className="ai-analysis-block">
              <h3>Possible Cause</h3>
              <p>{result.possibleCause}</p>
            </section>

            <section className="ai-analysis-block">
              <h3>Recommended Troubleshooting Steps</h3>
              <ol className="ai-steps-list">
                {result.troubleshootingSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>

            <section className="ai-resolution-check">
              <h3>Were you able to resolve the issue?</h3>
              <p>Using the steps above, did you fix the problem? Your answer determines how this report is handled.</p>

              <div className="ai-resolution-options">
                <button
                  type="button"
                  className={`ai-resolution-option ai-resolution-option--resolved${resolutionStatus === 'resolved' ? ' is-selected' : ''}`}
                  onClick={() => setResolutionStatus('resolved')}
                  aria-pressed={resolutionStatus === 'resolved'}
                >
                  <Icon name="check-circle" />
                  <strong>Yes, Resolved!</strong>
                  <span>Mark as resolved by user</span>
                </button>

                <button
                  type="button"
                  className={`ai-resolution-option ai-resolution-option--unresolved${resolutionStatus === 'unresolved' ? ' is-selected' : ''}`}
                  onClick={() => setResolutionStatus('unresolved')}
                  aria-pressed={resolutionStatus === 'unresolved'}
                >
                  <Icon name="x-circle" />
                  <strong>Not Resolved</strong>
                  <span>Assign to IT personnel</span>
                </button>
              </div>
            </section>
          </div>

          <footer className="ai-analysis-footer">
            <button className="btn-ghost" type="button" onClick={() => setPhase('form')}>Edit Report</button>
            <div className="ai-analysis-footer-right">
              <button className="btn-secondary" type="button" onClick={closeNewIncident}>Close</button>
              <button className="btn-primary" type="button" onClick={submitIncident} disabled={!resolutionStatus}>{editingId ? 'Save Changes' : 'Submit Incident'}</button>
            </div>
          </footer>
        </div>
      </div>
    )}

    {viewingId && (() => {
      const row = incidents.find(([incidentId]) => incidentId === viewingId)
      if (!row) return null
      const detail = incidentDetails[viewingId] ?? {
        location: 'Office work area', deviceType: 'Desktop Computer', connectionType: 'LAN / Ethernet', category: 'Network',
        affectedIssue: row[2], problemDescription: row[2], aiAnalysis: { title: 'Network connectivity issue', summary: 'The report is being reviewed by the IT team.', steps: ['Check the physical connection.', 'Restart the affected device.', 'Escalate to IT personnel if the issue continues.'] },
        reportType: 'Network Incident', encodedBy: 'Ricardo Mendoza', assignedTo: null, assignedBy: null, assignedAt: null, actionStarted: null, resolvedAt: null,
      }
      const [id, reporter, , department, severity, status, date, time] = row
      const statusTagClass = status === 'Resolved' ? 'resolved-tag' : status === 'In Progress' ? 'progress-tag' : 'pending-tag'

      return (
        <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeViewing() }}>
          <div className="incident-detail-modal" role="dialog" aria-modal="true" aria-labelledby="incident-detail-title">
            <header className="incident-detail-header">
              <div>
                <h2 id="incident-detail-title">{id}</h2>
                <p><span>{date} at {time}</span></p>
              </div>
              <button className="modal-close" type="button" aria-label="Close dialog" onClick={closeViewing}>×</button>
            </header>

            <div className="incident-detail-body">
              <div className="incident-detail-grid">
                <div className="incident-detail-field"><span>Reporter</span><strong>{reporter}</strong></div>
                <div className="incident-detail-field"><span>Department</span><strong>{department}</strong></div>
                <div className="incident-detail-field"><span>Location</span><strong>{detail.location}</strong></div>
                <div className="incident-detail-field"><span>Device Type</span><strong>{detail.deviceType}</strong></div>
                <div className="incident-detail-field"><span>Connection</span><strong>{detail.connectionType}</strong></div>
                <div className="incident-detail-field"><span>Category</span><strong>{detail.category}</strong></div>
              </div>

              <div className="incident-detail-tags">
                <span className={`tag ${severity.toLowerCase()}-tag`}>{severity} Severity</span>
                <span className={`tag ${statusTagClass}`}>{status}</span>
              </div>

              <section className="incident-detail-section">
                <h3>Affected Issue</h3>
                <p className="incident-detail-emphasis">{detail.affectedIssue}</p>
              </section>

              <section className="incident-detail-section">
                <h3>Problem Description</h3>
                <p>{detail.problemDescription}</p>
              </section>

              <section className="incident-ai-analysis">
                <h3><Icon name="sparkle" /> BatangAI Analysis</h3>
                <h4>{detail.aiAnalysis.title}</h4>
                <p>{detail.aiAnalysis.summary}</p>
                <ol className="incident-ai-steps">
                  {detail.aiAnalysis.steps.map((step, index) => (
                    <li key={step}><span className="incident-ai-step-num">{index + 1}</span>{step}</li>
                  ))}
                </ol>
              </section>

              <section className="incident-detail-callout incident-detail-callout--secretary">
                <h3>Encoded by Secretary</h3>
                <strong>{detail.encodedBy}</strong>
              </section>

              <section className="incident-detail-callout incident-detail-callout--assignment">
                <h3>Assignment</h3>
                {detail.assignedTo ? (
                  <>
                    <strong>{detail.assignedTo}</strong>
                    <p>Assigned by: {detail.assignedBy}</p>
                    {detail.assignedAt && <p>Assigned at: {detail.assignedAt}</p>}
                    {detail.actionStarted && <p>Action started: {detail.actionStarted}</p>}
                    {detail.resolvedAt && <p className="is-resolved">Resolved: {detail.resolvedAt}</p>}
                  </>
                ) : (
                  <p className="incident-detail-unassigned">Not yet assigned. Awaiting review by the secretary.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )
    })()}
  </div>
}

export default Incidents
