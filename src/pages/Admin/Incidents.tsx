import { useState, useEffect, useRef, useMemo } from 'react'
import type { FormEvent, JSX, MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import {
  getAuthSession,
  getCurrentUserId,
  getProfilePhotoUrl,
  signOut,
} from '../../auth'
import { PersonName } from '../../components/PersonName'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './Incidents.css'
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
  | 'search'
  | 'view'
  | 'more'
  | 'walk'
  | 'assign'
  | 'close'

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

    menu: <path d="M4 6h16M4 12h16M4 18h16" />,

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

    view: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),

    more: (
      <>
        <circle cx="12" cy="5" r="1.3" />
        <circle cx="12" cy="12" r="1.3" />
        <circle cx="12" cy="19" r="1.3" />
      </>
    ),


    walk: (
      <>
        <circle cx="13" cy="4.5" r="1.8" />
        <path d="M13 7.3 9.5 9l1 3.2-3 2.3M13 7.3l2.5 2.2-.8 3.3 2.8 3M9.5 9l3.5-.5 2 1.5" />
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

/* ===========================================================
   DATABASE INCIDENT TYPE
   =========================================================== */

type Incident = {
  incidentID: string
  affectedIssue: string
  classification: string | null
  connectionType: string | null
  createdAt: string
  department: string
  description: string
  deviceType: string | null
  employeeName: string
  reporterProfilePhoto: string | null
  issueCategory: string
  location: string
  resolvedAt: string | null
  resolvedBy: string | null
  severity: 'High' | 'Medium' | 'Low'
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed'
  summary: string | null
  troubleshooting: string | null
  userId: string
  assigned: 'Yes' | 'No'
  assignedAt: string | null
  assignedTo: string | null
  assignedToName: string | null
  assignedToProfilePhoto: string | null
  durationMinutes: number | null
  resolutionNotes: string | null
  startedAt: string | null
}

/* ===========================================================
   API RESPONSE
   =========================================================== */

type IncidentsResponse = {
  success: boolean
  count: number
  incidents: Incident[]
  message?: string
}

/* ===========================================================
   FILTERS
   =========================================================== */

const STATUS_OPTIONS = [
  'All Status',
  'Pending',
  'In Progress',
  'Resolved',
  'Closed',
]

const SEVERITY_OPTIONS = [
  'All Severity',
  'High',
  'Medium',
  'Low',
]

/* ===========================================================
   NEW INCIDENT FORM
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

/* ===========================================================
   THEME
   =========================================================== */

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
    document.documentElement.setAttribute(
      'data-theme',
      theme,
    )

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    )
  }, [theme])

  const toggleTheme = () => {
    setTheme(current =>
      current === 'dark' ? 'light' : 'dark',
    )
  }

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

/* ===========================================================
   PROFILE MENU
   =========================================================== */

function ProfileMenu({
  name,
  role,
  avatar,
  onLogout,
  profilePath = '/admin/profile',
}: {
  name: string
  role: string
  avatar: string
  onLogout: () => void
  profilePath?: string
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
    navigate(profilePath)
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
            My Profile
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate(
                profilePath.replace(
                  '/profile',
                  '/settings',
                ),
              )
            }}
          >
            Settings
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={goToProfile}
          >
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
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

function getBasicSelfHelpText(
  troubleshooting: string | null,
): string {
  if (!troubleshooting) {
    return 'No basic self-help guidance was recorded.'
  }

  const marker = 'IT Troubleshooting Suggestions:'
  const markerIndex = troubleshooting.indexOf(marker)

  if (markerIndex === -1) {
    return troubleshooting.replace(/^Basic Self-Help:\s*/i, '').trim()
  }

  return (
    troubleshooting
      .slice(0, markerIndex)
      .replace(/^Basic Self-Help:\s*/i, '')
      .trim() ||
    'No basic self-help guidance was recorded.'
  )
}

function getITTroubleshootingText(
  troubleshooting: string | null,
): string {
  if (!troubleshooting) {
    return 'No IT troubleshooting suggestions were recorded.'
  }

  const marker = 'IT Troubleshooting Suggestions:'
  const markerIndex = troubleshooting.indexOf(marker)

  if (markerIndex === -1) {
    return 'No IT troubleshooting suggestions were recorded.'
  }

  return (
    troubleshooting
      .slice(markerIndex + marker.length)
      .trim() ||
    'No IT troubleshooting suggestions were recorded.'
  )
}

/* ===========================================================
   PAGE
   =========================================================== */

function Incidents({
  audience = 'administrator',
}: {
  audience?: 'administrator' | 'secretary' | 'it'
}) {
  const navigate = useNavigate()

  const isSecretary =
    audience === 'secretary'

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
                : item.path.replace(
                    '/admin',
                    '/it',
                  ),
          }))
      : navigation

  const session = getAuthSession()
  const currentUser = session?.user

  const user = isSecretary
    ? {
        name: currentUser?.fullName || 'Secretary',
        role: currentUser?.role || 'Secretary',
        initial: 'S',
        profilePath: '/secretary/profile',
      }
    : isIT
      ? {
          name: currentUser?.fullName || 'IT Personnel',
          role: currentUser?.role || 'IT Personnel',
          initial: 'I',
          profilePath: '/it/profile',
        }
      : {
          name: currentUser?.fullName || 'Administrator',
          role: currentUser?.role || 'Administrator',
          initial: 'A',
          profilePath: '/admin/profile',
        }

  const [profileAvatar, setProfileAvatar] = useState(() =>
    getProfilePhotoUrl(
      currentUser?.profilePhoto,
      currentUser?.fullName,
      currentUser?.role,
    ),
  )

  useEffect(() => {
    const updateProfilePhoto = () => {
      const updatedSession = getAuthSession()
      const updatedUser = updatedSession?.user

      if (!updatedUser) return

      setProfileAvatar(
        getProfilePhotoUrl(
          updatedUser.profilePhoto,
          updatedUser.fullName,
          updatedUser.role,
        ),
      )
    }

    updateProfilePhoto()
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

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const handleLogout = () => {
    signOut()
    navigate('/', { replace: true })
  }

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  /* =========================================================
     REAL DATABASE INCIDENTS
     ========================================================= */

  const [incidents, setIncidents] =
    useState<Incident[]>([])

  const [loading, setLoading] =
    useState(true)

  const [apiError, setApiError] =
    useState('')

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      setApiError('')

      const currentUserId = getCurrentUserId()

      if (currentUserId === null) {
        throw new Error('Your login session could not be verified. Please log in again.')
      }

      const response = await fetch(
        `${API_BASE_URL}/get_incidents.php?userID=${encodeURIComponent(String(currentUserId))}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        },
      )

      const responseText =
        await response.text()

      let data: IncidentsResponse

      try {
        data = JSON.parse(responseText)
      } catch {
        console.error(
          'Invalid JSON from get_incidents.php:',
          responseText,
        )

        throw new Error(
          'The server returned an invalid response.',
        )
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to load incidents.',
        )
      }

      setIncidents(
        Array.isArray(data.incidents)
          ? data.incidents
          : [],
      )
    } catch (error) {
      console.error(
        'Fetch incidents error:',
        error,
      )

      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to load incidents.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  /* =========================================================
     FILTERS
     ========================================================= */

  const [query, setQuery] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('All Status')

  const [severityFilter, setSeverityFilter] =
    useState('All Severity')

  const [departmentFilter, setDepartmentFilter] =
    useState('All Departments')

  const departmentOptions = useMemo(() => {
    const departments = Array.from(
      new Set(
        incidents
          .map(
            incident =>
              incident.department,
          )
          .filter(Boolean),
      ),
    )

    return [
      'All Departments',
      ...departments,
    ]
  }, [incidents])

  const filteredIncidents =
    useMemo(() => {
      const q =
        query.trim().toLowerCase()

      return incidents.filter(
        incident => {
          const matchesQuery =
            q === '' ||
            [
              incident.incidentID,
              incident.employeeName,
              incident.affectedIssue,
              incident.description,
              incident.department,
              incident.issueCategory,
              incident.location,
              incident.deviceType,
            ]
              .join(' ')
              .toLowerCase()
              .includes(q)

          const matchesStatus =
            statusFilter ===
              'All Status' ||
            incident.status ===
              statusFilter

          const matchesSeverity =
            severityFilter ===
              'All Severity' ||
            incident.severity ===
              severityFilter

          const matchesDepartment =
            departmentFilter ===
              'All Departments' ||
            incident.department ===
              departmentFilter

          return (
            matchesQuery &&
            matchesStatus &&
            matchesSeverity &&
            matchesDepartment
          )
        },
      )
    }, [
      incidents,
      query,
      statusFilter,
      severityFilter,
      departmentFilter,
    ])

  /* =========================================================
     VIEW / ACTION MENU
     ========================================================= */

  const [viewingId, setViewingId] =
    useState<string | null>(null)

  const [actionMenuId, setActionMenuId] =
    useState<string | null>(null)

  const viewingIncident =
    incidents.find(
      incident =>
        incident.incidentID ===
        viewingId,
    ) ?? null

  const [liveNow, setLiveNow] =
    useState(() => Date.now())

  useEffect(() => {
    if (
      !viewingIncident ||
      viewingIncident.status !== 'In Progress' ||
      !viewingIncident.startedAt
    ) {
      setLiveNow(Date.now())
      return
    }

    const updateLiveTime = () => {
      setLiveNow(Date.now())
    }

    updateLiveTime()

    const intervalId = window.setInterval(
      updateLiveTime,
      1000,
    )

    return () => {
      window.clearInterval(intervalId)
    }
  }, [
    viewingIncident?.incidentID,
    viewingIncident?.status,
    viewingIncident?.startedAt,
  ])

  const closeViewing = () => {
    setViewingId(null)
    setActionMenuId(null)
  }

  /* =========================================================
     NEW INCIDENT MODAL
     ========================================================= */

  const [isNewIncidentOpen, setIsNewIncidentOpen] =
    useState(false)


  const [values, setValues] =
    useState<IncidentFormValues>(
      initialIncidentFormValues,
    )

  const [errors, setErrors] =
    useState<
      Partial<
        Record<
          keyof IncidentFormValues,
          string
        >
      >
    >({})



  const overlayRef =
    useRef<HTMLDivElement>(null)

  const openNewIncident = () => {
    setValues(
      initialIncidentFormValues,
    )

    setErrors({})
    setIsNewIncidentOpen(true)
  }

  const closeNewIncident = () => {
    setIsNewIncidentOpen(false)
  }

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        if (viewingId) {
          closeViewing()
        }

        if (isNewIncidentOpen) {
          closeNewIncident()
        }
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    viewingId,
    isNewIncidentOpen,
  ])

  const handleFieldChange = (
    field: keyof IncidentFormValues,
    value: string,
  ) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }))

    setErrors(prev => {
      if (!prev[field]) return prev

      const next = {
        ...prev,
      }

      delete next[field]

      return next
    })
  }

  const validate = () => {
    const requiredFields: (
      keyof IncidentFormValues
    )[] = [
      'location',
      'issueCategory',
      'deviceType',
      'connectionType',
      'severity',
      'affectedService',
      'description',
    ]

    const nextErrors: Partial<
      Record<
        keyof IncidentFormValues,
        string
      >
    > = {}

    requiredFields.forEach(
      field => {
        if (
          !values[field].trim()
        ) {
          nextErrors[field] =
            'This field is required.'
        }
      },
    )

    setErrors(nextErrors)

    return (
      Object.keys(nextErrors)
        .length === 0
    )
  }

  const handleSubmitNewIncident = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    alert(
      'The Admin New Incident form is not connected to the database yet.',
    )
  }

  const handleOverlayMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (
      event.target ===
      overlayRef.current
    ) {
      closeNewIncident()
    }
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
          aria-label={`${user.role} navigation`}
        >
          {roleNavigation.map(item => (
            <button
              className={
                item.label ===
                'All Incidents'
                  ? 'is-active'
                  : ''
              }
              key={item.label}
              type="button"
              onClick={() =>
                navigate(item.path)
              }
            >
              <Icon
                name={item.icon}
              />
              <span>
                {item.label}
              </span>
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
            aria-expanded={
              !sidebarCollapsed
            }
            onClick={() =>
              setSidebarCollapsed(
                value => !value,
              )
            }
          >
            <Icon name="menu" />
          </button>

          <div className="topbar-title">
            <h1>
              All Incident Reports
            </h1>

            <p>
              Monitor all network
              incident reports across
              all departments.
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
            avatar={profileAvatar}
            profilePath={
              user.profilePath
            }
            onLogout={
              handleLogout
            }
          />
        </header>

        <div className="dashboard-content">
          {/* =================================================
              SEARCH / NEW INCIDENT
              ================================================= */}

          <section className="incident-tools">
            <label className="incident-search">
              <Icon name="search" />

              <input
                value={query}
                onChange={e =>
                  setQuery(
                    e.target.value,
                  )
                }
                placeholder="Search incidents..."
              />
            </label>

            <button
              className="incident-new"
              type="button"
              onClick={
                openNewIncident
              }
            >
              + New Incident
            </button>
          </section>

          {/* =================================================
              FILTERS
              ================================================= */}

          <section className="incident-filters">
            <label className="incident-filter-select">
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(
                    e.target.value,
                  )
                }
              >
                {STATUS_OPTIONS.map(
                  option => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="incident-filter-select">
              <select
                value={
                  severityFilter
                }
                onChange={e =>
                  setSeverityFilter(
                    e.target.value,
                  )
                }
              >
                {SEVERITY_OPTIONS.map(
                  option => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="incident-filter-select">
              <select
                value={
                  departmentFilter
                }
                onChange={e =>
                  setDepartmentFilter(
                    e.target.value,
                  )
                }
              >
                {departmentOptions.map(
                  option => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>
            </label>

            <button
              type="button"
              className="btn-secondary"
              onClick={
                fetchIncidents
              }
              disabled={loading}
            >
              {loading
                ? 'Refreshing...'
                : 'Refresh'}
            </button>
          </section>

          {/* =================================================
              API ERROR
              ================================================= */}

          {apiError && (
            <div
              style={{
                padding: '16px 20px',
                marginBottom: '16px',
                borderRadius: '10px',
                border:
                  '1px solid #f1aeb5',
                background:
                  '#f8d7da',
                color: '#842029',
              }}
            >
              <strong>
                Unable to load incidents.
              </strong>

              <div>
                {apiError}
              </div>

              <button
                type="button"
                onClick={
                  fetchIncidents
                }
                style={{
                  marginTop: '10px',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              INCIDENT TABLE
              ================================================= */}

          <article className="dashboard-card incidents-table-card">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>REPORTER</th>
                  <th>DEPARTMENT</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                  <th
                    className="incident-table-spacer"
                    aria-hidden="true"
                  />
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
                          '40px 20px',
                      }}
                    >
                      Loading incident
                      reports...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredIncidents.map(
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
                            <PersonName
                              name={
                                incident.employeeName
                              }
                              profilePhoto={
                                incident.reporterProfilePhoto
                              }
                              compact
                            />
                          </td>

                          <td>
                            {
                              incident.department
                            }
                          </td>

                          <td>
                            <span
                              className={`tag ${incident.severity.toLowerCase()}-tag`}
                            >
                              {
                                incident.severity
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={`tag status-${incident.status
                                .toLowerCase()
                                .replace(
                                  ' ',
                                  '-',
                                )} ${
                                incident.status ===
                                'Resolved'
                                  ? 'resolved-tag'
                                  : incident.status ===
                                      'In Progress'
                                    ? 'progress-tag'
                                    : 'pending-tag'
                              }`}
                            >
                              {
                                incident.status
                              }
                            </span>
                          </td>

                          <td className="incident-actions">
                            <button
                              className="view-all incident-view"
                              type="button"
                              onClick={() =>
                                setViewingId(
                                  incident.incidentID,
                                )
                              }
                            >
                              <Icon name="view" />
                              View
                            </button>

                            <div className="incident-more-menu">
                              <button
                                className="more-button"
                                type="button"
                                aria-label={`More actions for ${incident.incidentID}`}
                                aria-expanded={
                                  actionMenuId ===
                                  incident.incidentID
                                }
                                onClick={() =>
                                  setActionMenuId(
                                    current =>
                                      current ===
                                      incident.incidentID
                                        ? null
                                        : incident.incidentID,
                                  )
                                }
                              >
                                <Icon name="more" />
                              </button>

                              {actionMenuId ===
                                incident.incidentID && (
                                <div className="incident-row-menu">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(
                                        null,
                                      )

                                      alert(
                                        'Edit Incident will be connected to the database in the Manage & Assign module.',
                                      )
                                    }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="incident-delete-action"
                                    type="button"
                                    onClick={() => {
                                      setActionMenuId(
                                        null,
                                      )

                                      alert(
                                        'Delete Incident is not connected yet. No database record was deleted.',
                                      )
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          <td
                            className="incident-table-spacer"
                            aria-hidden="true"
                          />
                        </tr>
                      ),
                    )}

                    {!loading &&
                      filteredIncidents.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign:
                                'center',
                              color:
                                'var(--text)',
                              padding:
                                '32px 21px',
                            }}
                          >
                            {incidents.length ===
                            0
                              ? 'No incident reports have been submitted yet.'
                              : 'No incidents match your search or filters.'}
                          </td>
                        </tr>
                      )}
                  </>
                )}
              </tbody>
            </table>

            <footer className="incidents-footer">
              <strong>
                Showing{' '}
                {
                  filteredIncidents.length
                }{' '}
                of{' '}
                {incidents.length}{' '}
                results
              </strong>

              <div className="incidents-pagination">
                <button
                  type="button"
                  disabled
                >
                  â€¹
                </button>

                <button
                  className="current"
                  type="button"
                >
                  1
                </button>

                <button
                  type="button"
                  disabled
                >
                  â€º
                </button>
              </div>
            </footer>
          </article>
        </div>
      </main>

      {/* =====================================================
          NEW INCIDENT MODAL
          ===================================================== */}

      {isNewIncidentOpen && (
          <div
            className="modal-overlay"
            ref={overlayRef}
            onMouseDown={
              handleOverlayMouseDown
            }
          >
            <div
              className="new-incident-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-incident-title"
            >
              <header className="new-incident-header">
                <div>
                  <h2 id="new-incident-title">
                    Report a Network
                    Incident
                  </h2>

                  <p>
                    Fill out the form below to
                    prepare a network incident
                    record.
                  </p>
                </div>

                <button
                  className="modal-close"
                  type="button"
                  aria-label="Close dialog"
                  onClick={
                    closeNewIncident
                  }
                >
                  Ã—
                </button>
              </header>

              <form
                className="new-incident-body"
                onSubmit={
                  handleSubmitNewIncident
                }
                noValidate
              >
                <div className="incident-form">
                  <fieldset
                    className="incident-form-section"
                  >
                    <legend className="sr-only">
                      Incident Details
                    </legend>

                    <div className="incident-form-section-header">
                      <span className="incident-form-badge">
                        1
                      </span>

                      <h3>
                        Incident
                        Details
                      </h3>
                    </div>

                    <div className="incident-form-grid">
                      <label className="incident-field">
                        <span className="incident-field-label">
                          Department
                        </span>

                        <input
                          type="text"
                          value={
                            values.department
                          }
                          onChange={e =>
                            handleFieldChange(
                              'department',
                              e.target
                                .value,
                            )
                          }
                          placeholder="Enter department"
                        />
                      </label>

                      <label className="incident-field">
                        <span className="incident-field-label">
                          Location / Room
                          <em>*</em>
                        </span>

                        <input
                          type="text"
                          placeholder="e.g. 2nd Floor, IT Room"
                          value={
                            values.location
                          }
                          onChange={e =>
                            handleFieldChange(
                              'location',
                              e.target
                                .value,
                            )
                          }
                        />

                        {errors.location && (
                          <span className="incident-field-error">
                            {
                              errors.location
                            }
                          </span>
                        )}
                      </label>

                      <label className="incident-field">
                        <span className="incident-field-label">
                          Issue Category
                          <em>*</em>
                        </span>

                        <select
                          value={
                            values.issueCategory
                          }
                          onChange={e =>
                            handleFieldChange(
                              'issueCategory',
                              e.target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            Select a
                            category
                          </option>

                          {ISSUE_CATEGORIES.map(
                            category => (
                              <option
                                key={
                                  category
                                }
                                value={
                                  category
                                }
                              >
                                {category}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label className="incident-field">
                        <span className="incident-field-label">
                          Device Type
                          <em>*</em>
                        </span>

                        <select
                          value={
                            values.deviceType
                          }
                          onChange={e =>
                            handleFieldChange(
                              'deviceType',
                              e.target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            Select a
                            device type
                          </option>

                          {DEVICE_TYPES.map(
                            device => (
                              <option
                                key={
                                  device
                                }
                                value={
                                  device
                                }
                              >
                                {device}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label className="incident-field">
                        <span className="incident-field-label">
                          Connection Type
                          <em>*</em>
                        </span>

                        <select
                          value={
                            values.connectionType
                          }
                          onChange={e =>
                            handleFieldChange(
                              'connectionType',
                              e.target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            Select a
                            connection
                            type
                          </option>

                          {CONNECTION_TYPES.map(
                            connection => (
                              <option
                                key={
                                  connection
                                }
                                value={
                                  connection
                                }
                              >
                                {connection}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label className="incident-field">
                        <span className="incident-field-label">
                          Severity
                          <em>*</em>
                        </span>

                        <select
                          value={
                            values.severity
                          }
                          onChange={e =>
                            handleFieldChange(
                              'severity',
                              e.target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            Select
                            severity
                          </option>

                          <option value="Low">
                            Low
                          </option>

                          <option value="Medium">
                            Medium
                          </option>

                          <option value="High">
                            High
                          </option>
                        </select>
                      </label>
                    </div>
                  </fieldset>

                  <fieldset
                    className="incident-form-section"
                  >
                    <legend className="sr-only">
                      Problem
                      Description
                    </legend>

                    <div className="incident-form-section-header">
                      <span className="incident-form-badge">
                        2
                      </span>

                      <h3>
                        Problem
                        Description
                      </h3>
                    </div>

                    <div className="incident-form-grid incident-form-grid--single">
                      <label className="incident-field">
                        <span className="incident-field-label">
                          Affected Issue /
                          Service
                          <em>*</em>
                        </span>

                        <input
                          type="text"
                          placeholder="e.g. Records System login"
                          value={
                            values.affectedService
                          }
                          onChange={e =>
                            handleFieldChange(
                              'affectedService',
                              e.target
                                .value,
                            )
                          }
                        />
                      </label>

                      <label className="incident-field">
                        <span className="incident-field-label">
                          Detailed Problem
                          Description
                          <em>*</em>
                        </span>

                        <textarea
                          rows={4}
                          placeholder="Describe what happened, when it started, and any error messages you saw."
                          value={
                            values.description
                          }
                          onChange={e =>
                            handleFieldChange(
                              'description',
                              e.target
                                .value,
                            )
                          }
                        />
                      </label>
                    </div>
                  </fieldset>
                </div>

                <footer className="new-incident-footer">
                  <button
                    className="btn-secondary btn-block"
                    type="button"
                    onClick={
                      closeNewIncident
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="btn-primary btn-block"
                    type="submit"
                  >
                    Save Incident
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}

      {/* =====================================================
          REAL DATABASE INCIDENT DETAIL
          ===================================================== */}

      {viewingIncident && ((viewingIncident: Incident) => (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewing()
            }
          }}
        >
          <div
            className="incident-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-detail-title"
          >
            <header className="incident-detail-header">
              <div>
                <h2 id="incident-detail-title">
                  {
                    viewingIncident.incidentID
                  }
                </h2>

                <p>
                  Reported{' '}
                  {
                    viewingIncident.createdAt
                  }
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                aria-label="Close dialog"
                onClick={
                  closeViewing
                }
              >
                <Icon name="close" />
              </button>
            </header>

            <div className="incident-detail-body">
              <h3 className="incident-detail-group-title">
                Incident Information
              </h3>

              <div className="incident-detail-grid">
                <div className="incident-detail-field">
                  <span>
                    Reporter
                  </span>

                  <strong>
                    <PersonName
                      name={
                        viewingIncident.employeeName
                      }
                      profilePhoto={
                        viewingIncident.reporterProfilePhoto
                      }
                    />
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Department
                  </span>

                  <strong>
                    {
                      viewingIncident.department
                    }
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Location / Room
                  </span>

                  <strong>
                    {
                      viewingIncident.location
                    }
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Issue Category
                  </span>

                  <strong>
                    {
                      viewingIncident.issueCategory
                    }
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Device Type
                  </span>

                  <strong>
                    {
                      viewingIncident.deviceType ||
                      'Not specified'
                    }
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Connection Type
                  </span>

                  <strong>
                    {
                      viewingIncident.connectionType ||
                      'Not specified'
                    }
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Severity
                  </span>

                  <strong>
                    <span
                      className={`tag ${viewingIncident.severity.toLowerCase()}-tag`}
                    >
                      {
                        viewingIncident.severity
                      }
                    </span>
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Status
                  </span>

                  <strong>
                    <span
                      className={`tag ${
                        viewingIncident.status ===
                        'Resolved'
                          ? 'resolved-tag'
                          : viewingIncident.status ===
                              'In Progress'
                            ? 'progress-tag'
                            : 'pending-tag'
                      }`}
                    >
                      {
                        viewingIncident.status
                      }
                    </span>
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Assigned
                  </span>

                  <strong>
                    {
                      viewingIncident.assigned
                    }
                  </strong>
                </div>

                <div className="incident-detail-field">
                  <span>
                    Assigned To
                  </span>

                  <strong>
                    {viewingIncident.assignedToName ||
                      viewingIncident.assignedTo ||
                      'Not assigned'}
                  </strong>
                </div>
              </div>

              <section className="incident-detail-section">
                <h3>
                  Incident Timeline
                </h3>

                <div className="incident-detail-grid">
                  <div className="incident-detail-field">
                    <span>
                      Reported At
                    </span>

                    <strong>
                      {formatIncidentDateTime(
                        viewingIncident.createdAt,
                      )}
                    </strong>
                  </div>

                  <div className="incident-detail-field">
                    <span>
                      Assigned At
                    </span>

                    <strong>
                      {formatIncidentDateTime(
                        viewingIncident.assignedAt,
                      )}
                    </strong>
                  </div>

                  <div className="incident-detail-field">
                    <span>
                      Started At
                    </span>

                    <strong>
                      {formatIncidentDateTime(
                        viewingIncident.startedAt,
                      )}
                    </strong>
                  </div>

                  <div className="incident-detail-field">
                    <span>
                      Resolved At
                    </span>

                    <strong>
                      {formatIncidentDateTime(
                        viewingIncident.resolvedAt,
                      )}
                    </strong>
                  </div>

                  <div className="incident-detail-field">
                    <span>
                      Duration
                    </span>

                    <strong>
                      {getIncidentDurationText(
                        viewingIncident,
                        liveNow,
                      )}
                    </strong>
                  </div>
                </div>

                {viewingIncident.status === 'In Progress' &&
                  viewingIncident.startedAt && (
                    <p
                      style={{
                        margin: '12px 0 0',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Duration updates automatically while this incident is in progress.
                    </p>
                  )}
              </section>

              <section className="incident-detail-section incident-detail-section--service">
                <h3>
                  Affected Issue /
                  Service
                </h3>

                <p>
                  {
                    viewingIncident.affectedIssue
                  }
                </p>
              </section>

              <section className="incident-detail-section incident-detail-section--description">
                <h3>
                  Detailed Problem
                  Description
                </h3>

                <p>
                  {
                    viewingIncident.description
                  }
                </p>
              </section>

              {(viewingIncident.classification ||
                viewingIncident.summary ||
                viewingIncident.troubleshooting) && (
                <section className="incident-ai-analysis">
                  <h3 className="incident-ai-analysis-title">
                    AI Analysis
                  </h3>

                  {viewingIncident.classification && (
                    <div className="incident-ai-block">
                      <span>
                        Classification
                      </span>

                      <p>
                        {
                          viewingIncident.classification
                        }
                      </p>
                    </div>
                  )}

                  {viewingIncident.summary && (
                    <div className="incident-ai-block">
                      <span>
                        Incident Summary
                      </span>

                      <p>
                        {
                          viewingIncident.summary
                        }
                      </p>
                    </div>
                  )}

                  {viewingIncident.troubleshooting && (
                    <div className="incident-ai-block">
                      <span>
                        Basic Self-Help
                      </span>

                      <p
                        style={{
                          whiteSpace:
                            'pre-line',
                        }}
                      >
                        {getBasicSelfHelpText(
                          viewingIncident.troubleshooting,
                        )}
                      </p>

                      {!isSecretary && (
                        <div
                          style={{
                            marginTop: '24px',
                            padding: '20px',
                            border: '2px solid currentColor',
                            borderRadius: '12px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '16px',
                              marginBottom: '12px',
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: '1.05rem',
                                  fontWeight: 900,
                                  letterSpacing: '0.02em',
                                }}
                              >
                                AI-Generated Troubleshooting Suggestion â€“ For IT Support Review
                              </h4>
                            </div>

                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '42px',
                                minHeight: '30px',
                                padding: '4px 10px',
                                border: '1px solid currentColor',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                              }}
                            >
                              IT
                            </span>
                          </div>

                          <p
                            style={{
                              margin: '0 0 16px',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                            }}
                          >
                            IT-only technical guidance. Review and validate these suggestions before taking technical action.
                          </p>

                          <div
                            style={{
                              paddingTop: '16px',
                              borderTop: '1px solid currentColor',
                              whiteSpace: 'pre-line',
                              lineHeight: 1.6,
                            }}
                          >
                            {getITTroubleshootingText(
                              viewingIncident.troubleshooting,
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {viewingIncident.resolutionNotes && (
                <section className="incident-detail-section">
                  <h3>
                    Resolution Notes
                  </h3>

                  <p>
                    {
                      viewingIncident.resolutionNotes
                    }
                  </p>
                </section>
              )}
            </div>

            <footer className="incident-detail-footer">
              <button
                className="btn-secondary"
                type="button"
                onClick={
                  closeViewing
                }
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      ))(viewingIncident!)}
    </div>
  )
}
export default Incidents
function parseDatabaseDate(value: string | null): Date | null {
  if (!value) return null

  const normalized = value.trim().replace(' ', 'T')
  const parsed = new Date(normalized)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatIncidentDateTime(value: string | null): string {
  const parsed = parseDatabaseDate(value)

  if (!parsed) return 'Not recorded'

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed)
}

function formatElapsedDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

function getIncidentDurationText(
  incident: Incident,
  nowMs: number,
): string {
  if (
    incident.status === 'In Progress' &&
    incident.startedAt
  ) {
    const startedAt = parseDatabaseDate(
      incident.startedAt,
    )

    if (startedAt) {
      const elapsedSeconds =
        (nowMs - startedAt.getTime()) / 1000

      return `${formatElapsedDuration(elapsedSeconds)} (live)`
    }
  }

  if (
    (incident.status === 'Resolved' ||
      incident.status === 'Closed') &&
    incident.durationMinutes !== null
  ) {
    return `${incident.durationMinutes} min`
  }

  return 'Not started'
}

