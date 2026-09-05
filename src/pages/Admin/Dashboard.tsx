import { useState, useEffect, useRef, useMemo } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import {
  getAuthSession,
  getProfilePhotoUrl,
  signOut,
} from '../../auth'
import './Dashboard.css'

type IconName =
  | 'dashboard'
  | 'incidents'
  | 'devices'
  | 'users'
  | 'reports'
  | 'profile'
  | 'logout'
  | 'menu'
  | 'document'
  | 'resolved'
  | 'progress'
  | 'pending'
  | 'monitor'
  | 'search'
  | 'bell'
  | 'chart'
  | 'pie'
  | 'online'
  | 'warning'
  | 'offline'
  | 'arrow'
  | 'wrench'
  | 'robot'
  | 'sparkle'
  | 'trending'
  | 'assign'

function Icon({
  name,
}: {
  name: IconName
}) {
  const paths: Record<
    IconName,
    JSX.Element
  > = {
    dashboard: (
      <>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1"
        />
      </>
    ),

    incidents: (
      <>
        <rect
          x="5"
          y="4"
          width="14"
          height="17"
          rx="2"
        />
        <path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" />
      </>
    ),

    devices: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="1.5"
        />
        <path d="M8 21h8M12 17v4" />
      </>
    ),

    users: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />
        <circle
          cx="17"
          cy="9"
          r="2"
        />
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
        <circle
          cx="12"
          cy="8"
          r="4"
        />
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

    document: (
      <>
        <path d="M7 3h7l4 4v14H7zM14 3v5h5M10 12h5M10 16h5" />
      </>
    ),

    resolved: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m8 12 2.7 2.7L16.5 9" />
      </>
    ),

    progress: (
      <>
        <path d="M20 12a8 8 0 1 1-3-6.2" />
        <path d="M20 4v5h-5" />
      </>
    ),

    pending: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 7v5l3 2" />
      </>
    ),

    monitor: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="1.5"
        />
        <path d="M8 21h8M12 17v4" />
      </>
    ),

    search: (
      <>
        <circle
          cx="10.5"
          cy="10.5"
          r="5.5"
        />
        <path d="m15 15 4 4" />
      </>
    ),

    bell: (
      <>
        <path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" />
      </>
    ),

    chart: (
      <>
        <path d="M4 20V11M10 20V5M16 20v-8M22 20H2" />
      </>
    ),

    pie: (
      <>
        <path d="M12 3v9h9A9 9 0 0 0 12 3Z" />
        <path d="M10 5.2a8 8 0 1 0 8.8 8.8H10Z" />
      </>
    ),

    online: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m8 12 2.7 2.7L16.5 9" />
      </>
    ),

    warning: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 7v6M12 17h.01" />
      </>
    ),

    offline: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m9 9 6 6m0-6-6 6" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),

    wrench: (
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.4 3.4Z" />
    ),

    robot: (
      <>
        <rect
          x="4"
          y="8"
          width="16"
          height="11"
          rx="2.5"
        />
        <path d="M12 8V4M9 4h6" />
        <circle
          cx="9"
          cy="13.5"
          r="1.3"
        />
        <circle
          cx="15"
          cy="13.5"
          r="1.3"
        />
        <path d="M8.5 17h7" />
      </>
    ),

    sparkle: (
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M6 6l2.2 2.2M15.8 15.8 18 18M18 6l-2.2 2.2M8.2 15.8 6 18" />
    ),

    trending: (
      <>
        <path d="M3 17 9.5 10.5 13.5 14.5 21 7" />
        <path d="M15.5 7H21v5.5" />
      </>
    ),

    assign: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />
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


/* --------------------------------------------------------------------------
   TYPES
--------------------------------------------------------------------------- */

type Incident = {
  incidentID: string
  affectedIssue?: string
  classification?: string
  connectionType?: string
  createdAt?: string
  department?: string
  description?: string
  deviceType?: string
  employeeName?: string
  issueCategory?: string
  location?: string
  resolvedAt?: string | null
  resolvedBy?: string | null
  severity?: string
  status?: string
  summary?: string
  troubleshooting?: string | string[]
  userId?: number | string
  assigned?: string
  assignedAt?: string | null
  assignedTo?: number | string | null
  assignedToName?: string | null
  assignedToId?: number | string | null
  employeeId?: string
  reporterEmail?: string
  encodedBy?: string
}

type Device = {
  deviceID?: number | string
  name?: string
  type?: string
  ipAddress?: string
  port?: number | string
  location?: string
  status?: string
  latencyMs?: number | string | null
  lastChecked?: string | null
  lastUpdated?: string | null
}


/* --------------------------------------------------------------------------
   STAT CARD
--------------------------------------------------------------------------- */

function StatCard({
  icon,
  number,
  title,
  tone,
}: {
  icon: IconName
  number: string
  title: string
  tone: string
}) {
  return (
    <article
      className={`stat-card stat-card--${tone}`}
    >
      <div className="stat-icon">
        <Icon name={icon} />
      </div>

      <div>
        <h3>{title}</h3>
        <strong>{number}</strong>
      </div>
    </article>
  )
}


/* --------------------------------------------------------------------------
   NAVIGATION
--------------------------------------------------------------------------- */

const navigation: {
  label: string
  icon: IconName
  path: string
}[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/admin',
  },
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


const periodOptions = [
  'This Month',
  'Last Month',
  'This Quarter',
  'This Year',
]


/* --------------------------------------------------------------------------
   THEME
--------------------------------------------------------------------------- */

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY =
  'batangai-theme'

function readStoredTheme(): Theme {
  const stored =
    localStorage.getItem(
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
  const [theme, setTheme] =
    useState<Theme>(
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


/* --------------------------------------------------------------------------
   THEME TOGGLE
--------------------------------------------------------------------------- */

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme
  onToggle: () => void
}) {
  const isDark =
    theme === 'dark'

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
          <circle
            cx="12"
            cy="12"
            r="4.2"
          />
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


/* --------------------------------------------------------------------------
   PERIOD FILTER
--------------------------------------------------------------------------- */

function PeriodFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const [open, setOpen] =
    useState(false)

  const rootRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
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

  return (
    <div
      className="period-filter"
      ref={rootRef}
    >
      <button
        type="button"
        onClick={() =>
          setOpen(current => !current)
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {value}

        <span
          className={`period-filter-chevron${
            open ? ' open' : ''
          }`}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div
          className="period-filter-dropdown"
          role="menu"
        >
          {periodOptions.map(
            option => (
              <button
                key={option}
                type="button"
                role="menuitem"
                className={
                  option === value
                    ? 'is-selected'
                    : ''
                }
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
              >
                {option}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}


/* --------------------------------------------------------------------------
   PROFILE MENU
--------------------------------------------------------------------------- */

function ProfileMenu({
  name,
  role,
  avatar,
  onLogout,
}: {
  name: string
  role: string
  avatar: string
  onLogout: () => void
}) {
  const [open, setOpen] =
    useState(false)

  const navigate = useNavigate()

  const rootRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
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
              .map(
                part =>
                  part[0],
              )
              .slice(0, 2)
              .join('')
              .toUpperCase()
          )}
        </div>

        <div>
          <strong>
            {name}
          </strong>

          <span>
            {role}
          </span>
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
              <circle
                cx="12"
                cy="8"
                r="4"
              />
              <path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" />
            </svg>

            My Profile
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() =>
              navigate(
                '/admin/settings',
              )
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
              <circle
                cx="12"
                cy="12"
                r="3"
              />
              <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6-1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" />
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


/* --------------------------------------------------------------------------
   DATE HELPERS
--------------------------------------------------------------------------- */

function getDateValue(
  date?: string,
) {
  if (!date) {
    return null
  }

  const parsed =
    new Date(date)

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null
  }

  return parsed
}


function isWithinPeriod(
  dateString: string | undefined,
  period: string,
) {
  const date =
    getDateValue(dateString)

  if (!date) {
    return false
  }

  const now =
    new Date()

  if (period === 'This Month') {
    return (
      date.getFullYear() ===
        now.getFullYear() &&
      date.getMonth() ===
        now.getMonth()
    )
  }

  if (period === 'Last Month') {
    const lastMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      )

    return (
      date.getFullYear() ===
        lastMonth.getFullYear() &&
      date.getMonth() ===
        lastMonth.getMonth()
    )
  }

  if (period === 'This Quarter') {
    const currentQuarter =
      Math.floor(
        now.getMonth() / 3,
      )

    const startMonth =
      currentQuarter * 3

    const start =
      new Date(
        now.getFullYear(),
        startMonth,
        1,
      )

    const end =
      new Date(
        now.getFullYear(),
        startMonth + 3,
        1,
      )

    return (
      date >= start &&
      date < end
    )
  }

  if (period === 'This Year') {
    return (
      date.getFullYear() ===
      now.getFullYear()
    )
  }

  return true
}


function formatDate(
  dateString?: string,
) {
  const date =
    getDateValue(dateString)

  if (!date) {
    return '—'
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )
}


function formatTime(
  dateString?: string,
) {
  const date =
    getDateValue(dateString)

  if (!date) {
    return ''
  }

  return date.toLocaleTimeString(
    'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}


/* --------------------------------------------------------------------------
   STATUS HELPERS
--------------------------------------------------------------------------- */

function normalizeStatus(
  status?: string,
) {
  return (
    status
      ?.trim()
      .toLowerCase()
      .replace(/_/g, ' ') || ''
  )
}


function getStatusClass(
  status?: string,
) {
  const normalized =
    normalizeStatus(status)

  if (
    normalized === 'resolved' ||
    normalized === 'closed'
  ) {
    return 'resolved-tag'
  }

  if (
    normalized ===
      'in progress' ||
    normalized ===
      'ongoing'
  ) {
    return 'progress-tag'
  }

  return 'pending-tag'
}


function displayStatus(
  status?: string,
) {
  const normalized =
    normalizeStatus(status)

  if (
    normalized === 'resolved'
  ) {
    return 'Resolved'
  }

  if (
    normalized === 'closed'
  ) {
    return 'Closed'
  }

  if (
    normalized ===
      'in progress' ||
    normalized === 'ongoing'
  ) {
    return 'In Progress'
  }

  return 'Pending'
}


function getSeverityClass(
  severity?: string,
) {
  switch (
    severity
      ?.trim()
      .toLowerCase()
  ) {
    case 'high':
      return 'high-tag'

    case 'medium':
      return 'medium-tag'

    default:
      return 'low-tag'
  }
}


function displaySeverity(
  severity?: string,
) {
  const value =
    severity
      ?.trim()
      .toLowerCase()

  if (value === 'high') {
    return 'High'
  }

  if (value === 'medium') {
    return 'Medium'
  }

  return 'Low'
}


/* --------------------------------------------------------------------------
   DASHBOARD
--------------------------------------------------------------------------- */

function Dashboard() {
  const navigate =
    useNavigate()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const [
    chartPeriod,
    setChartPeriod,
  ] = useState(
    'This Month',
  )

  const [
    severityPeriod,
    setSeverityPeriod,
  ] = useState(
    'This Month',
  )

  const [
    incidents,
    setIncidents,
  ] = useState<Incident[]>(
    [],
  )

  const [
    devices,
    setDevices,
  ] = useState<Device[]>(
    [],
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const session =
    getAuthSession()

  const currentUser =
    session?.user

  const handleLogout =
    () => {
      signOut()

      navigate('/')
    }

  const adminName =
    currentUser?.fullName ??
    'Administrator'

  const adminRole =
    currentUser?.role ??
    'Administrator'

  const adminAvatar =
    getProfilePhotoUrl(
      currentUser?.profilePhoto,
      currentUser?.fullName,
      currentUser?.role,
    )


  /* ------------------------------------------------------------------------
     LOAD DASHBOARD DATA
  ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false

    const loadDashboard =
      async () => {
        setLoading(true)
        setError('')

        try {
          const [
            incidentsResponse,
            devicesResponse,
          ] = await Promise.all([
            fetch(
              'http://localhost/BatangAI/api/incidents.php',
            ),
            fetch(
              'http://localhost/BatangAI/api/devices.php',
            ).catch(
              () => null,
            ),
          ])

          if (
            !incidentsResponse.ok
          ) {
            throw new Error(
              'Failed to load incidents.',
            )
          }

          const incidentsData =
            await incidentsResponse.json()

          if (
            !incidentsData.success
          ) {
            throw new Error(
              incidentsData.message ||
                'Failed to load incidents.',
            )
          }

          let loadedIncidents:
            Incident[] =
            []

          if (
            Array.isArray(
              incidentsData.incidents,
            )
          ) {
            loadedIncidents =
              incidentsData.incidents
          } else if (
            Array.isArray(
              incidentsData.data,
            )
          ) {
            loadedIncidents =
              incidentsData.data
          }

          let loadedDevices:
            Device[] =
            []

          if (
            devicesResponse &&
            devicesResponse.ok
          ) {
            try {
              const devicesData =
                await devicesResponse.json()

              if (
                Array.isArray(
                  devicesData.devices,
                )
              ) {
                loadedDevices =
                  devicesData.devices
              } else if (
                Array.isArray(
                  devicesData.data,
                )
              ) {
                loadedDevices =
                  devicesData.data
              }
            } catch {
              loadedDevices = []
            }
          }

          if (!cancelled) {
            setIncidents(
              loadedIncidents,
            )

            setDevices(
              loadedDevices,
            )
          }
        } catch (loadError) {
          console.error(
            'Dashboard loading error:',
            loadError,
          )

          if (!cancelled) {
            setError(
              'Unable to load dashboard data from the database.',
            )
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])


  /* ------------------------------------------------------------------------
     INCIDENT STATISTICS
  ------------------------------------------------------------------------ */

  const totalIncidents =
    incidents.length

  const resolvedIncidents =
    incidents.filter(
      incident => {
        const status =
          normalizeStatus(
            incident.status,
          )

        return (
          status ===
            'resolved' ||
          status === 'closed'
        )
      },
    ).length

  const inProgressIncidents =
    incidents.filter(
      incident =>
        normalizeStatus(
          incident.status,
        ) ===
          'in progress' ||
        normalizeStatus(
          incident.status,
        ) === 'ongoing',
    ).length

  const pendingIncidents =
    incidents.filter(
      incident => {
        const status =
          normalizeStatus(
            incident.status,
          )

        return (
          status === '' ||
          status ===
            'pending'
        )
      },
    ).length


  /* ------------------------------------------------------------------------
     DEPARTMENT DATA
  ------------------------------------------------------------------------ */

  const departmentData =
    useMemo(() => {
      const filtered =
        incidents.filter(
          incident =>
            isWithinPeriod(
              incident.createdAt,
              chartPeriod,
            ),
        )

      const counts =
        new Map<
          string,
          number
        >()

      filtered.forEach(
        incident => {
          const department =
            incident.department?.trim() ||
            'Others'

          counts.set(
            department,
            (counts.get(
              department,
            ) || 0) + 1,
          )
        },
      )

      const sorted =
        Array.from(
          counts.entries(),
        )
          .sort(
            (a, b) =>
              b[1] - a[1],
          )
          .map(
            ([label, value]) => ({
              label,
              value,
            }),
          )

      if (
        sorted.length <= 6
      ) {
        return sorted
      }

      const topFive =
        sorted.slice(0, 5)

      const others =
        sorted
          .slice(5)
          .reduce(
            (
              total,
              item,
            ) =>
              total +
              item.value,
            0,
          )

      return [
        ...topFive,
        {
          label: 'Others',
          value: others,
        },
      ]
    }, [
      incidents,
      chartPeriod,
    ])


  /* ------------------------------------------------------------------------
     SEVERITY DATA
  ------------------------------------------------------------------------ */

  const severity = useMemo(() => {
    const filtered =
      incidents.filter(
        incident =>
          isWithinPeriod(
            incident.createdAt,
            severityPeriod,
          ),
      )

    const high =
      filtered.filter(
        incident =>
          normalizeStatus(
            incident.severity,
          ) === 'high',
      ).length

    const medium =
      filtered.filter(
        incident =>
          normalizeStatus(
            incident.severity,
          ) === 'medium',
      ).length

    const low =
      filtered.filter(
        incident =>
          normalizeStatus(
            incident.severity,
          ) === 'low' ||
          !incident.severity,
      ).length

    const total =
      high +
      medium +
      low

    return {
      high,
      medium,
      low,
      highPct:
        total > 0
          ? Math.round(
              (high / total) *
                100,
            )
          : 0,
      medPct:
        total > 0
          ? Math.round(
              (medium / total) *
                100,
            )
          : 0,
      lowPct:
        total > 0
          ? Math.round(
              (low / total) *
                100,
            )
          : 0,
    }
  }, [
    incidents,
    severityPeriod,
  ])


  /* ------------------------------------------------------------------------
     RECENT INCIDENTS
  ------------------------------------------------------------------------ */

  const recentIncidents =
    useMemo(() => {
      return [
        ...incidents,
      ]
        .sort(
          (
            a,
            b,
          ) => {
            const dateA =
              getDateValue(
                a.createdAt,
              )?.getTime() ||
              0

            const dateB =
              getDateValue(
                b.createdAt,
              )?.getTime() ||
              0

            return (
              dateB - dateA
            )
          },
        )
        .slice(0, 5)
    }, [incidents])


  /* ------------------------------------------------------------------------
     DEVICE STATISTICS
  ------------------------------------------------------------------------ */

  const onlineDevices =
    devices.filter(
      device => {
        const status =
          normalizeStatus(
            device.status,
          )

        return (
          status === 'online' ||
          status === 'active'
        )
      },
    ).length

  const maintenanceDevices =
    devices.filter(
      device =>
        normalizeStatus(
          device.status,
        ) ===
        'maintenance',
    ).length

  const offlineDevices =
    devices.filter(
      device => {
        const status =
          normalizeStatus(
            device.status,
          )

        return (
          status === 'offline' ||
          status === 'down' ||
          status ===
            'not responding'
        )
      },
    ).length


  /* ------------------------------------------------------------------------
     CHART SETTINGS
  ------------------------------------------------------------------------ */

  const CHART_MAX =
    Math.max(
      5,
      ...departmentData.map(
        item => item.value,
      ),
    )

  const PLOT_HEIGHT =
    140


  /* ------------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------------ */

  return (
    <div
      className={`admin-shell${
        sidebarCollapsed
          ? ' sidebar-collapsed'
          : ''
      }`}
    >

      {/* ================================================================
          SIDEBAR
      ================================================================ */}

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
          {navigation.map(
            item => (
              <button
                className={
                  item.label ===
                  'Dashboard'
                    ? 'is-active'
                    : ''
                }
                key={item.label}
                type="button"
                onClick={() =>
                  navigate(
                    item.path,
                  )
                }
              >
                <Icon
                  name={item.icon}
                />

                <span>
                  {item.label}
                </span>
              </button>
            ),
          )}
        </nav>

      </aside>


      {/* ================================================================
          MAIN
      ================================================================ */}

      <main className="admin-main">

        {/* ==============================================================
            TOP BAR
        ============================================================== */}

        <header className="admin-topbar">

          <button
            className="menu-button"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={
              !sidebarCollapsed
            }
            onClick={() =>
              setSidebarCollapsed(
                collapsed =>
                  !collapsed,
              )
            }
          >
            <Icon name="menu" />
          </button>

          <div className="topbar-title">

            <h1>
              Admin Dashboard
            </h1>

            <p>
              System-wide overview
              of incidents,
              devices, and users.
            </p>

          </div>

          <ThemeToggle
            theme={theme}
            onToggle={
              toggleTheme
            }
          />

          <AdminNotifications />

          <ProfileMenu
            name={adminName}
            role={adminRole}
            avatar={
              adminAvatar
            }
            onLogout={
              handleLogout
            }
          />

        </header>


        {/* ==============================================================
            CONTENT
        ============================================================== */}

        <div className="dashboard-content">

          {/* ============================================================
              ERROR
          ============================================================ */}

          {error && (
            <div
              className="profile-toast"
              role="alert"
            >
              {error}

              <button
                type="button"
                onClick={() =>
                  setError('')
                }
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}


          {/* ============================================================
              STATISTICS
          ============================================================ */}

          <section className="statistics-grid">

            <StatCard
              icon="document"
              number={
                loading
                  ? '...'
                  : String(
                      totalIncidents,
                    )
              }
              title="Total Incidents"
              tone="blue"
            />

            <StatCard
              icon="resolved"
              number={
                loading
                  ? '...'
                  : String(
                      resolvedIncidents,
                    )
              }
              title="Resolved"
              tone="green"
            />

            <StatCard
              icon="progress"
              number={
                loading
                  ? '...'
                  : String(
                      inProgressIncidents,
                    )
              }
              title="In Progress"
              tone="purple"
            />

            <StatCard
              icon="pending"
              number={
                loading
                  ? '...'
                  : String(
                      pendingIncidents,
                    )
              }
              title="Pending"
              tone="orange"
            />

          </section>


          {/* ============================================================
              CHARTS
          ============================================================ */}

          <section className="dashboard-grid charts-grid">

            {/* ==========================================================
                INCIDENTS BY DEPARTMENT
            ========================================================== */}

            <article className="dashboard-card chart-card">

              <header>

                <h2>
                  <Icon name="chart" />

                  Incidents by Department
                </h2>

                <PeriodFilter
                  value={
                    chartPeriod
                  }
                  onChange={
                    setChartPeriod
                  }
                />

              </header>

              <div className="bar-chart">

                <div className="y-axis">

                  <b>
                    {CHART_MAX}
                  </b>

                  <b>
                    {Math.round(
                      CHART_MAX *
                        0.67,
                    )}
                  </b>

                  <b>
                    {Math.round(
                      CHART_MAX *
                        0.33,
                    )}
                  </b>

                  <b>
                    0
                  </b>

                </div>

                <div className="chart-plot">

                  <i />
                  <i />
                  <i />

                  {departmentData.length ===
                  0 ? (
                    <div
                      style={{
                        padding:
                          '40px',
                        width:
                          '100%',
                        textAlign:
                          'center',
                      }}
                    >
                      No incidents
                      found for
                      this period.
                    </div>
                  ) : (
                    departmentData.map(
                      item => {
                        const height =
                          Math.round(
                            (item.value /
                              CHART_MAX) *
                              PLOT_HEIGHT,
                          )

                        return (
                          <div
                            className="bar-item"
                            key={
                              item.label
                            }
                          >
                            <em
                              style={{
                                bottom: `${
                                  height +
                                  9
                                }px`,
                              }}
                            >
                              {
                                item.value
                              }
                            </em>

                            <strong
                              style={{
                                height: `${height}px`,
                              }}
                            />

                            <span>
                              {
                                item.label
                              }
                            </span>
                          </div>
                        )
                      },
                    )
                  )}

                </div>

              </div>

            </article>


            {/* ==========================================================
                SEVERITY
            ========================================================== */}

            <article className="dashboard-card severity-card">

              <header>

                <h2>
                  <Icon name="pie" />

                  Severity Breakdown
                </h2>

                <PeriodFilter
                  value={
                    severityPeriod
                  }
                  onChange={
                    setSeverityPeriod
                  }
                />

              </header>

              <div className="severity-content">

                <div
                  className="donut-chart"
                  style={{
                    background:
                      severity.high +
                        severity.medium +
                        severity.low >
                      0
                        ? `conic-gradient(
                            var(--danger) 0 ${severity.highPct}%,
                            var(--warning) ${severity.highPct}% ${
                              severity.highPct +
                              severity.medPct
                            }%,
                            var(--success) ${
                              severity.highPct +
                              severity.medPct
                            }% 100%
                          )`
                        : 'conic-gradient(#e5e7eb 0 100%)',
                  }}
                />

                <div className="severity-list">

                  <p className="high">
                    <i />

                    High

                    <b>
                      {
                        severity.high
                      }
                    </b>

                    <strong>
                      {
                        severity.highPct
                      }
                      %
                    </strong>
                  </p>

                  <p className="medium">
                    <i />

                    Medium

                    <b>
                      {
                        severity.medium
                      }
                    </b>

                    <strong>
                      {
                        severity.medPct
                      }
                      %
                    </strong>
                  </p>

                  <p className="low">
                    <i />

                    Low

                    <b>
                      {
                        severity.low
                      }
                    </b>

                    <strong>
                      {
                        severity.lowPct
                      }
                      %
                    </strong>
                  </p>

                </div>

              </div>

            </article>

          </section>


          {/* ============================================================
              DETAILS
          ============================================================ */}

          <section className="dashboard-grid details-grid">

            {/* ==========================================================
                RECENT INCIDENTS
            ========================================================== */}

            <article className="dashboard-card recent-card">

              <h2>
                <Icon name="document" />

                Recent Incidents
              </h2>

              <table>

                <thead>
                  <tr>
                    <th>
                      ID
                    </th>

                    <th>
                      Title
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Severity
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Reported At
                    </th>

                    <th />
                  </tr>
                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '30px',
                        }}
                      >
                        Loading incidents...
                      </td>
                    </tr>
                  ) : recentIncidents.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '30px',
                        }}
                      >
                        No incidents
                        found.
                      </td>
                    </tr>
                  ) : (
                    recentIncidents.map(
                      incident => (
                        <tr
                          key={
                            incident.incidentID
                          }
                        >
                          <td>
                            {
                              incident.incidentID
                            }
                          </td>

                          <td>
                            {
                              incident.affectedIssue ||
                              incident.issueCategory ||
                              incident.summary ||
                              incident.description ||
                              'Network incident'
                            }
                          </td>

                          <td>
                            {
                              incident.department ||
                              '—'
                            }
                          </td>

                          <td>
                            <span
                              className={`tag ${getSeverityClass(
                                incident.severity,
                              )}`}
                            >
                              {
                                displaySeverity(
                                  incident.severity,
                                )
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={`tag ${getStatusClass(
                                incident.status,
                              )}`}
                            >
                              {
                                displayStatus(
                                  incident.status,
                                )
                              }
                            </span>
                          </td>

                          <td>
                            {
                              formatDate(
                                incident.createdAt,
                              )
                            }

                            <br />

                            {
                              formatTime(
                                incident.createdAt,
                              )
                            }
                          </td>

                          <td>
                            ⋮
                          </td>
                        </tr>
                      ),
                    )
                  )}

                </tbody>

              </table>

              <button
                className="view-all"
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/incidents',
                  )
                }
              >
                View All Incidents

                <Icon name="arrow" />
              </button>

            </article>


            {/* ==========================================================
                DEVICE STATUS
            ========================================================== */}

            <article className="dashboard-card device-card">

              <header>

                <h2>
                  <Icon name="monitor" />

                  Device Status
                </h2>

                <button
                  className="view-devices"
                  type="button"
                  onClick={() =>
                    navigate(
                      '/admin/device-monitoring',
                    )
                  }
                >
                  View All Devices

                  <Icon name="arrow" />
                </button>

              </header>

              <div className="device-row online">

                <Icon name="online" />

                <p>
                  <strong>
                    Online Devices
                  </strong>

                  <span>
                    Active and monitored
                  </span>
                </p>

                <b>
                  {devices.length ===
                    0 &&
                  !loading
                    ? '0'
                    : loading
                      ? '...'
                      : onlineDevices}
                </b>

              </div>


              <div className="device-row warning">

                <Icon name="wrench" />

                <p>
                  <strong>
                    Maintenance
                  </strong>

                  <span>
                    Under maintenance
                  </span>
                </p>

                <b>
                  {loading
                    ? '...'
                    : maintenanceDevices}
                </b>

              </div>


              <div className="device-row offline">

                <Icon name="offline" />

                <p>
                  <strong>
                    Offline Devices
                  </strong>

                  <span>
                    Not responding
                  </span>
                </p>

                <b>
                  {loading
                    ? '...'
                    : offlineDevices}
                </b>

              </div>

            </article>

          </section>


          {/* ============================================================
              SYSTEM INFORMATION
          ============================================================ */}

          <section className="dashboard-grid">

            <article className="dashboard-card ai-insights-card">

              <h2>
                <Icon name="robot" />

                System Overview

                <Icon name="sparkle" />
              </h2>

              <div className="ai-insights-body">

                <div className="ai-insight-item">

                  <div className="ai-insight-icon ai-insight-icon--blue">
                    <Icon name="trending" />
                  </div>

                  <p>
                    The dashboard
                    displays live
                    incident data
                    from the
                    database.
                  </p>

                </div>


                <div className="ai-insight-item">

                  <div className="ai-insight-icon ai-insight-icon--purple">
                    <Icon name="incidents" />
                  </div>

                  <p>
                    Incident
                    statistics are
                    automatically
                    calculated from
                    submitted
                    reports.
                  </p>

                </div>


                <div className="ai-insight-item">

                  <div className="ai-insight-icon ai-insight-icon--orange">
                    <Icon name="monitor" />
                  </div>

                  <p>
                    Device status
                    will be managed
                    through the
                    Device Monitoring
                    module.
                  </p>

                </div>


                <div className="ai-recommended-action">

                  <span>
                    AI Module
                  </span>

                  <p>
                    AI-assisted
                    troubleshooting
                    will be integrated
                    after the system
                    interfaces and
                    dashboards are
                    completed.
                  </p>

                </div>

              </div>

            </article>

          </section>

        </div>

      </main>

    </div>
  )
}

export default Dashboard