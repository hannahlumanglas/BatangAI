import { useMemo, useState, useEffect, useRef } from 'react'
import type { JSX, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './UserManagement.css'
import {
  getAuthSession,
  getProfilePhotoUrl,
  signOut,
} from '../../auth'
import { API_BASE_URL } from '../../apiConfig'

/* --------- API ---------- */
const USERS_API_URL = `${API_BASE_URL}/users.php`
const UPDATE_USER_API_URL = `${API_BASE_URL}/update_user.php`
const CREATE_USER_API_URL = `${API_BASE_URL}/create_user.php`
const UPDATE_USER_STATUS_API_URL = `${API_BASE_URL}/update_user_status.php`
/* ---------- Types ---------- */
type UserRole =
  | 'Employee'
  | 'Secretary'
  | 'IT Personnel'
  | 'Administrator'

type UserStatus = 'Active' | 'Inactive'

type UserAccountAction =
  | 'edit'
  | 'reset'
  | 'disable'

type UserPanelMode = 'view' | 'edit' | 'reset'

type User = {
  id: string
  userID?: number | string
  employeeId: string
  name: string
  initial: string
  email: string
  department: string
  role: UserRole
  status: UserStatus
  joined: string
  profilePhoto?: string | null
}

type CreateUserRole =
  | 'Employee'
  | 'Secretary'
  | 'IT Personnel'
  | 'Administrator'

type CreateUserForm = {
  fullName: string
  employeeId: string
  department: string
  email: string
  role: CreateUserRole
  password: string
  confirmPassword: string
}

const CITY_HALL_DEPARTMENTS = [
  'Office of the City Accountant',
  'Office of the City Administrator',
  'Office of the City Assessor',
  'Office of the City Budget Officer',
  'Office of the City Civil Registrar',
  'Office of the City Disaster Risk Reduction & Management Officer',
  'Office of the City Engineer',
  'Office of the City Environment & Natural Resources Officer',
  'Office of the City General Services Officer',
  'Office of the City Health Officer',
  'Office of the City Legal Officer',
  'Office of the City Market Administrator',
  'Office of the City Mayor',
  'Office of the City Planning & Development Coordinator',
  'Office of the City Prosecutor',
  'Office of the City Social Welfare and Development Officer',
  'Office of the City Treasurer',
  'Office of the City Veterinarian',
  'Colegio ng Lungsod ng Batangas',
  'Office of the City Human Resource Management Officer',
  'Office of the City Internal Audit Service',
  'Office of the City Agriculturist',
  'Office of the Sangguniang Panlungsod',
  'City Local Government Operation Officer VI â€“ DILG',
  'Chief of Police, City PNP Office',
  'City Fire Marshal',
  'City Schools Division Superintendent â€“ DepEd',
  'City Warden',
  'City Wardress',
  'COMELEC Election Officer IV',
  'MTCC Judge Branch I',
  'MTCC Judge Branch II',
  'State Auditor IV â€“ Commission on Audit',
  "City Mayor's Division",
  "Mayor's Action Center",
  'Business Permits & Licensing Office',
  'Discipline, Safety & Security Office',
  'City Tourism Office',
  'Information Technology Services Division',
  'Local Economic Development & Investment Promotion Office',
  'Office of the Senior Citizen Affairs',
  'Public Affairs and Assistance Division',
  'Public Library and Information Center',
  'Public Employment Services Office',
  'Public Information Office',
  'Transportation Development and Regulatory Office',
] as const
/* ---------- Helpers ---------- */
function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
function formatJoinedDate(value: string | null | undefined) {
  if (!value) return 'â€”'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
function normalizeRole(value: string): UserRole {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'admin' || normalized === 'administrator') {
    return 'Administrator'
  }

  if (normalized === 'secretary') {
    return 'Secretary'
  }

  if (
    normalized === 'it personnel' ||
    normalized === 'it_personnel' ||
    normalized === 'it-personnel'
  ) {
    return 'IT Personnel'
  }

  return 'Employee'
}

function normalizeStatus(value: string): UserStatus {
  return value.trim().toLowerCase() === 'inactive'
    ? 'Inactive'
    : 'Active'
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
/* ---------- Small shared pieces ---------- */
function RoleBadge({ role }: { role: UserRole }) {
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
function StatusBadge({ status }: { status: UserStatus }) {
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
/* =========================================================
   USER DIRECTORY ROW
   ========================================================= */
function UserDirectoryRow({
  user,
  onSelect,
}: {
  user: User
  onSelect: (id: string) => void
}) {
  return (
    <div className="um-directory-row">
      <button className="um-directory-name" type="button" onClick={() => onSelect(user.id)}>
        <span className="user-card-avatar"><img src={getProfilePhotoUrl(user.profilePhoto, user.name, user.role)} alt="" /></span>
        <span><strong>{user.name}</strong></span>
      </button>
    </div>
  )
}
/* =========================================================
   CHANGE PASSWORD
   Existing UI retained.
   ========================================================= */
function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
      {visible && <path d="M4 20 20 4" />}
    </svg>
  )
}

function ChangePasswordCard({
  user,
  onSaved,
  onCancel,
  resetMode = false,
}: {
  user: User
  onSaved: () => Promise<void>
  onCancel?: () => void
  resetMode?: boolean
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updating, setUpdating] = useState(false)

  const clearForm = () => {
    if (updating) return

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }

  const handleUpdate = async () => {
    setError('')
    setSuccess('')

    if (!currentPassword) {
      setError('Enter your current Administrator password to continue.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter.')
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter.')
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number.')
      return
    }

    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      setError('Password must contain at least one special character.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const targetUserID = user.userID

    if (
      targetUserID === undefined ||
      targetUserID === null ||
      String(targetUserID).trim() === ''
    ) {
      setError('Unable to identify the selected user.')
      return
    }

    const session = getAuthSession()
    const adminUserID = session?.user?.userID

    if (
      adminUserID === undefined ||
      adminUserID === null ||
      String(adminUserID).trim() === ''
    ) {
      setError('Administrator session not found. Please log in again.')
      return
    }

    setUpdating(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/change_password.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            adminUserID,
            userID: targetUserID,
            currentPassword,
            newPassword,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to update the password.',
        )
      }

      setSuccess(
        data.message || `Password updated for ${user.name}.`,
      )
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')

      await onSaved()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update the password. Please try again.',
      )
    } finally {
      setUpdating(false)
    }
  }

  return (
    <article
      className={`dashboard-card um-password-card${
        resetMode ? ' is-reset-mode' : ''
      }`}
    >
      <header className="um-panel-heading">
        <div>
          <p className="um-eyebrow">Security</p>
          <h2>
            {resetMode ? 'Reset Password' : 'Password & Security'}
          </h2>
          <span>Confirm your current Administrator password before setting a new password for {user.name}.</span>
        </div>
      </header>

      <label className="um-field">
        <span>Your Current Administrator Password</span>
        <div className="um-password-input-wrap">
          <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword}
            onChange={e => { setCurrentPassword(e.target.value); setError(''); setSuccess('') }}
            placeholder="Enter your current password" autoComplete="current-password" disabled={updating} />
          <button type="button" onClick={() => setShowCurrentPassword(value => !value)} aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}>
            <PasswordVisibilityIcon visible={showCurrentPassword} />
          </button>
        </div>
      </label>

      <label className="um-field">
        <span>New Password</span>
        <div className="um-password-input-wrap">
          <input type={showNewPassword ? 'text' : 'password'} value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setError(''); setSuccess('') }}
            placeholder="Enter new password" autoComplete="new-password" disabled={updating} />
          <button type="button" onClick={() => setShowNewPassword(value => !value)} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}>
            <PasswordVisibilityIcon visible={showNewPassword} />
          </button>
        </div>
      </label>

      <label className="um-field">
        <span>Confirm New Password</span>
        <div className="um-password-input-wrap">
          <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setError(''); setSuccess('') }}
            placeholder="Re-enter new password" autoComplete="new-password" disabled={updating} />
          <button type="button" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>
            <PasswordVisibilityIcon visible={showConfirmPassword} />
          </button>
        </div>
      </label>

      {error && (
        <p className="um-form-message um-form-error">{error}</p>
      )}

      {success && (
        <p className="um-form-message um-form-success">{success}</p>
      )}

      <div className="um-password-actions">
        <button
          type="button"
          className="um-btn-primary"
          onClick={handleUpdate}
          disabled={updating}
        >
          {updating ? 'Updating Password...' : 'Update Password'}
        </button>

        <button
          type="button"
          className="um-btn-secondary"
          onClick={resetMode ? onCancel : clearForm}
          disabled={updating}
        >
          Cancel
        </button>
      </div>
    </article>
  )
}

/* SELECTED USER DETAILS*/
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
function UserDetails({
  user,
  mode,
  onModeChange,
  onSaved,
  onAction,
}: {
  user: User
  mode: UserPanelMode
  onModeChange: (mode: UserPanelMode) => void
  onSaved: () => Promise<void>
  onAction: (action: UserAccountAction, user: User) => void
}) {
  return (
    <div className={`um-details-grid um-details-grid--${mode}`}>
      <article className="dashboard-card um-account-card">
        <header className="um-panel-heading um-account-heading">
          <div>
            <p className="um-eyebrow">User profile</p>
            <h2>Account Information</h2>
            <span>Identity, contact details, and access level.</span>
          </div>
        </header>

        <div className="um-account-profile">
          <span className="um-account-avatar">
            <img
              src={getProfilePhotoUrl(
                user.profilePhoto,
                user.name,
                user.role,
              )}
              alt={`${user.name} profile`}
            />
          </span>

          <div>
            <strong>{user.name}</strong>
            <StatusBadge status={user.status} />
          </div>
        </div>

        <dl className="um-account-fields">
          <div>
            <dt>Email Address</dt>
            <dd>{user.email}</dd>
          </div>

          <div>
            <dt>Employee ID</dt>
            <dd>{user.employeeId}</dd>
          </div>

          <div>
            <dt>Department</dt>
            <dd>{user.department}</dd>
          </div>

          <div>
            <dt>Role</dt>
            <dd>
              <RoleBadge role={user.role} />
            </dd>
          </div>

          <div>
            <dt>Joined</dt>
            <dd>{user.joined || 'Not available'}</dd>
          </div>
        </dl>
        {mode === 'view' && <footer className="um-account-actions" aria-label="User account actions">
          <button type="button" className="um-btn-secondary" onClick={() => onAction('edit', user)}>Edit User</button>
          <button type="button" className="um-btn-secondary" onClick={() => onAction('reset', user)}>Reset Password</button>
          <button type="button" className={user.status === 'Active' ? 'um-btn-danger' : 'um-btn-primary'} onClick={() => onAction('disable', user)}>
            {user.status === 'Active' ? 'Disable Account' : 'Enable Account'}
          </button>
        </footer>}
      </article>
      {mode === 'edit' && <EditUserCard user={user} onSaved={onSaved} onCancel={() => onModeChange('view')} />}
      {mode === 'reset' && <ChangePasswordCard user={user} onSaved={onSaved} onCancel={() => onModeChange('view')} resetMode />}
    </div>
  )
}

/* CREATE USER MODAL */
function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (user: User) => void
}) {
  const session = getAuthSession()
  const [form, setForm] =
    useState<CreateUserForm>({
      fullName: '',
      employeeId: '',
      department: '',
      email: '',
      role: 'Employee',
      password: '',
      confirmPassword: '',
    })
  const [error, setError] = useState('')
  const [success, setSuccess] =
    useState('')
  const [submitting, setSubmitting] =
    useState(false)
  const [departmentOpen, setDepartmentOpen] =
    useState(false)
  const [departmentHighlight, setDepartmentHighlight] =
    useState(0)
  const departmentRef =
    useRef<HTMLDivElement>(null)
  const filteredDepartments = useMemo(() => {
    const search = form.department.trim().toLowerCase()

    if (!search) {
      return [...CITY_HALL_DEPARTMENTS]
    }

    return CITY_HALL_DEPARTMENTS.filter(department =>
      department.toLowerCase().includes(search),
    )
  }, [form.department])
  useEffect(() => {
    if (!departmentOpen) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        departmentRef.current &&
        !departmentRef.current.contains(event.target as Node)
      ) {
        setDepartmentOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [departmentOpen])
  useEffect(() => {
    setDepartmentHighlight(0)
  }, [form.department])
  const selectDepartment = (department: string) => {
    updateField('department', department)
    setDepartmentOpen(false)
    setDepartmentHighlight(0)
  }
  const updateField = <
    K extends keyof CreateUserForm,
  >(
    field: K,
    value: CreateUserForm[K],
  ) => {
    setForm(current => ({
      ...current,
      [field]: value,
    }))

    setError('')
    setSuccess('')
  }
  const validatePassword = (
    password: string,
  ) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter.'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter.'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.'
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'Password must contain at least one special character.'
    }
    return ''
  }
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!session?.user?.userID) {
      setError(
        'Administrator session could not be verified. Please log in again.',
      )
      return
    }
    if (
      !form.fullName.trim() ||
      !form.employeeId.trim() ||
      !form.department.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError(
        'Please complete all required fields.',
      )
      return
    }
    if (!CITY_HALL_DEPARTMENTS.includes(form.department.trim() as (typeof CITY_HALL_DEPARTMENTS)[number])) {
      setError('Please select a department from the list.')
      return
    }
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setError(
        'Please enter a valid email address.',
      )
      return
    }
    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        'Passwords do not match.',
      )
      return
    }
    const passwordError =
      validatePassword(form.password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(
        CREATE_USER_API_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            adminUserID:
              session.user.userID,
            fullName:
              form.fullName.trim(),
            employeeId:
              form.employeeId.trim(),
            department:
              form.department.trim(),
            email:
              form.email.trim(),
            password:
              form.password,
            role: form.role,
          }),
        },
      )
      const data = await response.json()
      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to create the user account.',
        )
      }
      const created = data.user
      const newUser: User = {
        id: String(
          created.userID ??
            created.employeeId ??
            form.employeeId.trim(),
        ),
        userID:
          created.userID,
        employeeId:
          created.employeeId ??
          form.employeeId.trim(),
        name:
          created.fullName ??
          form.fullName.trim(),
        initial: getInitials(
          created.fullName ??
            form.fullName.trim(),
        ),
        email:
          created.email ??
          form.email.trim(),
        department:
          created.department ??
          form.department.trim(),
        role: normalizeRole(
          created.role ??
            form.role,
        ),
        status: normalizeStatus(
          created.status ??
            'Active',
        ),
        joined:
          formatJoinedDate(
            created.dateCreated,
          ),
        profilePhoto:
          created.profilePhoto ??
          null,
      }
      setSuccess(
        'User account created successfully.',
      )
      onCreated(newUser)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create the user account.',
      )
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div
      className="um-modal-backdrop"
      role="presentation"
      onMouseDown={e => {
        if (
          e.target === e.currentTarget &&
          !submitting
        ) {
          onClose()
        }
      }}
    >
      <section
        className="um-create-user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        onMouseDown={e =>
          e.stopPropagation()
        }
      >
        <div className="um-modal-header">
          <div>
            <h2 id="create-user-title">
              Create User Account
            </h2>

            <p>
              Add a new Employee, Secretary,
              or IT Personnel account.
            </p>
          </div>

          <button
            type="button"
            className="um-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            Ã—
          </button>
        </div>

        <form
          className="um-create-user-form"
          onSubmit={handleSubmit}
        >
          <label className="um-field">
            <span>
              Full Name
            </span>

            <input
              type="text"
              value={form.fullName}
              onChange={e =>
                updateField(
                  'fullName',
                  e.target.value,
                )
              }
              placeholder="Enter full name"
              autoComplete="name"
              disabled={submitting}
              required
            />
          </label>
          <label className="um-field">
            <span>
              Employee ID
            </span>

            <input
              type="text"
              value={form.employeeId}
              onChange={e =>
                updateField(
                  'employeeId',
                  e.target.value,
                )
              }
              placeholder="e.g. EMP-004"
              autoComplete="off"
              disabled={submitting}
              required
            />
          </label>
          <div className="um-field" ref={departmentRef}>
            <span>
              Department
            </span>
            <div
              style={{
                position: 'relative',
                width: '100%',
              }}
            >
              <input
                type="text"
                value={form.department}
                onChange={e => {
                  updateField(
                    'department',
                    e.target.value,
                  )
                  setDepartmentOpen(true)
                }}
                onFocus={() => {
                  setDepartmentOpen(true)
                  setDepartmentHighlight(0)
                }}
                onKeyDown={e => {
                  if (!departmentOpen) {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      e.preventDefault()
                      setDepartmentOpen(true)
                    }
                    return
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setDepartmentHighlight(current =>
                      filteredDepartments.length === 0
                        ? 0
                        : Math.min(current + 1, filteredDepartments.length - 1),
                    )
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setDepartmentHighlight(current =>
                      Math.max(current - 1, 0),
                    )
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const highlighted =
                      filteredDepartments[departmentHighlight]
                    if (highlighted) {
                      selectDepartment(highlighted)
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setDepartmentOpen(false)
                  }
                }}
                placeholder="Search or select department"
                autoComplete="off"
                disabled={submitting}
                required
                aria-autocomplete="list"
                aria-expanded={departmentOpen}
                aria-controls="department-options"
                role="combobox"
              />
              {departmentOpen && (
                <div
                  id="department-options"
                  role="listbox"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    maxHeight: '240px',
                    overflowY: 'auto',
                    border: '1px solid rgba(100, 116, 139, 0.35)',
                    borderRadius: '10px',
                    background: 'var(--card-bg, #ffffff)',
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
                    padding: '6px',
                  }}
                >
                  {filteredDepartments.length > 0 ? (
                    filteredDepartments.map((department, index) => (
                      <button
                        key={department}
                        type="button"
                        role="option"
                        aria-selected={
                          form.department === department
                        }
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => selectDepartment(department)}
                        style={{
                          display: 'block',
                          width: '100%',
                          border: 0,
                          borderRadius: '7px',
                          padding: '10px 12px',
                          background:
                            index === departmentHighlight
                              ? 'rgba(37, 99, 235, 0.10)'
                              : 'transparent',
                          color: 'inherit',
                          textAlign: 'left',
                          cursor: 'pointer',
                          font: 'inherit',
                          lineHeight: 1.35,
                        }}
                      >
                        {department}
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '10px 12px',
                        color: '#64748b',
                        fontSize: '0.9rem',
                      }}
                    >
                      No department found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <label className="um-field">
            <span>
              Email Address
            </span>

            <input
              type="email"
              value={form.email}
              onChange={e =>
                updateField(
                  'email',
                  e.target.value,
                )
              }
              placeholder="Enter email address"
              autoComplete="email"
              disabled={submitting}
              required
            />
          </label>
          <label className="um-field">
            <span>
              Account Role
            </span>

            <select
              value={form.role}
              onChange={e =>
                updateField(
                  'role',
                  e.target
                    .value as CreateUserRole,
                )
              }
              disabled={submitting}
              required
            >
              <option value="Employee">
                Employee
              </option>

              <option value="IT Personnel">
                IT Personnel
              </option>

              <option value="Secretary">
                Secretary
              </option>

              <option value="Administrator">
                Administrator
              </option>
            </select>
          </label>
          <label className="um-field">
            <span>
              Password
            </span>

            <input
              type="password"
              value={form.password}
              onChange={e =>
                updateField(
                  'password',
                  e.target.value,
                )
              }
              placeholder="Enter password"
              autoComplete="new-password"
              disabled={submitting}
              required
            />
          </label>

          <label className="um-field">
            <span>
              Confirm Password
            </span>

            <input
              type="password"
              value={
                form.confirmPassword
              }
              onChange={e =>
                updateField(
                  'confirmPassword',
                  e.target.value,
                )
              }
              placeholder="Re-enter password"
              autoComplete="new-password"
              disabled={submitting}
              required
            />
          </label>

          <p className="um-password-hint">
            Password must be at least 8
            characters and contain an
            uppercase letter, lowercase
            letter, number, and special
            character.
          </p>

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

          <div className="um-modal-actions">
            <button
              type="button"
              className="um-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="um-btn-primary"
              disabled={submitting}
            >
              {submitting
                ? 'Creating Account...'
                : 'Create Account'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
/* THEME*/
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
/* PROFILE MENU*/
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
  const [open, setOpen] =
    useState(false)
  const navigate =
    useNavigate()
  const rootRef =
    useRef<HTMLDivElement>(null)
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
            <img src={avatar} alt="" />
          ) : (
            getInitials(name)
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
              <circle
                cx="12"
                cy="12"
                r="3"
              />
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
/* PAGE*/
function UserManagement() {
  const navigate =
    useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)
  const {
    theme,
    toggleTheme,
  } = useTheme()
  const [query, setQuery] =
    useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [users, setUsers] =
    useState<User[]>([])
  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [panelMode, setPanelMode] = useState<UserPanelMode>('view')
  const [loadingUsers, setLoadingUsers] =
    useState(true)
  const [usersError, setUsersError] =
    useState('')
  const session =
    getAuthSession()
  const adminName =
    session?.user?.fullName ||
    'Administrator'
  const adminRole =
    session?.user?.role ||
    'Administrator'
  const currentUser = session?.user
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
  /* LOAD USERS FROM DATABASE */
  const loadUsers = async () => {
    setLoadingUsers(true)
    setUsersError('')
    try {
      const response =
        await fetch(
          USERS_API_URL,
          {
            method: 'GET',
            headers: {
              Accept:
                'application/json',
            },
          },
        )
      if (!response.ok) {
        throw new Error(
          `Unable to load users. Server returned ${response.status}.`,
        )
      }
      const data =
        await response.json()
      if (!data.success) {
        throw new Error(
          data.message ||
            'Unable to load users.',
        )
      }
      const databaseUsers =
        Array.isArray(data.users)
          ? data.users
          : []
      const mappedUsers: User[] =
        databaseUsers.map(
          (
            item: Record<
              string,
              unknown
            >,
          ) => {
            const name =
              String(
                item.fullName ??
                  item.name ??
                  'Unknown User',
              )
            const userID =
              item.userID ??
              item.id
            const employeeId =
              String(
                item.employeeId ??
                  item.employeeID ??
                  '',
              )
            return {
              id: String(
                userID ??
                  employeeId ??
                  name,
              ),
              userID:
                userID as
                  | number
                  | string
                  | undefined,

              employeeId,
              name,
              initial:
                getInitials(name),
              email: String(
                item.email ?? '',
              ),
              department:
                String(
                  item.department ??
                    '',
                ),
              role: normalizeRole(
                String(
                  item.role ??
                    'Employee',
                ),
              ),
              status:
                normalizeStatus(
                  String(
                    item.status ??
                      'Active',
                  ),
                ),
              joined:
                formatJoinedDate(
                  String(
                    item.dateCreated ??
                      item.createdAt ??
                      '',
                  ),
                ),
              profilePhoto:
                item.profilePhoto
                  ? String(
                      item.profilePhoto,
                    )
                  : null,
            }
          },
        )
      setUsers(mappedUsers)
    } catch (error) {
      setUsersError(
        error instanceof Error
          ? error.message
          : 'Unable to load users.',
      )
    } finally {
      setLoadingUsers(false)
    }
  }
  useEffect(() => {
    const refreshUsers = () => {
      void loadUsers()
    }

    refreshUsers()
    window.addEventListener('focus', refreshUsers)
    window.addEventListener(
      'batangai-auth-updated',
      refreshUsers,
    )

    return () => {
      window.removeEventListener('focus', refreshUsers)
      window.removeEventListener(
        'batangai-auth-updated',
        refreshUsers,
      )
    }
  }, [])
  /* FILTER USERS */
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
      !roleFilter && !departmentFilter ? [] : users.filter(
        user => (!roleFilter || user.role === roleFilter) &&
          (!departmentFilter || user.department === departmentFilter) &&
          user.name
            .toLowerCase()
            .includes(
              query
                .toLowerCase()
                .trim(),
            ),
      ),
    [departmentFilter, query, roleFilter, users],
  )
  const departments = useMemo(
    () => [...new Set(users.map(user => user.department.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [users],
  )
  const selectedUser = users.find(user => user.id === selectedUserId) ?? null
  /* LOGOUT */
  const handleLogout = () => {
    signOut()
    navigate('/')
  }
  /* SELECT USER*/
  const handleSelect = (
    id: string,
  ) => {
    setPanelMode('view')
    setSelectedUserId(id)
  }
  const handleUserAction = async (
    action: UserAccountAction,
    user: User,
  ) => {
    switch (action) {
      case 'edit':
        setSelectedUserId(user.id)
        setPanelMode('edit')
        break
      case 'reset':
        setSelectedUserId(user.id)
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
          !window.confirm(
            `Are you sure you want to ${verb} ${user.name}'s account?`,
          )
        ) {
          break
        }
        const adminUserID = session?.user?.userID
        const targetUserID = user.userID
        if (
          adminUserID === undefined ||
          adminUserID === null ||
          String(adminUserID).trim() === ''
        ) {
          window.alert(
            'Administrator session not found. Please log in again.',
          )
          break
        }
        if (
          targetUserID === undefined ||
          targetUserID === null ||
          String(targetUserID).trim() === ''
        ) {
          window.alert(
            'Unable to identify the selected user.',
          )
          break
        }
        try {
          const response = await fetch(
            UPDATE_USER_STATUS_API_URL,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                adminUserID,
                userID: targetUserID,
                status: nextStatus,
              }),
            },
          )
          const data = await response.json()
          if (!response.ok || !data.success) {
            throw new Error(
              data.message ||
                'Unable to update the account status.',
            )
          }
          const updatedStatus =
            data.user?.status === 'Inactive'
              ? 'Inactive'
              : 'Active'
          setUsers(
            current =>
              current.map(
                u =>
                  u.id === user.id
                    ? {
                        ...u,
                        status: updatedStatus,
                      }
                    : u,
              ),
          )
          window.alert(
            data.message ||
              `${user.name}'s account is now ${updatedStatus}.`,
          )
        } catch (requestError) {
          window.alert(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to update the account status. Please try again.',
          )
        }
        break
      }
    }
  }
  /* AFTER CREATE */
  const handleUserCreated = (
    createdUser: User,
  ) => {
    setUsers(
      current => [
        createdUser,
        ...current,
      ],
    )
    setShowCreateUser(false)
    setSelectedUserId(
      createdUser.id,
    )
    setQuery('')
    setRoleFilter('')
    setDepartmentFilter('')
    setPanelMode('view')
  }
  /* RENDER*/
  return (
    <div
      className={`admin-shell${
        sidebarCollapsed
          ? ' sidebar-collapsed'
          : ''
      }`}
    >
      {/*SIDEBAR*/}
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
      {/* MAIN*/}
      <main className="admin-main">
        {/*  TOPBAR*/}
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
                current =>
                  !current,
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
              Manage all system
              accounts and
              permissions.
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
            avatar={profileAvatar}
            onLogout={
              handleLogout
            }
          />
        </header>
        {/*  CONTENT*/}
        <div className="dashboard-content">
          {/* SEARCH / FILTER / CREATE */}
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
                placeholder="Search users by name..."
              />
            </label>

            <label className="um-filter-select">
              Role
              <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}>
                <option value="">Select role</option>
                <option>Employee</option>
                <option>Secretary</option>
                <option>IT Personnel</option>
                <option>Administrator</option>
              </select>
            </label>

            <label className="um-filter-select">
              Department
              <select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}>
                <option value="">Select department</option>
                {departments.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>

            <button
              type="button"
              className="um-btn-primary um-create-user-btn"
              onClick={() =>
                setShowCreateUser(
                  true,
                )
              }
            >
              + Create User
            </button>
          </section>
          {/* ERROR */}
          {usersError && (
            <p className="um-form-message um-form-error">
              {usersError}
            </p>
          )}
          {/* USERS */}
          {loadingUsers ? (
            <div className="um-empty">
              Loading users...
            </div>
          ) : shown.length >
            0 ? (
            <section className="um-directory" aria-label="User directory">
              <header className="um-directory-header">
                <div><h2>User Directory</h2><p>{shown.length} {shown.length === 1 ? 'user' : 'users'} found. Select a name to view account details.</p></div>
              </header>
              <div className="um-directory-columns" aria-hidden="true"><span>Name</span></div>
              <div className="um-directory-list">
                {shown.map(user => <UserDirectoryRow key={user.id} user={user} onSelect={handleSelect} />)}
              </div>
            </section>
          ) : roleFilter || departmentFilter ? (
            <div className="um-empty">
              No users match your search or filters.
            </div>
          ) : (
            <div className="um-empty">
              Select a role or department to display matching users.
            </div>
          )}
        </div>
      </main>
      {selectedUser && (
        <div className="um-modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) {
            setSelectedUserId(null)
            setPanelMode('view')
          }
        }}>
          <section className={`um-modal${panelMode === 'view' ? ' is-profile-mode' : ' is-workflow-mode'}`}
            role="dialog" aria-modal="true" aria-label={`${panelMode === 'edit' ? 'Edit' : panelMode === 'reset' ? 'Reset password for' : 'Profile for'} ${selectedUser.name}`}>
            <button className="um-modal-close" type="button" onClick={() => { setSelectedUserId(null); setPanelMode('view') }} aria-label="Close">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
            <UserDetails user={selectedUser} mode={panelMode} onModeChange={setPanelMode} onAction={handleUserAction}
              onSaved={async () => { await loadUsers(); setPanelMode('view') }} />
          </section>
        </div>
      )}
      {/* CREATE USER MODAL */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() =>
            setShowCreateUser(false)
          }
          onCreated={handleUserCreated}
        />
      )}
    </div>
  )
}

export default UserManagement
