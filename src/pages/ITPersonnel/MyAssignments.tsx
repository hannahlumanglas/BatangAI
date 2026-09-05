import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from '../Admin/AdminNotifications'
import { PersonName } from '../../components/PersonName'
import {
  getCurrentUserId,
  getCurrentUserName,
  signOut,
} from '../../auth'
import '../Admin/Dashboard.css'
import './MyAssignments.css'

type Status = 'available' | 'in-progress' | 'solved'

type Ticket = {
  id: string
  title: string
  reporter: string
  date: string
  office: string
  severity: 'High' | 'Medium' | 'Low'
  status: Status
  actionTime?: string
  duration?: string

  description?: string
  issueCategory?: string
  deviceType?: string
  connectionType?: string
  location?: string
  classification?: string
  summary?: string
  troubleshooting?: string[]
}

type IconName =
  | 'incidents'
  | 'assign'
  | 'devices'
  | 'profile'
  | 'menu'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    incidents: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" />
      </>
    ),
    assign: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" />
        <path d="M18 8v6M15 11h6" />
      </>
    ),
    devices: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="1.5" />
        <path d="M8 21h8M12 17v4" />
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
  icon: Exclude<IconName, 'menu'>
  path: string
}[] = [
  {
    label: 'All Incidents',
    icon: 'incidents',
    path: '/it/incidents',
  },
  {
    label: 'My Assignments',
    icon: 'assign',
    path: '/it/my-assignments',
  },
  {
    label: 'Device Monitoring',
    icon: 'devices',
    path: '/it/device-monitoring',
  },
  {
    label: 'Profile',
    icon: 'profile',
    path: '/it/profile',
  },
]

function ThemeToggle() {
  const [dark, setDark] = useState(
    () =>
      document.documentElement.getAttribute('data-theme') ===
      'dark',
  )

  const toggle = () => {
    const next = !dark

    setDark(next)

    document.documentElement.setAttribute(
      'data-theme',
      next ? 'dark' : 'light',
    )

    localStorage.setItem(
      'batangai-theme',
      next ? 'dark' : 'light',
    )
  }

  return (
    <button
      type="button"
      className="theme-toggle-button assignment-theme-toggle"
      onClick={toggle}
      aria-label={
        dark
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      }
    >
      {dark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
        </svg>
      )}
    </button>
  )
}

function ITProfileMenu({
  onLogout,
}: {
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  const currentUserName = getCurrentUserName()

  useEffect(() => {
    if (!open) return

    const close = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)

    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const goProfile = () => {
    setOpen(false)
    navigate('/it/profile')
  }

  const initials = currentUserName
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="profile-menu-root assignment-profile-menu"
      ref={rootRef}
    >
      <button
        type="button"
        className="topbar-user profile-menu-trigger"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="topbar-avatar">
          {initials}
        </div>

        <div>
          <strong>{currentUserName}</strong>
          <span>IT Personnel</span>
        </div>

        <span
          className={`profile-menu-chevron${
            open ? ' open' : ''
          }`}
        >
          ⌄
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
            onClick={goProfile}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" />
            </svg>
            My Profile
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={goProfile}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" />
            </svg>
            Settings
          </button>

          <button
            type="button"
            role="menuitem"
            className="assignment-password-item"
            onClick={goProfile}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
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
            onClick={onLogout}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

function formatDate(
  dateValue: string | null | undefined,
) {
  if (!dateValue) {
    return 'Unknown date'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(
  dateValue: string | null | undefined,
) {
  if (!dateValue) {
    return undefined
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(
  minutes: number | string,
) {
  const totalMinutes = Number(minutes)

  if (Number.isNaN(totalMinutes)) {
    return undefined
  }

  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }

  return `${remainingMinutes}m`
}

function MyAssignments() {
  const navigate = useNavigate()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(
    null,
  )
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] =
    useState<string | null>(null)

  const currentUserId = getCurrentUserId()
  const currentUserName = getCurrentUserName()

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError('')

      if (currentUserId === null) {
        setError(
          'No logged-in IT Personnel account was found.',
        )
        return
      }

      const response = await fetch(
        'http://localhost/BatangAI/api/incidents.php',
      )

      if (!response.ok) {
        throw new Error(
          'Failed to load incident reports.',
        )
      }

      const data = await response.json()

      if (
        !data.success ||
        !Array.isArray(data.incidents)
      ) {
        throw new Error(
          'Invalid incident data received from server.',
        )
      }

      const myAssignments = data.incidents.filter(
        (incident: any) =>
          incident.assignedTo !== null &&
          String(incident.assignedTo) ===
            String(currentUserId),
      )

      const mappedTickets: Ticket[] =
        myAssignments.map((incident: any) => {
          let status: Status = 'available'

          const incidentStatus = String(
            incident.status || '',
          ).toLowerCase()

          if (
            incidentStatus === 'resolved' ||
            incidentStatus === 'solved'
          ) {
            status = 'solved'
          } else if (
            incidentStatus === 'in progress' ||
            incidentStatus === 'in-progress'
          ) {
            status = 'in-progress'
          }

          let troubleshooting: string[] = []

          if (
            Array.isArray(incident.troubleshooting)
          ) {
            troubleshooting =
              incident.troubleshooting
          } else if (
            typeof incident.troubleshooting ===
            'string'
          ) {
            try {
              const parsed = JSON.parse(
                incident.troubleshooting,
              )

              if (Array.isArray(parsed)) {
                troubleshooting = parsed
              } else {
                troubleshooting = [
                  incident.troubleshooting,
                ]
              }
            } catch {
              troubleshooting =
                incident.troubleshooting
                  ? [incident.troubleshooting]
                  : []
            }
          }

          return {
            id: incident.incidentID,

            title:
              incident.affectedIssue ||
              incident.issueCategory ||
              'Network Incident',

            reporter:
              incident.employeeName ||
              'Unknown Employee',

            date: formatDate(
              incident.createdAt,
            ),

            office:
              incident.department ||
              incident.location ||
              'Unknown Department',

            severity:
              incident.severity === 'High'
                ? 'High'
                : incident.severity === 'Medium'
                  ? 'Medium'
                  : 'Low',

            status,

            actionTime: incident.startedAt
              ? formatDateTime(
                  incident.startedAt,
                )
              : undefined,

            duration:
              incident.durationMinutes !== null &&
              incident.durationMinutes !==
                undefined
                ? formatDuration(
                    incident.durationMinutes,
                  )
                : undefined,

            description:
              incident.description,

            issueCategory:
              incident.issueCategory,

            deviceType:
              incident.deviceType,

            connectionType:
              incident.connectionType,

            location:
              incident.location,

            classification:
              incident.classification,

            summary:
              incident.summary,

            troubleshooting,
          }
        })

      setTickets(mappedTickets)
    } catch (err) {
      console.error(
        'Error loading assignments:',
        err,
      )

      setError(
        'Unable to load your assigned incident reports.',
      )
    } finally {
      setLoading(false)
    }
  }

  const available = tickets.filter(
    ticket => ticket.status === 'available',
  )

  const inProgress = tickets.filter(
    ticket => ticket.status === 'in-progress',
  )

  const solved = tickets.filter(
    ticket => ticket.status === 'solved',
  )

  const takeAction = async (id: string) => {
    if (actionLoading) {
      return
    }

    try {
      setActionLoading(id)

      const response = await fetch(
        'http://localhost/BatangAI/api/update_incident_status.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incidentID: id,
            status: 'In Progress',
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to update incident status.',
        )
      }

      /*
       * Update the ticket immediately in React.
       * This makes the status visible without
       * refreshing the browser.
       */
      setTickets(current =>
        current.map(ticket =>
          ticket.id === id
            ? {
                ...ticket,
                status: 'in-progress',
                actionTime: 'Just now',
              }
            : ticket,
        ),
      )

      /*
       * If the report modal is currently open,
       * update the selected report too.
       */
      setSelected(current =>
        current && current.id === id
          ? {
              ...current,
              status: 'in-progress',
              actionTime: 'Just now',
            }
          : current,
      )
    } catch (err) {
      console.error(
        'Take Action error:',
        err,
      )

      alert(
        err instanceof Error
          ? err.message
          : 'Failed to take action on this incident.',
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = () => {
    signOut()
    navigate('/')
  }

  return (
    <div
      className={`admin-shell assignment-shell${
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
          aria-label="IT Personnel navigation"
        >
          {navigation.map(item => (
            <button
              key={item.label}
              className={
                item.label ===
                'My Assignments'
                  ? 'is-active'
                  : ''
              }
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
        <header className="admin-topbar assignment-topbar">
          <button
            className="menu-button"
            type="button"
            aria-label="Toggle menu"
            onClick={() =>
              setSidebarCollapsed(
                value => !value,
              )
            }
          >
            <Icon name="menu" />
          </button>

          <div className="topbar-title">
            <h1>My Assignments</h1>

            <p>
              Manage your assigned incident
              tickets and track resolution time.
            </p>
          </div>

          <ThemeToggle />

          <AdminNotifications />

          <ITProfileMenu
            onLogout={handleLogout}
          />
        </header>

        <section className="assignment-content">
          {loading && (
            <div className="assignment-loading">
              Loading your assigned incidents...
            </div>
          )}

          {!loading && error && (
            <div className="assignment-error">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <section
                className="assignment-stats"
                aria-label="Assignment status summary"
              >
                <article className="assignment-stat assignment-stat--pending">
                  <div className="assignment-stat-icon">
                    ◷
                  </div>

                  <div>
                    <span>Pending</span>
                    <strong>
                      {available.length}
                    </strong>
                  </div>
                </article>

                <article className="assignment-stat assignment-stat--progress">
                  <div className="assignment-stat-icon">
                    ⟳
                  </div>

                  <div>
                    <span>In Progress</span>
                    <strong>
                      {inProgress.length}
                    </strong>
                  </div>
                </article>

                <article className="assignment-stat assignment-stat--resolved">
                  <div className="assignment-stat-icon">
                    ✓
                  </div>

                  <div>
                    <span>Resolved</span>
                    <strong>
                      {solved.length}
                    </strong>
                  </div>
                </article>
              </section>

              {tickets.length === 0 && (
                <div className="assignment-empty">
                  <h3>
                    No Assigned Incidents
                  </h3>

                  <p>
                    There are currently no
                    incident reports assigned to{' '}
                    {currentUserName}.
                  </p>
                </div>
              )}

              {available.length > 0 && (
                <TicketGroup
                  title={`Assigned to Me (${available.length})`}
                  tone="available"
                  tickets={available}
                  onView={setSelected}
                  onTakeAction={takeAction}
                  actionLoading={actionLoading}
                />
              )}

              {inProgress.length > 0 && (
                <TicketGroup
                  title={`In Progress (${inProgress.length})`}
                  tone="in-progress"
                  tickets={inProgress}
                  onView={setSelected}
                  onTakeAction={takeAction}
                  actionLoading={actionLoading}
                />
              )}

              {solved.length > 0 && (
                <TicketGroup
                  title={`Resolved by Me (${solved.length})`}
                  tone="solved"
                  tickets={solved}
                  onView={setSelected}
                  onTakeAction={takeAction}
                  actionLoading={actionLoading}
                />
              )}
            </>
          )}
        </section>
      </main>

      {selected && (
        <ReportModal
          ticket={selected}
          onClose={() =>
            setSelected(null)
          }
          onTakeAction={takeAction}
          actionLoading={actionLoading}
        />
      )}
    </div>
  )
}

function TicketGroup({
  title,
  tone,
  tickets,
  onView,
  onTakeAction,
  actionLoading,
}: {
  title: string
  tone: Status
  tickets: Ticket[]
  onView: (ticket: Ticket) => void
  onTakeAction: (id: string) => void
  actionLoading: string | null
}) {
  return (
    <section
      className={`ticket-group ticket-group--${tone}`}
    >
      <h3>
        <span>
          {tone === 'available'
            ? '◷'
            : tone === 'solved'
              ? '✓'
              : '◌'}
        </span>

        {title}
      </h3>

      {tickets.map(ticket => (
        <article
          className="ticket-card"
          key={ticket.id}
        >
          <div className="ticket-card-title">
            <div>
              <small>{ticket.id}</small>

              <h4>{ticket.title}</h4>
            </div>

            <b
              className={`severity severity--${ticket.severity.toLowerCase()}`}
            >
              {ticket.severity}
            </b>
          </div>

          {/* STATUS */}
          <div className="ticket-status-row">
            <span
              className={`ticket-status ticket-status--${ticket.status}`}
            >
              {ticket.status === 'available'
                ? 'Pending'
                : ticket.status === 'in-progress'
                  ? 'In Progress'
                  : 'Resolved'}
            </span>
          </div>

          <div className="ticket-meta">
            <PersonName
              name={ticket.reporter}
              compact
            />

            <span>
              ◷ {ticket.date}
            </span>
          </div>

          <p>{ticket.office}</p>

          {ticket.actionTime && (
            <div className="ticket-action-time">
              ◉ Action taken at{' '}
              {ticket.actionTime}

              {ticket.duration &&
                ` · Duration: ${ticket.duration}`}
            </div>
          )}

          <div className="ticket-actions">
            <button
              type="button"
              onClick={() =>
                onView(ticket)
              }
            >
              ✧ View Report &amp; AI
            </button>

            {ticket.status === 'available' && (
              <button
                type="button"
                className="take-action"
                disabled={
                  actionLoading === ticket.id
                }
                onClick={() =>
                  onTakeAction(ticket.id)
                }
              >
                {actionLoading === ticket.id
                  ? 'Updating...'
                  : '▷ Take Action'}
              </button>
            )}

            {ticket.status === 'in-progress' && (
              <button
                type="button"
                className="take-action"
                disabled
              >
                ✓ In Progress
              </button>
            )}

            {ticket.status === 'solved' && (
              <button
                type="button"
                disabled
              >
                ✓ Resolved
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}

function ReportModal({
  ticket,
  onClose,
  onTakeAction,
  actionLoading,
}: {
  ticket: Ticket
  onClose: () => void
  onTakeAction: (id: string) => void
  actionLoading: string | null
}) {
  return (
    <div
      className="assignment-modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <section
        className="assignment-report"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
      >
        <header>
          <div>
            <h2 id="report-title">
              {ticket.id} — Full Report
            </h2>

            <p className="person-line-label">
              Submitted by{' '}
              <PersonName
                name={ticket.reporter}
                compact
              />{' '}
              · {ticket.office}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close report"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="report-body">
          <div className="report-details">
            <p>
              <span>Location</span>
              {ticket.location ||
                'Not specified'}
            </p>

            <p>
              <span>Category</span>
              {ticket.issueCategory ||
                'Not specified'}
            </p>

            <p>
              <span>Device Type</span>
              {ticket.deviceType ||
                'Not specified'}
            </p>

            <p>
              <span>Connection</span>
              {ticket.connectionType ||
                'Not specified'}
            </p>

            <p>
              <span>Status</span>
              {ticket.status === 'available'
                ? 'Pending'
                : ticket.status === 'in-progress'
                  ? 'In Progress'
                  : 'Resolved'}
            </p>
          </div>

          <section className="report-problem">
            <span>
              PROBLEM DESCRIPTION
            </span>

            <p>
              {ticket.description ||
                'No problem description provided.'}
            </p>
          </section>

          <section className="ai-solution">
            <header>
              <strong>
                ✧ BatangAI Recommended
                Solution
              </strong>

              <span>
                AI Assistance
              </span>
            </header>

            <h3>
              {ticket.classification ||
                'Network Incident'}
            </h3>

            <p>
              {ticket.summary ||
                'No AI troubleshooting summary is available yet.'}
            </p>

            {ticket.troubleshooting &&
              ticket.troubleshooting
                .length > 0 && (
                <ol>
                  {ticket.troubleshooting.map(
                    (step, index) => (
                      <li key={index}>
                        {step}
                      </li>
                    ),
                  )}
                </ol>
              )}
          </section>
        </div>

        {ticket.status === 'available' && (
          <footer>
            <button
              type="button"
              disabled={
                actionLoading === ticket.id
              }
              onClick={() =>
                onTakeAction(ticket.id)
              }
            >
              {actionLoading === ticket.id
                ? 'Updating...'
                : '▷ Take Action'}
            </button>
          </footer>
        )}

        {ticket.status === 'in-progress' && (
          <footer>
            <button
              type="button"
              disabled
            >
              ✓ In Progress
            </button>
          </footer>
        )}
      </section>
    </div>
  )
}

export default MyAssignments