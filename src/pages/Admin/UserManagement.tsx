import { useMemo, useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import { getAuthSession, signOut } from '../../auth'
import './Dashboard.css'
import './UserManagement.css'

/* ---------- Types ---------- */

type UserRole =
  | 'Employee'
  | 'Secretary'
  | 'IT Personnel'
  | 'Administrator'

type UserStatus = 'Active' | 'Inactive'

type UserMenuAction =
  | 'view'
  | 'edit'
  | 'reset'
  | 'disable'

type UserPanelMode = 'view' | 'edit' | 'reset'

type User = {
  id: string
  employeeId: string
  name: string
  initial: string
  email: string
  department: string
  role: UserRole
  status: UserStatus
  joined: string
}

/* ---------- API ---------- */

const USERS_API_URL = 'http://localhost/BatangAI/api/users.php'
const UPDATE_USER_API_URL = 'http://localhost/BatangAI/api/update_user.php'

/**
 * Converts the date from MySQL into a readable date.
 */
function formatJoinedDate(dateValue: string): string {
  if (!dateValue) {
    return '—'
  }

  const date = new Date(dateValue.replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Converts the database user returned by users.php
 * into the User structure used by this page.
 */
function mapDatabaseUser(databaseUser: any): User {
  const fullName = String(
    databaseUser.fullName ?? 'Unknown User',
  )

  const userID = String(
    databaseUser.userID ?? '',
  )

  const databaseRole = String(
    databaseUser.role ?? 'Employee',
  )

  const role: UserRole = databaseRole.toLowerCase() === 'admin'
    ? 'Administrator'
    : databaseRole as UserRole

  const status = String(
    databaseUser.status ?? 'Active',
  ) as UserStatus

  return {
    id: userID,
    employeeId: String(
      databaseUser.employeeId ?? '',
    ),
    name: fullName,
    initial: fullName
      .split(/\s+/)
      .map(part => part[0])
      .slice(0, 1)
      .join('')
      .toUpperCase(),
    email: String(
      databaseUser.email ?? '',
    ),
    department: String(
      databaseUser.department ?? '',
    ),
    role,
    status,
    joined: formatJoinedDate(
      String(databaseUser.dateCreated ?? ''),
    ),
  }
}

/**
 * Gets all users from the PHP/MySQL API.
 */
async function fetchUsers(): Promise<User[]> {
  const response = await fetch(
    USERS_API_URL,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(
      `Users API returned HTTP ${response.status}.`,
    )
  }

  const data = await response.json()

  if (!data.success || !Array.isArray(data.users)) {
    throw new Error(
      data.message || 'Unable to load users.',
    )
  }

  return data.users.map(mapDatabaseUser)
}

async function updateUserOnServer(payload: Record<string, string>) {
  const response = await fetch(UPDATE_USER_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to update the user.')
  }
}

/* ---------- Avatar ---------- */

function avatarUrl(name: string) {
  const colors = [
    '#0b5cff',
    '#007f5f',
    '#7c3aed',
    '#c2410c',
    '#be123c',
  ]

  const color =
    colors[
      [...name].reduce(
        (total, letter) =>
          total + letter.charCodeAt(0),
        0,
      ) % colors.length
    ]

  const initials = name
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
    >
      <rect
        width="96"
        height="96"
        rx="48"
        fill="${color}"
      />

      <circle
        cx="48"
        cy="35"
        r="17"
        fill="#fff"
        fill-opacity=".92"
      />

      <path
        d="M18 86c4-19 16-29 30-29s26 10 30 29"
        fill="#fff"
        fill-opacity=".92"
      />

      <text
        x="48"
        y="88"
        text-anchor="middle"
        fill="${color}"
        font-family="Arial,sans-serif"
        font-size="14"
        font-weight="700"
      >
        ${initials}
      </text>
    </svg>
  `)}`
}

/* ---------- Icons ---------- */

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
  | 'shield'
  | 'admin'
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

    bell: (
      <>
        <path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" />
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

    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.3 8-8 10-4.7-2-8-5-8-10V6l8-3Z" />
        <path d="m8 14 8-8M8 6l8 8" />
      </>
    ),

    admin: (
      <>
        <path d="M4 18h16M6 18l1-8 5 3 5-3 1 8M9 7l3-4 3 4" />
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

/* ---------- Dots Icon ---------- */

function DotsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="5"
        r="1.6"
        fill="currentColor"
      />

      <circle
        cx="12"
        cy="12"
        r="1.6"
        fill="currentColor"
      />

      <circle
        cx="12"
        cy="19"
        r="1.6"
        fill="currentColor"
      />
    </svg>
  )
}

/* ---------- Statistics ---------- */

function StatCard({
  icon,
  number,
  title,
  tone,
}: {
  icon: IconName
  number: number
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

/* ---------- Badges ---------- */

function RoleBadge({
  role,
}: {
  role: UserRole
}) {
  return (
    <span
      className={`role role--${role
        .toLowerCase()
        .replace(/ /g, '-')}`}
    >
      {role}
    </span>
  )
}

function StatusBadge({
  status,
}: {
  status: UserStatus
}) {
  return (
    <span
      className={`status status--${status.toLowerCase()}`}
    >
      <i />
      {status}
    </span>
  )
}

/* ---------- Navigation ---------- */

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

/* ---------- Three-dot action menu ---------- */

function UserMenu({
  status,
  onAction,
  onClose,
}: {
  status: UserStatus
  onAction: (
    action: UserMenuAction,
  ) => void
  onClose: () => void
}) {
  const items: {
    key: UserMenuAction
    label: string
    danger?: boolean
  }[] = [
    {
      key: 'view',
      label: 'View Profile',
    },
    {
      key: 'edit',
      label: 'Edit User',
    },
    {
      key: 'reset',
      label: 'Reset Password',
    },
    {
      key: 'disable',
      label:
        status === 'Active'
          ? 'Disable Account'
          : 'Enable Account',
    },
  ]

  return (
    <>
      <div
        className="user-menu-backdrop"
        onClick={e => {
          e.stopPropagation()
          onClose()
        }}
      />

      <div
        className="user-menu"
        role="menu"
        onClick={e =>
          e.stopPropagation()
        }
      >
        {items.map(item => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            className={
              item.danger
                ? 'danger'
                : ''
            }
            onClick={() => {
              onAction(item.key)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

/* ---------- User Card ---------- */

function UserCard({
  user,
  selected,
  menuOpen,
  onSelect,
  onToggleMenu,
  onMenuAction,
}: {
  user: User
  selected: boolean
  menuOpen: boolean
  onSelect: (
    id: string,
  ) => void
  onToggleMenu: (
    id: string,
  ) => void
  onMenuAction: (
    action: UserMenuAction,
    user: User,
  ) => void
}) {
  return (
    <article
      className={`user-card${
        selected ? ' selected' : ''
      }`}
      onClick={() =>
        onSelect(user.id)
      }
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={e => {
        if (
          e.key === 'Enter' ||
          e.key === ' '
        ) {
          e.preventDefault()
          onSelect(user.id)
        }
      }}
    >
      <div className="user-card-top">
        <div className="user-card-identity">
          <span className="user-card-avatar">
            <img
              src={avatarUrl(user.name)}
              alt={`${user.name} profile`}
            />
          </span>

          <div>
            <strong>
              {user.name}
            </strong>

            <small>
              {user.employeeId}
            </small>
          </div>
        </div>

        <div className="user-card-menu-anchor">
          <button
            type="button"
            className="user-card-menu-btn"
            aria-label={`Actions for ${user.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={e => {
              e.stopPropagation()
              onToggleMenu(user.id)
            }}
          >
            <DotsIcon />
          </button>

          {menuOpen && (
            <UserMenu
              status={user.status}
              onClose={() =>
                onToggleMenu(user.id)
              }
              onAction={action =>
                onMenuAction(
                  action,
                  user,
                )
              }
            />
          )}
        </div>
      </div>

      <div className="user-card-meta">
        <RoleBadge role={user.role} />
        <StatusBadge
          status={user.status}
        />
      </div>

      <dl className="user-card-details">
        <div>
          <dt>Department</dt>
          <dd>
            {user.department}
          </dd>
        </div>

        <div>
          <dt>Joined</dt>
          <dd>
            {user.joined}
          </dd>
        </div>
      </dl>
    </article>
  )
}

/* ---------- Change Password ---------- */

function ChangePasswordCard({
  user,
  onSaved,
  resetMode = false,
}: {
  user: User
  onSaved: () => Promise<void>
  resetMode?: boolean
}) {
  const [
    newPassword,
    setNewPassword,
  ] = useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [saving, setSaving] = useState(false)

  const clearForm = () => {
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }

  const handleUpdate = async () => {
    setSuccess('')

    if (newPassword.length < 8) {
      setError(
        'Password must be at least 8 characters long.',
      )
      return
    }

    if (
      !/[A-Z]/.test(
        newPassword,
      ) ||
      !/[0-9]/.test(
        newPassword,
      )
    ) {
      setError(
        'Password must include at least one uppercase letter and one number.',
      )
      return
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        'Passwords do not match.',
      )
      return
    }

    setError('')

    try {
      setSaving(true)
      await updateUserOnServer({ action: 'password', userID: user.id, password: newPassword })
      setSuccess(`Password updated for ${user.name}.`)
      setNewPassword('')
      setConfirmPassword('')
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className={`dashboard-card um-password-card${resetMode ? ' is-reset-mode' : ''}`}>
      <header className="um-panel-heading">
        <div>
          <p className="um-eyebrow">Security</p>
          <h2>{resetMode ? 'Reset Password' : 'Password & Security'}</h2>
          <span>{resetMode ? `Set a new password for ${user.name}.` : 'Update this account password when needed.'}</span>
        </div>
      </header>

      <label className="um-field">
        <span>
          New Password
        </span>

        <input
          type="password"
          value={newPassword}
          onChange={e =>
            setNewPassword(
              e.target.value,
            )
          }
          placeholder="Enter new password"
          autoComplete="new-password"
        />
      </label>

      <label className="um-field">
        <span>
          Confirm Password
        </span>

        <input
          type="password"
          value={
            confirmPassword
          }
          onChange={e =>
            setConfirmPassword(
              e.target.value,
            )
          }
          placeholder="Re-enter new password"
          autoComplete="new-password"
        />
      </label>

      {error && (
        <p className="um-form-message um-form-error">
          {error}
        </p>
      )}

      {success && (
        <p className="um-form-message um-form-success">
          {success}
        </p>
      )}

      <div className="um-password-actions">
        <button
          type="button"
          className="um-btn-primary"
          onClick={
            handleUpdate
          }
          disabled={saving}
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>

        <button
          type="button"
          className="um-btn-secondary"
          onClick={
            clearForm
          }
        >
          Cancel
        </button>
      </div>
    </article>
  )
}

/* ---------- Selected User Details ---------- */

function EditUserCard({ user, onSaved, onCancel }: { user: User; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [values, setValues] = useState({ name: user.name, employeeId: user.employeeId, email: user.email, department: user.department, role: user.role })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!values.name.trim() || !values.employeeId.trim() || !values.department.trim() || !values.email.trim()) { setError('Complete all account fields before saving.'); return }
    try {
      setSaving(true); setError('')
      await updateUserOnServer({ action: 'update', userID: user.id, fullName: values.name.trim(), employeeId: values.employeeId.trim(), email: values.email.trim(), department: values.department.trim(), role: values.role })
      await onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save user changes.') } finally { setSaving(false) }
  }
  return <article className="dashboard-card um-edit-card"><header><div><h2>Edit User</h2><p>Update account details and access role.</p></div><button className="um-text-button" type="button" onClick={onCancel}>Cancel</button></header><div className="um-edit-grid"><label className="um-field"><span>Full Name</span><input value={values.name} onChange={e => setValues(current => ({ ...current, name: e.target.value }))} /></label><label className="um-field"><span>Employee ID</span><input value={values.employeeId} onChange={e => setValues(current => ({ ...current, employeeId: e.target.value }))} /></label><label className="um-field"><span>Email Address</span><input type="email" value={values.email} onChange={e => setValues(current => ({ ...current, email: e.target.value }))} /></label><label className="um-field"><span>Department</span><input value={values.department} onChange={e => setValues(current => ({ ...current, department: e.target.value }))} /></label><label className="um-field"><span>Role</span><select value={values.role} onChange={e => setValues(current => ({ ...current, role: e.target.value as UserRole }))}><option>Employee</option><option>Secretary</option><option>IT Personnel</option><option>Administrator</option></select></label></div>{error && <p className="um-form-message um-form-error">{error}</p>}<footer><button className="um-btn-secondary" type="button" onClick={onCancel}>Cancel</button><button className="um-btn-primary" type="button" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save Changes'}</button></footer></article>
}

function UserDetails({ user, mode, onModeChange, onSaved }: { user: User; mode: UserPanelMode; onModeChange: (mode: UserPanelMode) => void; onSaved: () => Promise<void> }) {
  if (mode === 'edit') return <EditUserCard user={user} onSaved={onSaved} onCancel={() => onModeChange('view')} />
  if (mode === 'reset') return <ChangePasswordCard user={user} onSaved={onSaved} resetMode />
  return (
    <div className="um-details-grid">
      <article className="dashboard-card um-account-card">
        <header className="um-panel-heading um-account-heading">
          <div><p className="um-eyebrow">User profile</p><h2>Account Information</h2><span>Identity, contact details, and access level.</span></div>
          <button type="button" className="um-text-button" onClick={() => onModeChange('edit')}>Edit account</button>
        </header>

        <div className="um-account-profile">
          <span className="um-account-avatar">
            <img
              src={avatarUrl(
                user.name,
              )}
              alt={`${user.name} profile`}
            />
          </span>

          <div>
            <strong>
              {user.name}
            </strong>

            <StatusBadge
              status={user.status}
            />
          </div>
        </div>

        <dl className="um-account-fields">
          <div>
            <dt>
              Email Address
            </dt>

            <dd>
              {user.email}
            </dd>
          </div>

          <div>
            <dt>
              Employee ID
            </dt>

            <dd>
              {user.employeeId}
            </dd>
          </div>

          <div>
            <dt>
              Department
            </dt>

            <dd>
              {user.department}
            </dd>
          </div>

          <div>
            <dt>Role</dt>

            <dd>
              <RoleBadge
                role={user.role}
              />
            </dd>
          </div>

          <div>
            <dt>
              Account Status
            </dt>

            <dd>
              <StatusBadge
                status={user.status}
              />
            </dd>
          </div>
        </dl>
      </article>

      <ChangePasswordCard user={user} onSaved={onSaved} />
    </div>
  )
}

/* ---------- Theme ---------- */

type Theme =
  | 'light'
  | 'dark'

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

/* ---------- Profile Menu ---------- */

function ProfileMenu({
  name,
  role,
  onLogout,
}: {
  name: string
  role: string
  avatarInitial: string
  onLogout: () => void
}) {
  const [open, setOpen] =
    useState(false)

  const navigate =
    useNavigate()

  const rootRef =
    useRef<HTMLDivElement>(
      null,
    )

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (
      e: MouseEvent,
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
      e: KeyboardEvent,
    ) => {
      if (
        e.key === 'Escape'
      ) {
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
          setOpen(
            current => !current,
          )
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="topbar-avatar">
          {name
            .split(/\s+/)
            .map(
              part =>
                part[0],
            )
            .slice(0, 2)
            .join('')
            .toUpperCase()}
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
            onClick={
              goToProfile
            }
          >
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
            Settings
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={
              goToProfile
            }
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

/* ---------- Page ---------- */

function UserManagement() {
  const navigate =
    useNavigate()

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false)

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const [query, setQuery] =
    useState('')

  const [role, setRole] =
    useState('All Roles')

  /*
   * IMPORTANT:
   * Start with an empty array.
   *
   * We no longer use mockUsers.
   * Users are loaded from users.php.
   */
  const [users, setUsers] =
    useState<User[]>([])

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState<
    string | null
  >(null)

  const [
    menuOpenId,
    setMenuOpenId,
  ] = useState<
    string | null
  >(null)

  const [panelMode, setPanelMode] = useState<UserPanelMode>('view')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  /* ---------- Current Admin ---------- */

  const authSession =
    getAuthSession()

  const adminName =
    authSession?.user.fullName ||
    'Administrator'

  const adminRole =
    authSession?.user.role ||
    'Administrator'

  /* ---------- Load Users ---------- */

  const loadUsers =
    async () => {
      setLoading(true)
      setError('')

      try {
        const databaseUsers =
          await fetchUsers()

        setUsers(
          databaseUsers,
        )

        /*
         * If a previously selected user
         * no longer exists, clear selection.
         */
        setSelectedUserId(
          current => {
            if (
              current &&
              !databaseUsers.some(
                user =>
                  user.id ===
                  current,
              )
            ) {
              return null
            }

            return current
          },
        )
      } catch (err) {
        console.error(
          'Failed to load users:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load users from the database.',
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (!selectedUserId) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedUserId(null)
        setPanelMode('view')
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [selectedUserId])

  /* ---------- Search / Filter ---------- */

  const shown = useMemo(
    () =>
      users.filter(
        user =>
          (
            role ===
              'All Roles' ||
            user.role ===
              role
          ) &&
          `${user.name} ${user.email} ${user.employeeId} ${user.department}`
            .toLowerCase()
            .includes(
              query.toLowerCase(),
            ),
      ),
    [
      query,
      role,
      users,
    ],
  )

  const selectedUser =
    useMemo(
      () =>
        users.find(
          user =>
            user.id ===
            selectedUserId,
        ) ?? null,
      [
        users,
        selectedUserId,
      ],
    )

  /* ---------- Logout ---------- */

  const handleLogout =
    () => {
      signOut()
      navigate('/')
    }

  /* ---------- Select User ---------- */

  const handleSelect = (
    id: string,
  ) => {
    setMenuOpenId(null)

    setSelectedUserId(
      current =>
        current === id
          ? null
          : id,
    )
  }

  /* ---------- Toggle Menu ---------- */

  const handleToggleMenu = (
    id: string,
  ) => {
    setMenuOpenId(
      current =>
        current === id
          ? null
          : id,
    )
  }

  /* ---------- Menu Actions ---------- */

  const handleMenuAction = (
    action: UserMenuAction,
    user: User,
  ) => {
    setMenuOpenId(null)

    switch (action) {
      case 'view':
        setSelectedUserId(
          user.id,
        )
        setPanelMode('view')
        break

      case 'edit':
        setSelectedUserId(
          user.id,
        )

        setPanelMode('edit')
        break

      case 'reset':
        setSelectedUserId(
          user.id,
        )

        setPanelMode('reset')
        break

      case 'disable': {
        const nextStatus: UserStatus =
          user.status ===
          'Active'
            ? 'Inactive'
            : 'Active'

        const verb =
          nextStatus ===
          'Inactive'
            ? 'disable'
            : 're-enable'

        if (
          window.confirm(
            `Are you sure you want to ${verb} ${user.name}'s account?`,
          )
        ) {
          void updateUserOnServer({ action: 'status', userID: user.id, status: nextStatus })
            .then(loadUsers)
            .catch(err => window.alert(err instanceof Error ? err.message : 'Unable to update account status.'))
        }

        break
      }

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
            Batang
            <span>AI</span>
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
                  'User Management'
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
                c => !c,
              )
            }
          >
            <Icon name="menu" />
          </button>

          <div className="topbar-title">
            <h1>
              User Management
            </h1>

            <p>
              Manage all system accounts and permissions.
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
            avatarInitial={
              adminName
                .charAt(0)
                .toUpperCase()
            }
            onLogout={
              handleLogout
            }
          />
        </header>

        <div className="dashboard-content">
          {/* ---------- Statistics ---------- */}

          <section className="statistics-grid um-stats">
            <StatCard
              icon="users"
              number={
                users.length
              }
              title="Total Users"
              tone="green"
            />

            <StatCard
              icon="profile"
              number={
                users.filter(
                  user =>
                    user.role ===
                    'Employee',
                ).length
              }
              title="Employee"
              tone="blue"
            />

            <StatCard
              icon="incidents"
              number={
                users.filter(
                  user =>
                    user.role ===
                    'Secretary',
                ).length
              }
              title="Secretary"
              tone="orange"
            />

            <StatCard
              icon="shield"
              number={
                users.filter(
                  user =>
                    user.role ===
                    'IT Personnel',
                ).length
              }
              title="IT Personnel"
              tone="blue"
            />

            <StatCard
              icon="admin"
              number={
                users.filter(
                  user =>
                    user.role ===
                    'Administrator',
                ).length
              }
              title="Admins"
              tone="orange"
            />
          </section>

          {/* ---------- Search / Filter ---------- */}

          <section className="incident-tools um-tools">
            <label className="incident-search">
              <Icon name="search" />

              <input
                value={query}
                onChange={e =>
                  setQuery(
                    e.target.value,
                  )
                }
                placeholder="Search by name, email, or ID..."
              />
            </label>

            <label className="um-filter-select">
              Role

              <select
                value={role}
                onChange={e =>
                  setRole(
                    e.target.value,
                  )
                }
              >
                <option>
                  All Roles
                </option>

                <option>
                  Employee
                </option>

                <option>
                  Secretary
                </option>

                <option>
                  IT Personnel
                </option>

                <option>
                  Administrator
                </option>
              </select>
            </label>
          </section>

          {/* ---------- Loading ---------- */}

          {loading && (
            <div className="um-empty">
              Loading users from the database...
            </div>
          )}

          {/* ---------- Error ---------- */}

          {!loading &&
            error && (
              <div className="um-empty">
                <strong>
                  Unable to load users.
                </strong>

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  className="um-btn-primary"
                  onClick={
                    loadUsers
                  }
                >
                  Try Again
                </button>
              </div>
            )}

          {/* ---------- Users ---------- */}

          {!loading &&
            !error &&
            shown.length >
              0 && (
              <section className="um-grid">
                {shown.map(
                  user => (
                    <UserCard
                      key={
                        user.id
                      }
                      user={
                        user
                      }
                      selected={
                        selectedUserId ===
                        user.id
                      }
                      menuOpen={
                        menuOpenId ===
                        user.id
                      }
                      onSelect={
                        handleSelect
                      }
                      onToggleMenu={
                        handleToggleMenu
                      }
                      onMenuAction={
                        handleMenuAction
                      }
                    />
                  ),
                )}
              </section>
            )}

          {/* ---------- Empty ---------- */}

          {!loading &&
            !error &&
            shown.length ===
              0 && (
              <div className="um-empty">
                No users match your search or filter.
              </div>
            )}

        </div>
      </main>

      {selectedUser && (
        <div
          className="um-modal-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setSelectedUserId(null)
              setPanelMode('view')
            }
          }}
        >
          <section className="um-modal" role="dialog" aria-modal="true" aria-label={`${panelMode === 'edit' ? 'Edit' : panelMode === 'reset' ? 'Reset password for' : 'Profile for'} ${selectedUser.name}`}>
            <button className="um-modal-close" type="button" onClick={() => { setSelectedUserId(null); setPanelMode('view') }} aria-label="Close">×</button>
            <UserDetails
              user={selectedUser}
              mode={panelMode}
              onModeChange={setPanelMode}
              onSaved={async () => { await loadUsers(); setPanelMode('view') }}
            />
          </section>
        </div>
      )}
    </div>
  )
}
export default UserManagement
