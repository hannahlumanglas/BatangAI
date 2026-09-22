import { useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import {
  getAuthSession,
  getProfilePhotoUrl,
} from '../../auth'
import './Dashboard.css'
import './GenerateReports.css'
import { API_BASE_URL } from '../../apiConfig'

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
  | 'download'
  | 'check'
  | 'alert'
  | 'assign'

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
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.7 2.7L16.5 9" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 17h.01" />
      </>
    ),
    assign: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" />
        <path d="M18 8v6M15 11h6" />
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

const navigation: { label: string; icon: IconName; path: string }[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { label: 'All Incidents', icon: 'incidents', path: '/admin/incidents' },
  { label: 'Manage & Assign', icon: 'assign', path: '/admin/manage-assign' },
  { label: 'Device Monitoring', icon: 'devices', path: '/admin/device-monitoring' },
  { label: 'User Management', icon: 'users', path: '/admin/user-management' },
  { label: 'Generate Reports', icon: 'reports', path: '/admin/generate-reports' },
  { label: 'Profile', icon: 'profile', path: '/admin/profile' },
]

const reportTypes = [
  'All Incidents Report',
  'Resolved Incidents Report',
  'Pending Incidents Report',
  'Personnel Performance Report',
  'Department Incident History Report',
]

const months = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const years = ['2026', '2025', '2024', '2023']

const MONTH_TO_INDEX = new Map(
  months.slice(1).map((monthName, index) => [monthName, index + 1]),
)

type Incident = {
  incidentID?: string | number
  id?: string | number

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
  resolvedAt?: string | null
  resolvedBy?: string | null
  severity?: string | null
  status?: string | null
  summary?: string | null
  troubleshooting?: string | null

  userId?: string | number | null

  assigned?: string | number | null
  assignedAt?: string | null
  assignedTo?: string | number | null
  assignedToName?: string | null

  durationMinutes?: string | number | null

  resolutionNotes?: string | null
  startedAt?: string | null
}

type BuiltReport = {
  headers: string[]
  rows: (string | number)[][]
  filename: string
}

function escapeCSVCell(value: string | number | null | undefined): string {
  const text = String(value ?? '')

  return /[",\n]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text
}

function toCSV(
  headers: string[],
  rows: (string | number)[][],
): string {
  return [headers, ...rows]
    .map(row => row.map(escapeCSVCell).join(','))
    .join('\n')
}

function normalizeStatus(status: string | null | undefined): string {
  return String(status ?? '').trim().toLowerCase()
}

function formatDate(value: string | null | undefined): string {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDateParts(value: string | null | undefined): {
  year: number
  month: number
} | null {
  if (!value) return null

  const date = new Date(value)

  if (!Number.isNaN(date.getTime())) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    }
  }

  const match = String(value).match(/^(\d{4})-(\d{1,2})/)

  if (!match) return null

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  }
}

function matchesPeriod(
  dateValue: string | null | undefined,
  month: string,
  year: string,
): boolean {
  const parts = getDateParts(dateValue)

  if (!parts) return false

  if (String(parts.year) !== year) {
    return false
  }

  if (month === 'All Months') {
    return true
  }

  return parts.month === MONTH_TO_INDEX.get(month)
}

function getIncidentDate(incident: Incident): string | null {
  return incident.createdAt ?? null
}

function getIncidentId(incident: Incident): string {
  return String(incident.incidentID ?? incident.id ?? '')
}

function getEmployeeName(incident: Incident): string {
  return String(
    incident.employeeName ??
      incident.userId ??
      'Unknown Employee',
  )
}

function getDepartment(incident: Incident): string {
  return String(incident.department ?? 'Unspecified')
}

function getAssignedPersonnel(incident: Incident): string {
  return String(
    incident.assignedToName ??
      incident.assignedTo ??
      'Unassigned',
  )
}

function getDuration(incident: Incident): number {
  const value = Number(incident.durationMinutes)

  if (!Number.isNaN(value) && value >= 0) {
    return value
  }

  if (incident.startedAt && incident.resolvedAt) {
    const started = new Date(incident.startedAt)
    const resolved = new Date(incident.resolvedAt)

    if (!Number.isNaN(started.getTime()) && !Number.isNaN(resolved.getTime())) {
      return Math.max(
        0,
        Math.round(
          (resolved.getTime() - started.getTime()) / 60000,
        ),
      )
    }
  }

  return 0
}

function buildReport(
  reportType: string,
  incidents: Incident[],
  month: string,
  year: string,
): BuiltReport {
  const periodLabel = (
    month === 'All Months'
      ? year
      : `${month}-${year}`
  )
    .replace(/\s+/g, '-')
    .toLowerCase()

  const slug = reportType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const periodIncidents = incidents.filter(incident =>
    matchesPeriod(
      getIncidentDate(incident),
      month,
      year,
    ),
  )

  if (reportType === 'Resolved Incidents Report') {
    const resolved = periodIncidents.filter(
      incident =>
        normalizeStatus(incident.status) === 'resolved',
    )

    return {
      headers: [
        'Incident ID',
        'Employee',
        'Department',
        'Issue Category',
        'Severity',
        'Assigned IT Personnel',
        'Created At',
        'Resolved At',
        'Duration (Minutes)',
        'Resolution Notes',
      ],
      rows: resolved.map(incident => [
        getIncidentId(incident),
        getEmployeeName(incident),
        getDepartment(incident),
        incident.issueCategory ?? incident.affectedIssue ?? '',
        incident.severity ?? '',
        getAssignedPersonnel(incident),
        formatDate(incident.createdAt),
        formatDate(incident.resolvedAt),
        getDuration(incident),
        incident.resolutionNotes ?? '',
      ]),
      filename: `${slug}-${periodLabel}.csv`,
    }
  }

  if (reportType === 'Pending Incidents Report') {
    const pending = periodIncidents.filter(
      incident =>
        normalizeStatus(incident.status) === 'pending',
    )

    return {
      headers: [
        'Incident ID',
        'Employee',
        'Department',
        'Issue Category',
        'Severity',
        'Status',
        'Assigned IT Personnel',
        'Created At',
        'Description',
      ],
      rows: pending.map(incident => [
        getIncidentId(incident),
        getEmployeeName(incident),
        getDepartment(incident),
        incident.issueCategory ?? incident.affectedIssue ?? '',
        incident.severity ?? '',
        incident.status ?? 'Pending',
        getAssignedPersonnel(incident),
        formatDate(incident.createdAt),
        incident.description ?? incident.summary ?? '',
      ]),
      filename: `${slug}-${periodLabel}.csv`,
    }
  }

  if (reportType === 'Personnel Performance Report') {
    const personnelMap = new Map<
      string,
      {
        assigned: number
        resolved: number
        totalDuration: number
      }
    >()

    periodIncidents.forEach(incident => {
      const personnel = getAssignedPersonnel(incident)

      if (
        !personnel ||
        personnel.toLowerCase() === 'unassigned'
      ) {
        return
      }

      const current = personnelMap.get(personnel) ?? {
        assigned: 0,
        resolved: 0,
        totalDuration: 0,
      }

      current.assigned += 1

      if (
        normalizeStatus(incident.status) === 'resolved'
      ) {
        current.resolved += 1
        current.totalDuration += getDuration(incident)
      }

      personnelMap.set(personnel, current)
    })

    const rows = Array.from(personnelMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([personnel, data]) => [
        personnel,
        data.assigned,
        data.resolved,
        data.assigned > 0
          ? Math.round(
              (data.resolved / data.assigned) * 100,
            )
          : 0,
        data.resolved > 0
          ? Math.round(
              data.totalDuration / data.resolved,
            )
          : 0,
      ])

    return {
      headers: [
        'IT Personnel',
        'Assigned Incidents',
        'Resolved Incidents',
        'Resolution Rate (%)',
        'Average Resolution Time (Minutes)',
      ],
      rows,
      filename: `${slug}-${periodLabel}.csv`,
    }
  }

  if (
    reportType ===
    'Department Incident History Report'
  ) {
    const departmentMap = new Map<
      string,
      {
        total: number
        pending: number
        inProgress: number
        resolved: number
      }
    >()

    periodIncidents.forEach(incident => {
      const department = getDepartment(incident)

      const current = departmentMap.get(department) ?? {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
      }

      current.total += 1

      const status = normalizeStatus(
        incident.status,
      )

      if (status === 'pending') {
        current.pending += 1
      }

      if (
        status === 'in progress' ||
        status === 'in-progress'
      ) {
        current.inProgress += 1
      }

      if (status === 'resolved') {
        current.resolved += 1
      }

      departmentMap.set(department, current)
    })

    const rows = Array.from(
      departmentMap.entries(),
    )
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([department, data]) => [
        department,
        data.total,
        data.pending,
        data.inProgress,
        data.resolved,
      ])

    return {
      headers: [
        'Department',
        'Total Incidents',
        'Pending',
        'In Progress',
        'Resolved',
      ],
      rows,
      filename: `${slug}-${periodLabel}.csv`,
    }
  }

  return {
    headers: [
      'Incident ID',
      'Employee',
      'Department',
      'Issue Category',
      'Severity',
      'Status',
      'Assigned IT Personnel',
      'Created At',
      'Resolved At',
      'Duration (Minutes)',
    ],
    rows: periodIncidents.map(incident => [
      getIncidentId(incident),
      getEmployeeName(incident),
      getDepartment(incident),
      incident.issueCategory ??
        incident.affectedIssue ??
        '',
      incident.severity ?? '',
      incident.status ?? '',
      getAssignedPersonnel(incident),
      formatDate(incident.createdAt),
      formatDate(incident.resolvedAt),
      getDuration(incident),
    ]),
    filename: `${slug}-${periodLabel}.csv`,
  }
}

function downloadCSV(
  filename: string,
  csvContent: string,
) {
  const blob = new Blob(
    [`\uFEFF${csvContent}`],
    {
      type: 'text/csv;charset=utf-8;',
    },
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/* ---------- Theme ---------- */

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'batangai-theme'

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(
    THEME_STORAGE_KEY,
  )

  if (
    stored === 'light' ||
    stored === 'dark'
  ) {
    return stored
  }

  return 'light'
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    readStoredTheme,
  )

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme,
    )

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    )
  }, [theme])

  const toggleTheme = () =>
    setTheme(current =>
      current === 'dark'
        ? 'light'
        : 'dark',
    )

  return {
    theme,
    toggleTheme,
  }
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
        isDark
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      }
      aria-pressed={isDark}
      title={
        isDark
          ? 'Switch to light mode'
          : 'Switch to dark mode'
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

function ProfileMenu({
  name,
  role,
  avatar,
  onLogout,
}: {
  name: string
  role: string
  avatar?: string
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (
      e: globalThis.MouseEvent,
    ) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          e.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (
      e: globalThis.KeyboardEvent,
    ) => {
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
    navigate('/admin/profile')
  }

  return (
    <div
      className="profile-menu-root"
      ref={rootRef}
    >
      <button
        type="button"
        className="topbar-user profile-menu-trigger"
        onClick={() =>
          setOpen(current => !current)
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="topbar-avatar">
          {avatar ? (
            <img
              src={avatar}
              alt=""
            />
          ) : (
            name
              .split(/\s+/)
              .map(part => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          )}
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
            onClick={() =>
              navigate('/admin/settings')
            }
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

function GenerateReports() {
  const navigate = useNavigate()

  const session = getAuthSession()
  const currentUser = session?.user
  const currentUserName =
    currentUser?.fullName ||
    'Administrator'
  const currentUserRole =
    currentUser?.role ||
    'Administrator'
  const currentUserId = currentUser?.userID

  const [profileAvatar, setProfileAvatar] =
    useState(() =>
      getProfilePhotoUrl(
        currentUser?.profilePhoto,
        currentUser?.fullName,
        currentUser?.role,
      ),
    )

  const { theme, toggleTheme } =
    useTheme()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const [reportType, setReportType] =
    useState(reportTypes[0])

  const [month, setMonth] =
    useState(months[0])

  const [year, setYear] =
    useState(years[0])

  const [incidents, setIncidents] =
    useState<Incident[]>([])

  const [loading, setLoading] =
    useState(true)

  const [generating, setGenerating] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [messageTone, setMessageTone] =
    useState<'success' | 'error'>('success')

  const [generatedReport, setGeneratedReport] =
    useState<BuiltReport | null>(null)

  const handleLogout = () => {
    localStorage.removeItem(
      'batangai-admin-auth',
    )

    navigate('/')
  }

  useEffect(() => {
    const updateProfilePhoto = () => {
      const updatedSession =
        getAuthSession()

      const updatedUser =
        updatedSession?.user

      if (!updatedUser) {
        return
      }

      setProfileAvatar(
        getProfilePhotoUrl(
          updatedUser.profilePhoto,
          updatedUser.fullName,
          updatedUser.role,
        ),
      )
    }

    window.addEventListener(
      'batangai-auth-updated',
      updateProfilePhoto,
    )

    return () => {
      window.removeEventListener(
        'batangai-auth-updated',
        updateProfilePhoto,
      )
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadIncidents = async () => {
      try {
        setLoading(true)
        setMessage('')

        if (
          currentUserId === undefined ||
          currentUserId === null ||
          String(currentUserId).trim() === ''
        ) {
          throw new Error(
            'Your session is missing an account ID. Please log in again.',
          )
        }

        const incidentsUrl = new URL(
          `${API_BASE_URL}/get_incidents.php`,
        )
        incidentsUrl.searchParams.set(
          'userID',
          String(currentUserId),
        )

        const response = await fetch(
          incidentsUrl,
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              'Unable to load incident records.',
          )
        }

        if (active) {
          setIncidents(
            Array.isArray(data.incidents)
              ? data.incidents
              : [],
          )
        }
      } catch (error) {
        if (!active) return

        setIncidents([])
        setMessageTone('error')
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load incident records.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadIncidents()

    return () => {
      active = false
    }
  }, [currentUserId])

  const handleGenerate = () => {
    if (loading) {
      return
    }

    setGenerating(true)
    setMessage('')
    setGeneratedReport(null)

    try {
      const report = buildReport(
        reportType,
        incidents,
        month,
        year,
      )

      if (report.rows.length === 0) {
        setMessageTone('error')

        setMessage(
          `No records found for ${reportType.toLowerCase()}${
            month === 'All Months'
              ? ''
              : ` in ${month}`
          } ${year}.`,
        )

        return
      }

      setGeneratedReport(report)
      setMessageTone('success')

      setMessage(
        `${report.filename} is ready to preview. Click Download Report when you are ready to save it.`,
      )
    } catch (error) {
      setMessageTone('error')

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to generate the report.',
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedReport) {
      return
    }

    downloadCSV(
      generatedReport.filename,
      toCSV(
        generatedReport.headers,
        generatedReport.rows,
      ),
    )

    setMessageTone('success')
    setMessage(
      `${generatedReport.filename} downloaded — ${generatedReport.rows.length} record${
        generatedReport.rows.length === 1
          ? ''
          : 's'
      }.`,
    )
  }

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
          aria-label="Administrator navigation"
        >
          {navigation.map(item => (
            <button
              className={
                item.label ===
                'Generate Reports'
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
              setSidebarCollapsed(
                current => !current,
              )
            }
          >
            <Icon name="menu" />
          </button>

          <div className="topbar-title">
            <h1>Generate Reports</h1>
            <p>
              Generate incident reports from
              actual system records by type and
              period.
            </p>
          </div>

          <ThemeToggle
            theme={theme}
            onToggle={toggleTheme}
          />

          <AdminNotifications />

          <ProfileMenu
            name={currentUserName}
            role={currentUserRole}
            avatar={profileAvatar}
            onLogout={handleLogout}
          />
        </header>

        <div className="dashboard-content">
          <article className="dashboard-card gr-card">
            <h2>
              <Icon name="reports" />
              Report Configuration
            </h2>

            <div className="gr-grid">
              <label>
                Report Type
                <select
                  value={reportType}
                  onChange={e =>
                    setReportType(
                      e.target.value,
                    )
                  }
                  disabled={
                    loading || generating
                  }
                >
                  {reportTypes.map(type => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Month (optional)
                <select
                  value={month}
                  onChange={e =>
                    setMonth(e.target.value)
                  }
                  disabled={
                    loading || generating
                  }
                >
                  {months.map(
                    monthName => (
                      <option
                        key={monthName}
                        value={monthName}
                      >
                        {monthName}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Year
                <select
                  value={year}
                  onChange={e =>
                    setYear(e.target.value)
                  }
                  disabled={
                    loading || generating
                  }
                >
                  {years.map(
                    yearValue => (
                      <option
                        key={yearValue}
                        value={yearValue}
                      >
                        {yearValue}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || generating}
              className="btn btn-primary gr-generate"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                borderRadius: '8px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              <Icon name="reports" />
              {loading
                ? 'Loading Incident Records...'
                : generating
                  ? 'Preparing Preview...'
                  : 'Generate Report'}
            </button>

            {message && (
              <p
                className={`gr-message${
                  messageTone ===
                  'error'
                    ? ' gr-message--error'
                    : ''
                }`}
              >
                <Icon
                  name={
                    messageTone ===
                    'error'
                      ? 'alert'
                      : 'check'
                  }
                />

                {message}
              </p>
            )}

            {!loading &&
              messageTone !==
                'error' &&
              incidents.length > 0 && (
                <p className="gr-message">
                  <Icon name="check" />
                  {incidents.length} incident
                  record
                  {incidents.length === 1
                    ? ''
                    : 's'}{' '}
                  loaded from the database.
                </p>
              )}
          </article>

          {generatedReport && (
            <article className="dashboard-card gr-card">
              <h2>
                <Icon name="reports" />
                Report Preview
              </h2>

              <p className="gr-message">
                Previewing {generatedReport.filename} — {generatedReport.rows.length} record{generatedReport.rows.length === 1 ? '' : 's'}.
              </p>

              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {generatedReport.headers.map(header => (
                        <th
                          key={header}
                          style={{
                            textAlign: 'left',
                            padding: '10px',
                            borderBottom: '1px solid var(--border-color, #ddd)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.rows.map((row, rowIndex) => (
                      <tr key={`${generatedReport.filename}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${generatedReport.filename}-${rowIndex}-${cellIndex}`}
                            style={{
                              padding: '10px',
                              borderBottom: '1px solid var(--border-color, #eee)',
                              verticalAlign: 'top',
                            }}
                          >
                            {String(cell ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                className="incident-new gr-generate"
                type="button"
                onClick={handleDownload}
                style={{ marginTop: '16px' }}
              >
                <Icon name="download" />
                Download Report
              </button>
            </article>
          )}
        </div>
      </main>
    </div>
  )
}

export default GenerateReports
