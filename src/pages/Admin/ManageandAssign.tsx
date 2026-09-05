import { useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { PersonName } from '../../components/PersonName'
import { AdminNotifications } from './AdminNotifications'
import {
  getCurrentUserId,
  getCurrentUserName,
  getCurrentUserRole,
  signOut,
} from '../../auth'
import './Dashboard.css'
import './ManageandAssign.css'

type IconName =
  | 'dashboard'
  | 'incidents'
  | 'devices'
  | 'users'
  | 'reports'
  | 'profile'
  | 'logout'
  | 'menu'
  | 'bell'
  | 'search'
  | 'eye'
  | 'assign'
  | 'close'
  | 'phone'
  | 'mail'
  | 'sparkle'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),

    incidents: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" />
      </>
    ),

    devices: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="1.5" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2" />
        <path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" />
      </>
    ),

    reports: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),

    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" />
      </>
    ),

    logout: (
      <>
        <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),

    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),

    bell: (
      <>
        <path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" />
      </>
    ),

    search: (
      <>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4 4" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),

    assign: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" />
        <path d="M18 8v6M15 11h6" />
      </>
    ),

    close: <path d="M6 6l12 12M18 6 6 18" />,

    phone: (
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" />
    ),

    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 6 8 7 8-7" />
      </>
    ),

    sparkle: (
      <>
        <path d="M12 3.5c.5 2.6 1.3 4.4 2.5 5.6 1.2 1.2 3 2 5.6 2.5-2.6.5-4.4 1.3-5.6 2.5-1.2 1.2-2 3-2.5 5.6-.5-2.6-1.3-4.4-2.5-5.6-1.2-1.2-3-2-5.6-2.5 2.6-.5 4.4-1.3 5.6-2.5 1.2-1.2 2-3 2.5-5.6Z" />
      </>
    ),
  }

  return (
    <svg
      className="admin-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const navigation: {
  label: string
  icon: IconName
  path: string
}[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  {
    label: 'All Incidents',
    icon: 'incidents',
    path: '/admin/incidents',
  },
  {
    label: 'Manage & Assign',
    icon: 'assign',
    path: '/admin/manage-assign',
  },
  {
    label: 'Device Monitoring',
    icon: 'devices',
    path: '/admin/device-monitoring',
  },
  {
    label: 'User Management',
    icon: 'users',
    path: '/admin/user-management',
  },
  {
    label: 'Generate Reports',
    icon: 'reports',
    path: '/admin/generate-reports',
  },
  {
    label: 'Profile',
    icon: 'profile',
    path: '/admin/profile',
  },
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
  assignedToUserId: string | null
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

type Personnel = {
  userID: number | string
  employeeId: string
  fullName: string
  email: string
  department: string
  role: string
  status: string
}

type ApiIncident = {
  incidentID: string
  affectedIssue?: string | null
  classification?: string | null
  connectionType?: string | null
  createdAt?: string | null
  department?: string | null
  description?: string | null
  deviceType?: string | null
  employeeName?: string | null
  issueCategory?: string | null
  location?: string | null
  severity?: string | null
  status?: string | null
  summary?: string | null
  troubleshooting?: string | null
  userId?: number | string | null
  assigned?: string | null
  assignedAt?: string | null
  assignedTo?: number | string | null
  assignedToName?: string | null
  durationMinutes?: number | string | null
  employeeId?: string | null
  reporterEmail?: string | null
  encodedBy?: string | null
}

const statusTagClass: Record<Status, string> = {
  Pending: 'pending-tag',
  'In Progress': 'progress-tag',
  Resolved: 'resolved-tag',
}

const severityTagClass: Record<Severity, string> = {
  High: 'high-tag',
  Medium: 'medium-tag',
  Low: 'low-tag',
}

/* ---------- Theme ---------- */

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'batangai-theme'

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return 'light'
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(current =>
      current === 'dark' ? 'light' : 'dark',
    )
  }

  return { theme, toggleTheme }
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme
  onToggle: () => void
}) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle-button"
      onClick={onToggle}
      aria-label={
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      }
      aria-pressed={isDark}
      title={
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      }
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
        </svg>
      )}
    </button>
  )
}

/* ---------- Profile Menu ---------- */

function ProfileMenu({
  name,
  role,
  avatarInitial,
  onLogout,
  profilePath = '/admin/profile',
}: {
  name: string
  role: string
  avatarInitial: string
  onLogout: () => void
  profilePath?: string
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    )

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      )

      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [open])

  const goToProfile = () => {
    setOpen(false)
    navigate(profilePath)
  }

  return (
    <div className="profile-menu-root" ref={rootRef}>
      <button
        type="button"
        className="topbar-user profile-menu-trigger"
        onClick={() => setOpen(current => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="topbar-avatar">
          {avatarInitial}
        </div>

        <div>
          <strong>{name}</strong>
          <span>{role}</span>
        </div>

        <span
          className={`profile-menu-chevron${
            open ? ' open' : ''
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="profile-menu-dropdown"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={goToProfile}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" />
            </svg>
            My Profile
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={goToProfile}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" />
            </svg>
            Settings
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={goToProfile}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="2"
              />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Change Password
          </button>

          <span className="profile-menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- Helpers ---------- */

function parseTroubleshooting(
  value: string | null | undefined,
): string[] {
  if (!value) {
    return ['No troubleshooting steps recorded.']
  }

  try {
    const parsed = JSON.parse(value)

    if (Array.isArray(parsed)) {
      const steps = parsed
        .map(item => String(item).trim())
        .filter(Boolean)

      if (steps.length > 0) {
        return steps
      }
    }
  } catch {
    // Not JSON. Continue with normal text parsing.
  }

  const steps = value
    .split(/\r?\n/)
    .map(step =>
      step
        .replace(/^\s*(\d+[\.\)]|-|\*)\s*/, '')
        .trim(),
    )
    .filter(Boolean)

  return steps.length > 0
    ? steps
    : ['No troubleshooting steps recorded.']
}

function formatDateTime(
  createdAt: string | null | undefined,
) {
  if (!createdAt) {
    return {
      date: '—',
      time: '—',
    }
  }

  const parsed = new Date(
    createdAt.replace(' ', 'T'),
  )

  if (Number.isNaN(parsed.getTime())) {
    return {
      date: createdAt,
      time: '',
    }
  }

  return {
    date: parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  }
}

function mapSeverity(value: string | null | undefined): Severity {
  if (value === 'High') return 'High'
  if (value === 'Medium') return 'Medium'
  return 'Low'
}

function mapStatus(value: string | null | undefined): Status {
  if (value === 'In Progress') {
    return 'In Progress'
  }

  if (value === 'Resolved') {
    return 'Resolved'
  }

  return 'Pending'
}

function mapIncident(item: ApiIncident): Incident {
  const dateTime = formatDateTime(item.createdAt)

  const duration =
    item.durationMinutes !== null &&
    item.durationMinutes !== undefined &&
    String(item.durationMinutes).trim() !== ''
      ? `~${item.durationMinutes} minutes`
      : 'Not available'

  return {
    id: item.incidentID,
    reporter: item.employeeName || 'Unknown Reporter',
    department: item.department || '—',
    severity: mapSeverity(item.severity),
    status: mapStatus(item.status),

    assignedTo:
      item.assignedToName &&
      item.assignedToName.trim() !== ''
        ? item.assignedToName
        : null,

    assignedToUserId:
      item.assignedTo !== null &&
      item.assignedTo !== undefined
        ? String(item.assignedTo)
        : null,

    date: dateTime.date,
    time: dateTime.time,

    employeeId: item.employeeId || '—',
    location: item.location || '—',
    deviceType: item.deviceType || '—',
    connection: item.connectionType || '—',

    channel: 'Web Form',

    encodedBy:
      item.encodedBy ||
      item.employeeName ||
      'Unknown',

    description:
      item.description ||
      item.affectedIssue ||
      'No description provided.',

    aiClassification:
      item.classification ||
      item.issueCategory ||
      'Not classified',

    aiDuration: duration,

    aiSummary:
      item.summary ||
      'No AI summary available.',

    aiSteps: parseTroubleshooting(
      item.troubleshooting,
    ),
  }
}

/* ---------- Main Component ---------- */

function ManageAndAssign({
  audience = 'administrator',
}: {
  audience?: 'administrator' | 'secretary' | 'it'
}) {
  const navigate = useNavigate()

  const isSecretary = audience === 'secretary'
  const isIT = audience === 'it'

  const roleNavigation = isSecretary
    ? navigation
        .filter(item =>
          [
            'All Incidents',
            'Manage & Assign',
            'Profile',
          ].includes(item.label),
        )
        .map(item => ({
          ...item,
          path: item.path.replace(
            '/admin',
            '/secretary',
          ),
        }))
    : isIT
      ? navigation
          .filter(item =>
            [
              'All Incidents',
              'Manage & Assign',
              'Device Monitoring',
              'Profile',
            ].includes(item.label),
          )
          .map(item => ({
            ...item,
            label:
              item.label === 'Manage & Assign'
                ? 'My Assignments'
                : item.label,
            path:
              item.label === 'Manage & Assign'
                ? '/it/my-assignments'
                : item.path.replace('/admin', '/it'),
          }))
      : navigation

  /* ---------- Authenticated user ---------- */

  const currentUserName = getCurrentUserName()

  const currentUserRole =
    getCurrentUserRole() ??
    (isSecretary
      ? 'Secretary'
      : isIT
        ? 'IT Personnel'
        : 'Administrator')

  const profilePath = isSecretary
    ? '/secretary/profile'
    : isIT
      ? '/it/profile'
      : '/admin/profile'

  const user = {
    name: currentUserName,
    role: currentUserRole,
    initial:
      currentUserName
        .split(/\s+/)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U',
    profilePath,
  }

  const currentUserId = getCurrentUserId()

  /* ---------- UI State ---------- */

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const { theme, toggleTheme } = useTheme()

  const [incidents, setIncidents] =
    useState<Incident[]>([])

  const [itPersonnel, setItPersonnel] =
    useState<Personnel[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState<'All Statuses' | Status>(
      'All Statuses',
    )

  const [assigningId, setAssigningId] =
    useState<string | null>(null)

  const [selectedPersonnelId, setSelectedPersonnelId] =
    useState('')

  const [viewingId, setViewingId] =
    useState<string | null>(null)

  const [selectedSeverity, setSelectedSeverity] =
    useState<Severity | ''>('')

  const [detailsExpanded, setDetailsExpanded] =
    useState(false)

  const [analysisExpanded, setAnalysisExpanded] =
    useState(false)

  const [savingAssignment, setSavingAssignment] =
    useState(false)

  const [savingSeverity, setSavingSeverity] =
    useState(false)

  /* ---------- Load Database Data ---------- */

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [
        incidentsResponse,
        personnelResponse,
      ] = await Promise.all([
        fetch(
          'http://localhost/BatangAI/api/incidents.php',
        ),

        fetch(
          'http://localhost/BatangAI/api/it_personnel.php',
        ),
      ])

      if (!incidentsResponse.ok) {
        throw new Error(
          'Unable to retrieve incidents from the server.',
        )
      }

      if (!personnelResponse.ok) {
        throw new Error(
          'Unable to retrieve IT Personnel from the server.',
        )
      }

      const incidentsData =
        await incidentsResponse.json()

      const personnelData =
        await personnelResponse.json()

      if (!incidentsData.success) {
        throw new Error(
          incidentsData.message ||
            'Failed to load incidents.',
        )
      }

      if (!personnelData.success) {
        throw new Error(
          personnelData.message ||
            'Failed to load IT Personnel.',
        )
      }

      const apiIncidents =
        Array.isArray(incidentsData.incidents)
          ? incidentsData.incidents
          : []

      const apiPersonnel =
        Array.isArray(personnelData.personnel)
          ? personnelData.personnel
          : []

      setIncidents(
        apiIncidents.map(mapIncident),
      )

      setItPersonnel(apiPersonnel)
    } catch (err) {
      console.error(
        'Manage & Assign loading error:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server.',
      )

      setIncidents([])
      setItPersonnel([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  /* ---------- Logout ---------- */

  const handleLogout = () => {
    signOut()
    navigate('/')
  }

  /* ---------- IT Personnel View ---------- */

  const visibleIncidents = isIT
    ? incidents.filter(
        incident =>
          incident.assignedToUserId !== null &&
          currentUserId !== null &&
          String(
            incident.assignedToUserId,
          ) === String(currentUserId),
      )
    : incidents

  /* ---------- Statistics ---------- */

  const pendingCount = visibleIncidents.filter(
    i => i.status === 'Pending',
  ).length

  const inProgressCount =
    visibleIncidents.filter(
      i => i.status === 'In Progress',
    ).length

  const resolvedCount = visibleIncidents.filter(
    i => i.status === 'Resolved',
  ).length

  /* ---------- Search ---------- */

  const filtered = visibleIncidents.filter(i => {
    const matchesStatus =
      statusFilter === 'All Statuses' ||
      i.status === statusFilter

    const q = search.trim().toLowerCase()

    const matchesSearch =
      q === '' ||
      i.id.toLowerCase().includes(q) ||
      i.reporter.toLowerCase().includes(q) ||
      i.department.toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })

  /* ---------- Assignment ---------- */

  const openAssign = (id: string) => {
    setViewingId(null)
    setAssigningId(id)

    const incident = incidents.find(
      i => i.id === id,
    )

    const existingAssignedId =
      incident?.assignedToUserId

    if (
      existingAssignedId &&
      itPersonnel.some(
        person =>
          String(person.userID) ===
          String(existingAssignedId),
      )
    ) {
      setSelectedPersonnelId(
        String(existingAssignedId),
      )
    } else {
      setSelectedPersonnelId(
        itPersonnel.length > 0
          ? String(itPersonnel[0].userID)
          : '',
      )
    }
  }

  const closeAssign = () => {
    if (savingAssignment) return

    setAssigningId(null)
    setSelectedPersonnelId('')
  }

  const confirmAssign = async () => {
    if (!assigningId) return

    const selectedPersonnel =
      itPersonnel.find(
        person =>
          String(person.userID) ===
          String(selectedPersonnelId),
      )

    if (!selectedPersonnel) {
      setError(
        'Please select an IT Personnel.',
      )
      return
    }

    setSavingAssignment(true)
    setError('')

    try {
      const response = await fetch(
        'http://localhost/BatangAI/api/assign_incident.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incidentID: assigningId,
            assignedTo: selectedPersonnel.userID,
            assignedToName:
              selectedPersonnel.fullName,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to assign the incident.',
        )
      }

      setIncidents(current =>
        current.map(incident =>
          incident.id === assigningId
            ? {
                ...incident,
                assignedTo:
                  selectedPersonnel.fullName,
                assignedToUserId:
                  String(
                    selectedPersonnel.userID,
                  ),
                status:
                  incident.status === 'Pending'
                    ? 'In Progress'
                    : incident.status,
              }
            : incident,
        ),
      )

      setAssigningId(null)
      setSelectedPersonnelId('')
    } catch (err) {
      console.error(
        'Assignment error:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to assign incident.',
      )
    } finally {
      setSavingAssignment(false)
    }
  }

  /* ---------- View Incident ---------- */

  const openView = (id: string) => {
    const incident = incidents.find(
      i => i.id === id,
    )

    setSelectedSeverity(
      incident?.severity ?? '',
    )

    setDetailsExpanded(false)
    setAnalysisExpanded(false)
    setViewingId(id)
  }

  const closeView = () => {
    if (savingSeverity) return

    setViewingId(null)
    setDetailsExpanded(false)
    setAnalysisExpanded(false)
  }

  const viewingIncident =
    incidents.find(
      i => i.id === viewingId,
    ) ?? null

  /* ---------- Severity ---------- */

  const updateSeverity = async (
    id: string,
    severity: Severity,
  ) => {
    setSavingSeverity(true)
    setError('')

    try {
      const response = await fetch(
        'http://localhost/BatangAI/api/update_incident.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incidentID: id,
            severity,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to update severity.',
        )
      }

      setIncidents(current =>
        current.map(incident =>
          incident.id === id
            ? {
                ...incident,
                severity,
              }
            : incident,
        ),
      )

      setSelectedSeverity(severity)
    } catch (err) {
      console.error(
        'Severity update error:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update severity.',
      )
    } finally {
      setSavingSeverity(false)
    }
  }

  /* ---------- Render ---------- */

  return (
    <div
      className={`admin-shell${
        sidebarCollapsed
          ? ' sidebar-collapsed'
          : ''
      }`}
    >
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img
            src={logo}
            alt="Batangas City seal"
          />

          <strong>
            Batang<span>AI</span>
          </strong>
        </div>

        <nav
          className="sidebar-nav"
          aria-label={`${user.role} navigation`}
        >
          {roleNavigation.map(item => (
            <button
              className={
                item.label ===
                  'Manage & Assign' ||
                (isIT &&
                  item.label ===
                    'My Assignments')
                  ? 'is-active'
                  : ''
              }
              key={item.label}
              type="button"
              onClick={() =>
                navigate(item.path)
              }
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="menu-button"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={!sidebarCollapsed}
            onClick={() =>
              setSidebarCollapsed(c => !c)
            }
          >
            <Icon name="menu" />
          </button>

          <div className="topbar-title">
            <h1>
              {isIT
                ? 'My Assignments'
                : 'Manage & Assign Incidents'}
            </h1>

            <p>
              {isIT
                ? 'View and manage the incident reports assigned to you.'
                : 'View all encoded incidents and assign IT personnel to unresolved reports.'}
            </p>
          </div>

          <ThemeToggle
            theme={theme}
            onToggle={toggleTheme}
          />

          <AdminNotifications />

          <ProfileMenu
            name={user.name}
            role={user.role}
            avatarInitial={user.initial}
            profilePath={user.profilePath}
            onLogout={handleLogout}
          />
        </header>

        <div className="dashboard-content">
          {/* Error */}

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#991b1b',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Statistics */}

          <section className="maa-stats">
            <article className="maa-stat maa-stat--pending">
              <i>◷</i>

              <div>
                <span>Pending</span>
                <strong>
                  {pendingCount}
                </strong>
              </div>
            </article>

            <article className="maa-stat maa-stat--progress">
              <i>⟳</i>

              <div>
                <span>In Progress</span>
                <strong>
                  {inProgressCount}
                </strong>
              </div>
            </article>

            <article className="maa-stat maa-stat--resolved">
              <i>✓</i>

              <div>
                <span>Resolved</span>
                <strong>
                  {resolvedCount}
                </strong>
              </div>
            </article>
          </section>

          {/* Toolbar */}

          <div className="maa-toolbar-card">
            <label className="maa-search">
              <Icon name="search" />

              <input
                type="text"
                placeholder="Search incidents..."
                value={search}
                onChange={e =>
                  setSearch(e.target.value)
                }
              />
            </label>

            <label className="maa-status-filter">
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(
                    e.target.value as
                      | 'All Statuses'
                      | Status,
                  )
                }
              >
                <option>
                  All Statuses
                </option>

                <option>
                  Pending
                </option>

                <option>
                  In Progress
                </option>

                <option>
                  Resolved
                </option>
              </select>
            </label>
          </div>

          {/* Incident Table */}

          <article className="dashboard-card maa-table-card">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Reporter</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="maa-empty"
                    >
                      Loading incidents...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filtered.map(i => (
                      <tr key={i.id}>
                        <td>{i.id}</td>

                        <td>
                          <strong>
                            <PersonName
                              name={i.reporter}
                              compact
                            />
                          </strong>

                          <small>
                            {i.department}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`tag ${
                              severityTagClass[
                                i.severity
                              ]
                            }`}
                          >
                            {i.severity}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`tag ${
                              statusTagClass[
                                i.status
                              ]
                            }`}
                          >
                            {i.status}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              i.assignedTo
                                ? 'maa-assigned'
                                : 'maa-unassigned'
                            }
                          >
                            {i.assignedTo ? (
                              <PersonName
                                name={
                                  i.assignedTo
                                }
                                compact
                              />
                            ) : (
                              'Unassigned'
                            )}
                          </span>
                        </td>

                        <td>
                          {i.date}
                          <br />
                          <small>
                            {i.time}
                          </small>
                        </td>

                        <td>
                          <div className="maa-actions">
                            <button
                              type="button"
                              className="maa-view-btn"
                              aria-label={`View ${i.id}`}
                              onClick={() =>
                                openView(i.id)
                              }
                            >
                              <Icon name="eye" />
                            </button>

                            {!isIT && (
                              <button
                                type="button"
                                className="maa-assign-btn"
                                onClick={() =>
                                  openAssign(i.id)
                                }
                              >
                                <Icon name="assign" />

                                {i.assignedTo
                                  ? 'Reassign'
                                  : 'Assign'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="maa-empty"
                        >
                          No incidents match your
                          search or filter.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>

            <p className="maa-showing">
              Showing {filtered.length} of{' '}
              {visibleIncidents.length}{' '}
              incidents
            </p>
          </article>
        </div>
      </main>

      {/* ---------- Assignment Modal ---------- */}

      {assigningId && (
        <div
          className="maa-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeAssign}
        >
          <div
            className="maa-modal"
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div className="maa-modal-header">
              <h2>
                Assign IT Personnel
              </h2>

              <button
                type="button"
                className="maa-modal-close"
                aria-label="Close"
                onClick={closeAssign}
                disabled={savingAssignment}
              >
                <Icon name="close" />
              </button>
            </div>

            <p className="maa-modal-sub">
              Assigning incident{' '}
              <strong>
                {assigningId}
              </strong>
            </p>

            <label className="maa-modal-field">
              Personnel

              <select
                value={selectedPersonnelId}
                onChange={e =>
                  setSelectedPersonnelId(
                    e.target.value,
                  )
                }
                disabled={
                  savingAssignment ||
                  itPersonnel.length === 0
                }
              >
                {itPersonnel.length === 0 ? (
                  <option value="">
                    No IT Personnel available
                  </option>
                ) : (
                  itPersonnel.map(person => (
                    <option
                      key={String(
                        person.userID,
                      )}
                      value={String(
                        person.userID,
                      )}
                    >
                      {person.fullName}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div className="maa-modal-footer">
              <button
                type="button"
                className="maa-btn-secondary"
                onClick={closeAssign}
                disabled={savingAssignment}
              >
                Cancel
              </button>

              <button
                type="button"
                className="maa-btn-primary"
                onClick={() =>
                  void confirmAssign()
                }
                disabled={
                  savingAssignment ||
                  !selectedPersonnelId
                }
              >
                <Icon name="assign" />

                {savingAssignment
                  ? 'Assigning...'
                  : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- View Modal ---------- */}

      {viewingIncident && (
        <div
          className="maa-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeView}
        >
          <div
            className="maa-modal maa-modal--view"
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div className="maa-modal-header">
              <div>
                <h2>
                  {viewingIncident.id}
                </h2>

                <div className="maa-view-header-meta">
                  <span
                    className={`tag ${
                      severityTagClass[
                        viewingIncident
                          .severity
                      ]
                    }`}
                  >
                    {
                      viewingIncident.severity
                    }
                  </span>

                  <span className="maa-encoded-by">
                    Encoded by{' '}
                    <PersonName
                      name={
                        viewingIncident.encodedBy
                      }
                      compact
                    />
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="maa-modal-close"
                aria-label="Close"
                onClick={closeView}
                disabled={savingSeverity}
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="maa-view-divider" />

            {/* Severity */}

            <div className="maa-severity-control">
              <div>
                <span className="maa-severity-control-label">
                  Select Severity Level{' '}
                  <em>*</em>
                </span>

                <span className="maa-severity-hint">
                  Use highlights only to show
                  the selected priority.
                </span>
              </div>

              <div
                className="maa-severity-group"
                role="radiogroup"
                aria-label="Severity level"
                aria-required="true"
              >
                {(
                  [
                    'Low',
                    'Medium',
                    'High',
                  ] as Severity[]
                ).map(level => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={
                      selectedSeverity ===
                      level
                    }
                    className={`maa-severity-btn maa-severity-btn--${level.toLowerCase()}${
                      selectedSeverity ===
                      level
                        ? ' is-active'
                        : ''
                    }`}
                    disabled={
                      savingSeverity
                    }
                    onClick={() =>
                      void updateSeverity(
                        viewingIncident.id,
                        level,
                      )
                    }
                  >
                    <strong>
                      {level}
                    </strong>

                    <small>
                      priority
                    </small>
                  </button>
                ))}
              </div>
            </div>

            {/* Problem */}

            <div className="maa-problem-card">
              <p className="maa-problem-label">
                Problem Description
              </p>

              <p className="maa-problem-text">
                {
                  viewingIncident.description
                }
              </p>
            </div>

            {/* Incident Information */}

            <section className="maa-disclosure-section">
              <button
                type="button"
                className="maa-disclosure-button"
                aria-expanded={
                  detailsExpanded
                }
                aria-controls="incident-information"
                onClick={() =>
                  setDetailsExpanded(
                    current => !current,
                  )
                }
              >
                <span className="maa-disclosure-title">
                  <Icon name="eye" />
                  Incident information
                </span>

                <span className="maa-disclosure-action">
                  {detailsExpanded
                    ? 'Hide details'
                    : 'View details'}{' '}
                  <b>
                    {detailsExpanded
                      ? '−'
                      : '+'}
                  </b>
                </span>
              </button>

              {detailsExpanded && (
                <div
                  id="incident-information"
                  className="maa-disclosure-content"
                >
                  <div className="maa-info-grid">
                    <div className="maa-info-item">
                      <span>
                        Reporter
                      </span>

                      <strong>
                        <PersonName
                          name={
                            viewingIncident.reporter
                          }
                        />
                      </strong>
                    </div>

                    <div className="maa-info-item">
                      <span>
                        Employee ID
                      </span>

                      <strong>
                        {
                          viewingIncident.employeeId
                        }
                      </strong>
                    </div>

                    <div className="maa-info-item">
                      <span>
                        Department
                      </span>

                      <strong>
                        {
                          viewingIncident.department
                        }
                      </strong>
                    </div>

                    <div className="maa-info-item">
                      <span>
                        Location
                      </span>

                      <strong>
                        {
                          viewingIncident.location
                        }
                      </strong>
                    </div>

                    <div className="maa-info-item">
                      <span>
                        Device Type
                      </span>

                      <strong>
                        {
                          viewingIncident.deviceType
                        }
                      </strong>
                    </div>

                    <div className="maa-info-item">
                      <span>
                        Connection
                      </span>

                      <strong>
                        {
                          viewingIncident.connection
                        }
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* BatangAI Analysis */}

            <section className="maa-disclosure-section maa-disclosure-section--analysis">
              <button
                type="button"
                className="maa-disclosure-button"
                aria-expanded={
                  analysisExpanded
                }
                aria-controls="batangai-analysis"
                onClick={() =>
                  setAnalysisExpanded(
                    current => !current,
                  )
                }
              >
                <span className="maa-disclosure-title">
                  <Icon name="sparkle" />
                  BatangAI Analysis
                </span>

                <span className="maa-disclosure-action">
                  <small>
                    {
                      viewingIncident.aiDuration
                    }
                  </small>{' '}
                  {analysisExpanded
                    ? 'Hide analysis'
                    : 'View analysis'}{' '}
                  <b>
                    {analysisExpanded
                      ? '−'
                      : '+'}
                  </b>
                </span>
              </button>

              {analysisExpanded && (
                <div
                  id="batangai-analysis"
                  className="maa-ai-panel"
                >
                  <div className="maa-ai-panel-head">
                    <span className="maa-ai-panel-title">
                      Suggested diagnosis
                    </span>

                    <span className="maa-ai-duration">
                      {
                        viewingIncident.aiDuration
                      }
                    </span>
                  </div>

                  <p className="maa-ai-headline">
                    {
                      viewingIncident.aiClassification
                    }
                  </p>

                  <p className="maa-ai-summary">
                    {
                      viewingIncident.aiSummary
                    }
                  </p>

                  <ol className="maa-ai-steps">
                    {viewingIncident.aiSteps.map(
                      (step, index) => (
                        <li
                          key={`${viewingIncident.id}-${index}`}
                        >
                          <span className="maa-ai-step-num">
                            {index + 1}
                          </span>

                          {step}
                        </li>
                      ),
                    )}
                  </ol>
                </div>
              )}
            </section>

            {/* Assignment */}

            {!isIT && (
              <button
                type="button"
                className="maa-assign-full"
                onClick={() =>
                  openAssign(
                    viewingIncident.id,
                  )
                }
              >
                <Icon name="assign" />

                {viewingIncident.assignedTo
                  ? 'Reassign IT Personnel'
                  : 'Assign IT Personnel'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageAndAssign