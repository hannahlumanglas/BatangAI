import { useEffect, useRef, useState } from 'react'

const notifications = [
  { id: 'incident', title: 'New high-priority incident', detail: 'Office Wi-Fi connectivity requires attention.', time: '10 minutes ago' },
  { id: 'device', title: 'Device status changed', detail: 'Core Router B is currently offline.', time: '35 minutes ago' },
]

export function AdminNotifications() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(notifications.length)
  const rootRef = useRef<HTMLDivElement>(null)

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

  const toggleNotifications = () => setOpen(current => !current)

  return (
    <div className="notification-menu-root" ref={rootRef}>
      <button
        className="notification-button"
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleNotifications}
      >
        <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" /></svg>
        {unread > 0 && <b>{unread}</b>}
      </button>
      {open && (
        <section className="notification-dropdown" aria-label="Notifications" role="menu">
          <div className="notification-dropdown-header">
            <h2>Notifications</h2>
            {unread > 0 ? (
              <button type="button" onClick={() => setUnread(0)}>Mark all as read</button>
            ) : (
              <span className="notification-all-read">All caught up</span>
            )}
          </div>
          <div className="notification-list">
            {notifications.map(notification => (
              <article className={`notification-item${unread === 0 ? ' is-read' : ''}`} key={notification.id} role="menuitem">
                <span className="notification-indicator" aria-hidden="true" />
                <div>
                  <h3>{notification.title}</h3>
                  <p>{notification.detail}</p>
                  <time>{notification.time}</time>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
