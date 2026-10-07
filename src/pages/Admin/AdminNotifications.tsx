import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthSession } from '../../auth'
import { API_BASE_URL } from '../../apiConfig'

type IncidentNotificationSource = {
  incidentID: string | number
  assigned?: string | null
  assignedAt?: string | null
  assignedTo?: string | number | null
  affectedIssue?: string | null
  createdAt?: string | null
  employeeName?: string | null
  issueCategory?: string | null
}

type Notification = {
  id: string
  title: string
  detail: string
  time: string
  incidentID: string
}

const INCIDENTS_URL = `${API_BASE_URL}/get_incidents.php`
const REFRESH_INTERVAL_MS = 15_000

function relativeTime(value: string | null | undefined) {
  if (!value) return 'Recently'

  const timestamp = new Date(value.trim().replace(' ', 'T')).getTime()
  if (Number.isNaN(timestamp)) return 'Recently'

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function timestamp(value: string | null | undefined) {
  if (!value) return 0
  const parsed = new Date(value.trim().replace(' ', 'T')).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function notificationForReport(incident: IncidentNotificationSource): Notification {
  const issue = incident.affectedIssue?.trim() || incident.issueCategory?.trim() || 'Incident requires attention'

  return {
    id: `incident-${incident.incidentID}-reported`,
    title: 'New incident report',
    detail: `${issue} · ${incident.employeeName?.trim() || 'Employee'}`,
    time: relativeTime(incident.createdAt),
    incidentID: String(incident.incidentID),
  }
}

function notificationForAssignment(incident: IncidentNotificationSource): Notification {
  const issue = incident.affectedIssue?.trim() || incident.issueCategory?.trim() || 'Incident requires attention'
  const assignedAt = incident.assignedAt?.trim() || ''

  return {
    id: `incident-${incident.incidentID}-assigned-${assignedAt}`,
    title: 'Incident assigned to you',
    detail: `${issue} · ${incident.incidentID}`,
    time: relativeTime(assignedAt || incident.createdAt),
    incidentID: String(incident.incidentID),
  }
}

function readStorageKey() {
  const user = getAuthSession()?.user
  return `batangai-read-notifications-${user?.role ?? 'guest'}-${user?.email ?? 'guest'}`
}

function initializedStorageKey() {
  const user = getAuthSession()?.user
  return `batangai-notifications-initialized-${user?.role ?? 'guest'}-${user?.email ?? 'guest'}`
}

function loadReadIds() {
  try {
    const saved = localStorage.getItem(readStorageKey())
    const parsed: unknown = saved ? JSON.parse(saved) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

export function AdminNotifications() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const saveReadIds = useCallback((next: Set<string>) => {
    setReadIds(next)
    localStorage.setItem(readStorageKey(), JSON.stringify([...next]))
  }, [])

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(false)

    try {
      const user = getAuthSession()?.user
      const userId = user?.userID
      const role = user?.role

      if (
        userId === undefined ||
        userId === null ||
        !['Administrator', 'Secretary', 'IT Personnel'].includes(role ?? '')
      ) {
        setNotifications([])
        return
      }

      const response = await fetch(
        `${INCIDENTS_URL}?userID=${encodeURIComponent(String(userId))}`,
        { signal, cache: 'no-store' },
      )
      const data = await response.json() as {
        success?: boolean
        incidents?: IncidentNotificationSource[]
      }

      if (!response.ok || !data.success || !Array.isArray(data.incidents)) {
        throw new Error('Unable to load notifications')
      }

      const eventIncidents = role === 'IT Personnel'
        ? data.incidents
            .filter(incident =>
              String(incident.assignedTo ?? '') === String(userId) &&
              Boolean(incident.assignedAt) &&
              incident.assigned?.toLowerCase() === 'yes',
            )
            .sort((a, b) => timestamp(b.assignedAt) - timestamp(a.assignedAt))
        : data.incidents
            .filter(incident => Boolean(incident.createdAt))
            .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))
      const eventNotifications = role === 'IT Personnel'
        ? eventIncidents.map(notificationForAssignment)
        : eventIncidents.map(notificationForReport)

      if (!localStorage.getItem(initializedStorageKey())) {
        saveReadIds(new Set([
          ...loadReadIds(),
          ...eventNotifications.map(notification => notification.id),
        ]))
        localStorage.setItem(initializedStorageKey(), 'true')
      }

      setNotifications(eventNotifications.slice(0, 6))
    } catch (requestError) {
      if ((requestError as Error).name !== 'AbortError') setError(true)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [saveReadIds])

  useEffect(() => {
    const controller = new AbortController()
    const initialLoad = window.setTimeout(() => void loadNotifications(controller.signal), 0)
    const refreshTimer = window.setInterval(() => void loadNotifications(), REFRESH_INTERVAL_MS)

    return () => {
      controller.abort()
      window.clearTimeout(initialLoad)
      window.clearInterval(refreshTimer)
    }
  }, [loadNotifications])

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const unread = useMemo(
    () => notifications.filter(notification => !readIds.has(notification.id)).length,
    [notifications, readIds],
  )

  const markAllRead = () => {
    saveReadIds(new Set([...readIds, ...notifications.map(notification => notification.id)]))
  }

  const openNotification = (notification: Notification) => {
    saveReadIds(new Set([...readIds, notification.id]))
    setOpen(false)

    const role = getAuthSession()?.user.role
    const incidentPath = role === 'IT Personnel'
      ? '/it/my-assignments'
      : role === 'Secretary'
        ? '/secretary/incidents'
        : '/admin/incidents'
    navigate(incidentPath, {
      state: { openIncidentId: notification.incidentID },
    })
  }

  if (!['Administrator', 'Secretary', 'IT Personnel'].includes(
    getAuthSession()?.user.role ?? '',
  )) {
    return null
  }

  return (
    <div className="notification-menu-root" ref={rootRef}>
        <button
          className="notification-button"
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
        >
          <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" /></svg>
          {unread > 0 && <b>{unread > 99 ? '99+' : unread}</b>}
        </button>

        {open && (
          <section className="notification-dropdown" aria-label="Notifications" role="menu" aria-busy={loading}>
            <div className="notification-dropdown-header">
              <h2>Notifications</h2>
              {unread > 0 ? (
                <button type="button" onClick={markAllRead}>Mark all as read</button>
              ) : (
                <span className="notification-all-read">All caught up</span>
              )}
            </div>

            <div className="notification-list">
              {loading && <p className="notification-state">Loading notifications…</p>}
              {!loading && error && <p className="notification-state">Notifications are unavailable. Please try again.</p>}
              {!loading && !error && notifications.length === 0 && <p className="notification-state">No new incident notifications.</p>}
              {!loading && !error && notifications.map(notification => {
                const isRead = readIds.has(notification.id)
                return (
                  <button
                    className={`notification-item${isRead ? ' is-read' : ''}`}
                    key={notification.id}
                    role="menuitem"
                    type="button"
                    onClick={() => openNotification(notification)}
                  >
                    <span className="notification-indicator" aria-hidden="true" />
                    <span>
                      <strong>{notification.title}</strong>
                      <span>{notification.detail}</span>
                      <time>{notification.time}</time>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
    </div>
  )
}
