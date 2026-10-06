import { useState, useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import logo from '../../assets/logo.png'

import { AdminNotifications } from '../Admin/AdminNotifications'
import { ProfileMenu } from './Profile'
import { getAuthSession } from '../../auth'
import { IncidentDetailModal } from '../../components/IncidentDetailModal'

import {
  IncidentDetailsFields,
  IncidentDescriptionFields,
} from './ReportIncident'

import type { IncidentFormValues } from './ReportIncident'

import '../Admin/Dashboard.css'
import './Incidents.css'
import './ReportIncident.css'

import { API_BASE_URL } from '../../apiConfig'

type IconName =
  | 'report'
  | 'incidents'
  | 'profile'
  | 'menu'
  | 'logout'
  | 'eye'
  | 'more'
  | 'edit'
  | 'trash'
  | 'close'
  | 'check'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    report: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M10 12h5M10 16h5" />
      </>
    ),

    incidents: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" />
      </>
    ),

    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" />
      </>
    ),

    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),

    logout: (
      <>
        <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),

    eye: (
      <>
        <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    more: (
      <>
        <circle cx="12" cy="5" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </>
    ),

    edit: (
      <>
        <path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
        <path d="m13.8 7.2 3 3" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16M10 11v5M14 11v5M6 7l1 14h10l1-14M9 7V4h6v3" />
      </>
    ),

    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.7 2.7L16.5 9" />
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
  {
    label: 'Report Incident',
    icon: 'report',
    path: '/employee/report-incident',
  },
  {
    label: 'All Incidents',
    icon: 'incidents',
    path: '/employee/incidents',
  },
  {
    label: 'Profile',
    icon: 'profile',
    path: '/employee/profile',
  },
]

type Status =
  | 'Pending'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'

const statusTagClass: Record<Status, string> = {
  Pending: 'pending-tag',
  'In Progress': 'progress-tag',
  Resolved: 'resolved-tag',
  Closed: 'resolved-tag',
}

type EmployeeIncident = {
  incidentID: string
  userId: string
  department: string
  location: string
  issueCategory: string
  deviceType: string
  connectionType: string
  severity: 'High' | 'Medium' | 'Low' | null
  affectedIssue: string
  description: string
  status: Status
  createdAt: string
  employeeName: string
  classification: string | null
  keywords: string[] | null
  summary: string | null
  troubleshooting: string | null
  assigned: 'Yes' | 'No'
  assignedTo: string | null
  assignedToName: string | null
  resolutionNotes: string | null
  resolvedAt: string | null
  resolvedBy: string | null
  startedAt: string | null
  assignedAt: string | null
  durationMinutes: number | null
}

type IncidentsResponse = {
  success: boolean
  count: number
  incidents: EmployeeIncident[]
  message?: string
}

/* ---------- Theme ---------- */

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'batangai-theme'

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(
    THEME_STORAGE_KEY,
  )

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return 'light'
}

function useTheme() {
  const [theme, setTheme] =
    useState<Theme>(readStoredTheme)

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
      current === 'dark'
        ? 'light'
        : 'dark',
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

/* ---------- Helpers ---------- */

function normalizeStatus(
  value: unknown,
): Status {
  if (
    value === 'Pending' ||
    value === 'In Progress' ||
    value === 'Resolved' ||
    value === 'Closed'
  ) {
    return value
  }

  return 'Pending'
}

function normalizeSeverity(
  value: unknown,
): 'High' | 'Medium' | 'Low' | null {
  if (
    value === 'High' ||
    value === 'Medium' ||
    value === 'Low'
  ) {
    return value
  }

  return null
}

function normalizeIncident(
  incident: Partial<EmployeeIncident>,
): EmployeeIncident {
  return {
    incidentID: String(
      incident.incidentID ?? '',
    ),

    userId: String(
      incident.userId ?? '',
    ),

    department:
      incident.department ?? '',

    location:
      incident.location ?? '',

    issueCategory:
      incident.issueCategory ?? '',

    deviceType:
      incident.deviceType ?? '',

    connectionType:
      incident.connectionType ?? '',

    severity:
      normalizeSeverity(
        incident.severity,
      ),

    affectedIssue:
      incident.affectedIssue ?? '',

    description:
      incident.description ?? '',

    status:
      normalizeStatus(
        incident.status,
      ),

    createdAt:
      incident.createdAt ?? '',

    employeeName:
      incident.employeeName ?? '',

    classification:
      incident.classification ??
      null,

    keywords:
      incident.keywords ?? null,

    summary:
      incident.summary ?? null,

    troubleshooting:
      incident.troubleshooting ??
      null,

    assigned:
      incident.assigned === 'Yes'
        ? 'Yes'
        : 'No',

    assignedTo:
      incident.assignedTo ??
      null,

    assignedToName:
      incident.assignedToName ??
      null,

    resolutionNotes:
      incident.resolutionNotes ??
      null,

    resolvedAt:
      incident.resolvedAt ??
      null,

    resolvedBy:
      incident.resolvedBy ??
      null,

    startedAt:
      incident.startedAt ??
      null,

    assignedAt:
      incident.assignedAt ??
      null,

    durationMinutes:
      incident.durationMinutes ??
      null,
  }
}

/*
 * Employees must never see the technical IT troubleshooting section.
 *
 * The complete troubleshooting value remains stored in the database.
 * This helper extracts only the employee troubleshooting portion.
 */
function getEmployeeTroubleshooting(
  troubleshooting: string | null,
): string | null {
  if (!troubleshooting) {
    return null
  }

  const completionRecord = troubleshooting.match(/\[Employee checked self-help steps: [^\]]*\]/i)?.[0] ?? ''
  const basicSelfHelp = troubleshooting
    .replace(/\[Employee checked self-help steps: [^\]]*\]/i, '')
    .split(/IT Troubleshooting Suggestions:/i)[0]
    .trim()

  return [basicSelfHelp, completionRecord].filter(Boolean).join('\n') || null
}

/* ---------- Page ---------- */

function Incidents() {
  const navigate = useNavigate()

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false)

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const [
    incidents,
    setIncidents,
  ] = useState<EmployeeIncident[]>(
    [],
  )

  const [loading, setLoading] =
    useState(true)

  const [apiError, setApiError] =
    useState('')

  const [viewing, setViewing] =
    useState<EmployeeIncident | null>(
      null,
    )

  const [
    menuOpenId,
    setMenuOpenId,
  ] = useState<string | null>(null)

  const [editing, setEditing] =
    useState<EmployeeIncident | null>(
      null,
    )

  const [
    editForm,
    setEditForm,
  ] = useState<IncidentFormValues>({
    severity: '',
    department: '',
    location: '',
    issueCategory: '',
    deviceType: '',
    connectionType: '',
    affectedService: '',
    description: '',
  })

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false)

  const [
    editError,
    setEditError,
  ] = useState('')

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null)
  const [deletionTarget, setDeletionTarget] = useState<EmployeeIncident | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const handleLogout = () => {
    localStorage.removeItem(
      'batangai-admin-auth',
    )

    navigate('/')
  }

  /* =========================================================
     LOAD REAL DATABASE INCIDENTS
     ========================================================= */

  const fetchEmployeeIncidents =
    async () => {
      try {
        setLoading(true)
        setApiError('')

        const session =
          getAuthSession()

        const currentUserId =
          session?.user?.userID

        if (
          currentUserId ===
            undefined ||
          currentUserId === null ||
          String(
            currentUserId,
          ).trim() === ''
        ) {
          setIncidents([])

          setApiError(
            'Your login session could not be verified. Please log in again.',
          )

          return
        }

        const response =
          await fetch(
            `${API_BASE_URL}/get_incidents.php?userID=${encodeURIComponent(
              String(
                currentUserId,
              ),
            )}`,
            {
              method: 'GET',
              headers: {
                Accept:
                  'application/json',
              },
              cache: 'no-store',
            },
          )

        const responseText =
          await response.text()

        let data: IncidentsResponse

        try {
          data =
            JSON.parse(
              responseText,
            ) as IncidentsResponse
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
              'Failed to load your incident reports.',
          )
        }

        const allIncidents =
          Array.isArray(
            data.incidents,
          )
            ? data.incidents.map(
                normalizeIncident,
              )
            : []

        setIncidents(
          allIncidents,
        )
      } catch (error) {
        console.error(
          'Fetch employee incidents error:',
          error,
        )

        setIncidents([])

        setApiError(
          error instanceof Error
            ? error.message
            : 'Unable to load your incident reports.',
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    void fetchEmployeeIncidents()
  }, [])

  /* =========================================================
     CLOSE ACTION MENU WHEN CLICKING OUTSIDE
     ========================================================= */

  useEffect(() => {
    const handleOutsidePointerDown =
      (event: PointerEvent) => {
        const target = event.target
        if (
          target instanceof Element &&
          target.closest('.employee-more-wrap')
        ) {
          return
        }

        setMenuOpenId(null)
      }

    if (menuOpenId === null) {
      return
    }

    document.addEventListener(
      'pointerdown',
      handleOutsidePointerDown,
      true,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown,
        true,
      )
    }
  }, [menuOpenId])

  /* =========================================================
     LOCK BACKGROUND SCROLL WHILE A MODAL IS OPEN
     ========================================================= */

  useEffect(() => {
    const modalIsOpen =
      viewing !== null ||
      editing !== null

    if (!modalIsOpen) {
      return
    }

    const previousOverflow =
      document.body.style
        .overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [viewing, editing])

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const handleNavigation = (
    path: string,
  ) => {
    setMenuOpenId(null)
    navigate(path)
  }

  /* =========================================================
     VIEW INCIDENT
     ========================================================= */

  const handleView = (
    incident: EmployeeIncident,
  ) => {
    setMenuOpenId(null)
    setViewing(incident)
  }

  const closeViewing = () => {
    setViewing(null)
  }

  /*
   * Create an Employee-safe version of the incident.
   *
   * The original incident remains untouched in state.
   */
  const employeeViewingIncident =
    viewing
      ? {
          ...viewing,
          troubleshooting:
            getEmployeeTroubleshooting(
              viewing.troubleshooting,
            ),
        }
      : null

  /* =========================================================
     EDIT INCIDENT
     ========================================================= */

  const handleEdit = (
    incident: EmployeeIncident,
  ) => {
    setMenuOpenId(null)

    if (incident.status === 'Resolved' || incident.status === 'Closed') {
      alert('Resolved incidents cannot be edited.')
      return
    }

    if (
      incident.status !==
      'Pending'
    ) {
      alert(
        'This incident is already being worked on, so it can no longer be edited. Please contact IT Personnel or the Administrator for changes.',
      )

      return
    }

    setEditError('')

    setEditForm({
      severity: incident.severity ?? '',
      department:
        incident.department,

      location:
        incident.location,

      issueCategory:
        incident.issueCategory,

      deviceType:
        incident.deviceType,

      connectionType:
        incident.connectionType,

      affectedService:
        incident.affectedIssue,

      description:
        incident.description,
    })

    setEditing(incident)
  }

  const closeEditing = () => {
    if (savingEdit) {
      return
    }

    setEditing(null)
    setEditError('')
  }

  const handleEditFieldChange = (
    field: keyof IncidentFormValues,
    value: string,
  ) => {
    setEditForm(current => ({
      ...current,
      [field]: value,
    }))
  }

  /*
   * Save edited incident details.
   *
   * AI analysis is generated during the Report Incident
   * workflow. Editing an existing incident does not run a
   * rule-based analysis or fabricate an AI response.
   */
  const handleSaveEditChanges =
    async () => {
      if (!editing) {
        return
      }

      try {
        setSavingEdit(true)
        setEditError('')

        const response =
          await fetch(
            `${API_BASE_URL}/update_incident.php`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Accept:
                  'application/json',
              },
              body: JSON.stringify({
                incidentID:
                  editing.incidentID,

                department:
                  editForm.department,

                location:
                  editForm.location,

                issueCategory:
                  editForm.issueCategory,

                deviceType:
                  editForm.deviceType,

                connectionType:
                  editForm.connectionType,

                affectedIssue:
                  editForm.affectedService,

                description:
                  editForm.description,

                /*
                 * Keep the existing AI-generated
                 * classification, summary, and
                 * troubleshooting unchanged.
                 */
                classification:
                  editing.classification,

                summary:
                  editing.summary,

                troubleshooting:
                  editing.troubleshooting,
              }),
            },
          )

        const responseText =
          await response.text()

        let data: {
          success: boolean
          message?: string
        }

        try {
          data =
            JSON.parse(
              responseText,
            )
        } catch {
          console.error(
            'Invalid JSON from update_incident.php:',
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
              'Failed to update the incident.',
          )
        }

        setIncidents(current =>
          current.map(item =>
            item.incidentID ===
            editing.incidentID
              ? {
                  ...item,

                  department:
                    editForm.department,

                  location:
                    editForm.location,

                  issueCategory:
                    editForm.issueCategory,

                  deviceType:
                    editForm.deviceType,

                  connectionType:
                    editForm.connectionType,

                  affectedIssue:
                    editForm.affectedService,

                  description:
                    editForm.description,
                }
              : item,
          ),
        )

        setEditing(null)
        setEditError('')
      } catch (error) {
        console.error(
          'Update incident error:',
          error,
        )

        setEditError(
          error instanceof Error
            ? error.message
            : 'Failed to update the incident.',
        )
      } finally {
        setSavingEdit(false)
      }
    }

  /* =========================================================
     DELETE INCIDENT
     ========================================================= */

  const handleDelete = (incident: EmployeeIncident) => {
    setMenuOpenId(null)
    if (incident.status !== 'Pending') return
    setDeleteError('')
    setDeletionTarget(incident)
  }

  const confirmDeleteIncident = async () => {
    if (!deletionTarget || deletingId) return
    const incident = deletionTarget
    try {
      setDeletingId(
        incident.incidentID,
      )

      const response =
        await fetch(
          `${API_BASE_URL}/delete_incident.php`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Accept:
                'application/json',
            },
            body: JSON.stringify({
              incidentID:
                incident.incidentID,
            }),
          },
        )

      const responseText =
        await response.text()

      let data: {
        success: boolean
        message?: string
      }

      try {
        data =
          JSON.parse(
            responseText,
          )
      } catch {
        console.error(
          'Invalid JSON from delete_incident.php:',
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
            'Failed to delete the incident.',
        )
      }

      setIncidents(current =>
        current.filter(
          item =>
            item.incidentID !==
            incident.incidentID,
        ),
      )
      setDeletionTarget(null)
    } catch (error) {
      console.error(
        'Delete incident error:',
        error,
      )

      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Failed to delete the incident.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  /* =========================================================
     CURRENT EMPLOYEE INFORMATION
     ========================================================= */

  const session =
    getAuthSession()

  const currentUser =
    session?.user

  const employeeName =
    currentUser?.fullName ||
    'Employee'

  const employeeRole =
    currentUser?.role ||
    'Employee'

  const profileInitial =
    employeeName
      .trim()
      .split(/\s+/)
      .map(
        part =>
          part.charAt(0),
      )
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'E'

  return (
    <div
      className={`admin-shell${
        sidebarCollapsed
          ? ' sidebar-collapsed'
          : ''
      }`}
    >
      {/* =====================================================
          SIDEBAR
          ===================================================== */}

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
          aria-label="Employee navigation"
        >
          {navigation.map(
            item => (
              <button
                key={item.label}
                type="button"
                className={
                  item.label ===
                  'All Incidents'
                    ? 'is-active'
                    : ''
                }
                onClick={() =>
                  handleNavigation(
                    item.path,
                  )
                }
              >
                <Icon
                  name={
                    item.icon
                  }
                />

                <span>
                  {item.label}
                </span>
              </button>
            ),
          )}
        </nav>
      </aside>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

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
              All Incidents
            </h1>

            <p>
              View your reported incidents and their current status.
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
            name={employeeName}
            role={employeeRole}
            avatarInitial={
              profileInitial
            }
            onLogout={
              handleLogout
            }
          />
        </header>

        <div className="dashboard-content">
          {/* =================================================
              DATABASE ERROR
              ================================================= */}

          {apiError && (
            <div
              style={{
                padding:
                  '16px 20px',

                marginBottom:
                  '16px',

                borderRadius:
                  '10px',

                border:
                  '1px solid #f1aeb5',

                background:
                  '#f8d7da',

                color:
                  '#842029',
              }}
            >
              <strong>
                Unable to load incident reports.
              </strong>

              <div>
                {apiError}
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchEmployeeIncidents()
                }
                style={{
                  marginTop:
                    '10px',
                  cursor:
                    'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              INCIDENT TABLE
              ================================================= */}

          <article className="dashboard-card employee-incidents-card">
            <div className="employee-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      Incident ID
                    </th>

                    <th>
                      Severity
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        className="employee-empty"
                        colSpan={4}
                      >
                        Loading your incident reports...
                      </td>
                    </tr>
                  ) : incidents.length ===
                    0 ? (
                    <tr>
                      <td
                        className="employee-empty"
                        colSpan={4}
                      >
                        No incident reports yet. Submit one from Report Incident.
                      </td>
                    </tr>
                  ) : (
                    incidents.map(
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
                            <span
                              className={incident.severity ? `tag ${incident.severity.toLowerCase()}-tag` : 'tag'}
                            >
                              {incident.severity ?? 'Not set'}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`tag ${
                                statusTagClass[
                                  incident.status
                                ]
                              }`}
                            >
                              {
                                incident.status
                              }
                            </span>
                          </td>

                          <td className="employee-actions">
                            <button
                              type="button"
                              className="employee-view-button"
                              onClick={() =>
                                handleView(
                                  incident,
                                )
                              }
                              aria-label={`View ${incident.incidentID}`}
                            >
                              <Icon
                                name="eye"
                              />

                              View
                            </button>

                            <div
                              className="employee-more-wrap"
                              onClick={event =>
                                event.stopPropagation()
                              }
                            >
                              <button
                                type="button"
                                className="employee-more-button"
                                onClick={() =>
                                  setMenuOpenId(
                                    current =>
                                      current ===
                                      incident.incidentID
                                        ? null
                                        : incident.incidentID,
                                  )
                                }
                                aria-label={`More actions for ${incident.incidentID}`}
                                aria-expanded={
                                  menuOpenId ===
                                  incident.incidentID
                                }
                              >
                                <Icon
                                  name="more"
                                />
                              </button>

                              {menuOpenId ===
                                incident.incidentID && (
                                <div className="employee-action-menu">
                                  <button
                                    type="button"
                                    disabled={
                                      incident.status !==
                                      'Pending'
                                    }
                                    title={
                                      incident.status !==
                                      'Pending'
                                        ? 'Already being worked on — contact IT Personnel or the Administrator to make changes.'
                                        : undefined
                                    }
                                    onClick={() =>
                                      handleEdit(
                                        incident,
                                      )
                                    }
                                  >
                                    <Icon
                                      name="edit"
                                    />

                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="danger"
                                    disabled={
                                      incident.status !==
                                        'Pending' ||
                                      deletingId ===
                                        incident.incidentID
                                    }
                                    title={
                                      incident.status !==
                                      'Pending'
                                        ? 'Already being worked on — contact IT Personnel or the Administrator to delete it.'
                                        : undefined
                                    }
                                    onClick={() =>
                                      void handleDelete(
                                        incident,
                                      )
                                    }
                                  >
                                    <Icon
                                      name="trash"
                                    />

                                    {deletingId ===
                                    incident.incidentID
                                      ? 'Deleting...'
                                      : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </main>

      {/* =====================================================
          VIEW INCIDENT MODAL
          ===================================================== */}

      {employeeViewingIncident && (
        <IncidentDetailModal
          incident={
            employeeViewingIncident
          }
          onClose={
            closeViewing
          }
          showSelfHelpChecklist
        />
      )}

      {/* =====================================================
          EDIT INCIDENT MODAL
          ===================================================== */}

      {editing && (
        <div
          className="employee-modal-overlay"
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditing()
            }
          }}
        >
          <section
            className="employee-incident-modal employee-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-edit-title"
          >
            <header>
              <div>
                <h2 id="employee-edit-title">
                  Edit{' '}
                  {
                    editing.incidentID
                  }
                </h2>

                <p>
                  Update the report details below, then save your changes.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEditing
                }
                aria-label="Close"
                disabled={
                  savingEdit
                }
              >
                <Icon name="close" />
              </button>
            </header>

            {editError && (
              <div
                style={{
                  margin:
                    '20px 22px 0',

                  padding:
                    '12px 14px',

                  borderRadius:
                    '9px',

                  border:
                    '1px solid #f1aeb5',

                  background:
                    '#f8d7da',

                  color:
                    '#842029',

                  fontSize:
                    'var(--font-secondary)',
                }}
              >
                {editError}
              </div>
            )}

            <form
              id="employee-edit-form"
              className="incident-form"
              onSubmit={event => {
                event.preventDefault()

                void handleSaveEditChanges()
              }}
            >
              <IncidentDetailsFields
                values={editForm}
                onChange={
                  handleEditFieldChange
                }
                departmentEditable
              />

              <IncidentDescriptionFields
                values={editForm}
                onChange={
                  handleEditFieldChange
                }
              />
            </form>

            <footer>
              <button
                type="button"
                className="employee-cancel"
                onClick={
                  closeEditing
                }
                disabled={
                  savingEdit
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                form="employee-edit-form"
                className="employee-view-button"
                disabled={
                  savingEdit
                }
              >
                <Icon name="check" />

                {savingEdit
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </footer>
          </section>
        </div>
      )}
      {deletionTarget && (
        <div className="employee-modal-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && !deletingId && setDeletionTarget(null)}>
          <section className="employee-incident-modal employee-delete-confirmation" role="dialog" aria-modal="true" aria-labelledby="delete-incident-title">
            <header>
              <div>
                <h2 id="delete-incident-title">Delete incident?</h2>
                <p>{deletionTarget.incidentID}</p>
              </div>
              <button type="button" aria-label="Close" disabled={Boolean(deletingId)} onClick={() => setDeletionTarget(null)}><Icon name="close" /></button>
            </header>
            <section>
              <p>This permanently deletes the pending incident report. This action cannot be undone.</p>
              {deleteError && <p className="employee-delete-error" role="alert">{deleteError}</p>}
            </section>
            <footer>
              <button type="button" className="employee-cancel" disabled={Boolean(deletingId)} onClick={() => setDeletionTarget(null)}>Cancel</button>
              <button type="button" className="employee-delete-confirm-button" disabled={Boolean(deletingId)} onClick={() => void confirmDeleteIncident()}>
                <Icon name="trash" />{deletingId ? 'Deleting...' : 'Delete incident'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default Incidents
