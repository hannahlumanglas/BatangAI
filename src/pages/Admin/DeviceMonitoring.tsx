import { useState, useEffect, useRef, useMemo } from 'react'
import type { JSX, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './DeviceMonitoring.css'
import './DeviceMonitoringOverrides.css'

type IconName = 'dashboard' | 'incidents' | 'devices' | 'users' | 'reports' | 'profile' | 'logout' | 'menu' | 'bell' | 'search' | 'plus' | 'online' | 'warning' | 'offline' | 'chevron' | 'dots' | 'switch' | 'link' | 'clock' | 'assign'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    incidents: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6M9 10h6M9 14h6M9 18h3" /></>,
    devices: <><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M15 15c2.7.1 4.4 1.7 4.6 4.5" /></>,
    reports: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    bell: <><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    online: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    warning: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>,
    offline: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    dots: <><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></>,
    switch: <><rect x="2" y="8" width="20" height="8" rx="1.5" /><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" /></>,
    link: <><path d="M9 15 15 9" /><path d="M13 5.5 15 3.6a3.4 3.4 0 0 1 4.9 4.9L18 10.4M11 18.4l-1.9 1.9a3.4 3.4 0 0 1-4.9-4.9L6.1 13.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
    assign: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6" /><path d="M18 8v6M15 11h6" /></>,
  }
  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function StatCard({ icon, number, title, tone }: { icon: IconName; number: string; title: string; tone: string }) {
  return <article className={`stat-card stat-card--${tone}`}><div className="stat-icon"><Icon name={icon} /></div><div><h3>{title}</h3><strong>{number}</strong></div></article>
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

/* ---------- Theme (light/dark) ---------- */

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = 'batangai-theme'

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme(current => (current === 'dark' ? 'light' : 'dark'))
  return { theme, toggleTheme }
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle-button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
        </svg>
      )}
    </button>
  )
}

function ProfileMenu({ name, role, onLogout, profilePath = '/admin/profile' }: { name: string; role: string; avatarInitial: string; onLogout: () => void; profilePath?: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const goToProfile = () => { setOpen(false); navigate(profilePath) }

  return (
    <div className="profile-menu-root" ref={rootRef}>
      <button type="button" className="topbar-user profile-menu-trigger" onClick={() => setOpen(current => !current)} aria-haspopup="menu" aria-expanded={open}>
        <div className="topbar-avatar">{name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
        <div><strong>{name}</strong><span>{role}</span></div>
        <span className={`profile-menu-chevron${open ? ' open' : ''}`}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>

      {open && (
        <div className="profile-menu-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={goToProfile}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" /></svg>
            My Profile
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate(profilePath.replace('/profile', '/settings')) }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2-3.4Z" /></svg>
            Settings
          </button>
          <button type="button" role="menuitem" onClick={goToProfile}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            Change Password
          </button>
          <span className="profile-menu-divider" />
          <button type="button" role="menuitem" className="danger" onClick={() => { setOpen(false); onLogout() }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- Device data ---------- */

type DeviceStatus = 'online' | 'warning' | 'offline'
type DeviceType = 'Router' | 'Switch' | 'Access Point'

interface Device {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  ip: string
  mac: string
  location: string
  department: string
  firmware: string
  lastSeen: string
  throughput: number
  devicesConnected: number
  uptime: string
}

const initialDevices: Device[] = [
  { id: 'DEV-001', name: 'Core Router - City Hall', type: 'Router', status: 'online', ip: '10.10.0.1', mac: '3C:5A:B4:11:02:9F', location: 'City Hall, Server Room', department: 'Information Technology Office', firmware: 'v4.2.1', lastSeen: 'Just now', throughput: 68, devicesConnected: 214, uptime: '32d 14h' },
  { id: 'DEV-002', name: 'Switch - Health Dept Floor 2', type: 'Switch', status: 'online', ip: '10.10.1.14', mac: '00:1B:44:11:3A:B7', location: 'Health Department, 2F', department: 'Health Office', firmware: 'v2.9.0', lastSeen: 'Just now', throughput: 41, devicesConnected: 38, uptime: '19d 03h' },
  { id: 'DEV-003', name: 'Access Point - Engineering Lobby', type: 'Access Point', status: 'warning', ip: '10.10.2.22', mac: 'AC:DE:48:00:11:22', location: 'Engineering Office, Lobby', department: 'Engineering Office', firmware: 'v1.7.3', lastSeen: '2 min ago', throughput: 89, devicesConnected: 61, uptime: '5d 21h' },
  { id: 'DEV-004', name: 'Switch - Treasury Office', type: 'Switch', status: 'online', ip: '10.10.3.8', mac: '00:1A:2B:3C:4D:5E', location: 'Treasury Office, 1F', department: 'Treasury Office', firmware: 'v2.9.0', lastSeen: 'Just now', throughput: 33, devicesConnected: 19, uptime: '46d 09h' },
  { id: 'DEV-005', name: 'Router - Engineering Annex', type: 'Router', status: 'online', ip: '10.10.4.1', mac: '3C:5A:B4:22:8A:10', location: 'Engineering Annex', department: 'Engineering Office', firmware: 'v4.2.1', lastSeen: 'Just now', throughput: 52, devicesConnected: 47, uptime: '12d 02h' },
  { id: 'DEV-006', name: 'Access Point - Registrar', type: 'Access Point', status: 'online', ip: '10.10.5.30', mac: 'AC:DE:48:00:33:44', location: 'City Civil Registrar', department: 'Civil Registrar', firmware: 'v1.7.3', lastSeen: 'Just now', throughput: 27, devicesConnected: 15, uptime: '8d 17h' },
  { id: 'DEV-007', name: 'Switch - HR Office', type: 'Switch', status: 'offline', ip: '10.10.6.5', mac: '00:1B:44:22:5C:91', location: 'Human Resources, 3F', department: 'Human Resources', firmware: 'v2.8.4', lastSeen: '41 min ago', throughput: 0, devicesConnected: 0, uptime: '\u2014' },
  { id: 'DEV-008', name: 'Router - IT Office', type: 'Router', status: 'online', ip: '10.10.7.1', mac: '3C:5A:B4:44:1B:7C', location: 'IT Office, Server Rack', department: 'Information Technology Office', firmware: 'v4.2.1', lastSeen: 'Just now', throughput: 74, devicesConnected: 96, uptime: '58d 11h' },
  { id: 'DEV-009', name: 'Access Point - Public Library', type: 'Access Point', status: 'warning', ip: '10.10.8.12', mac: 'AC:DE:48:00:55:66', location: 'City Public Library', department: 'Library Services', firmware: 'v1.6.9', lastSeen: '4 min ago', throughput: 91, devicesConnected: 73, uptime: '3d 06h' },
  { id: 'DEV-010', name: 'Switch - Accounting Office', type: 'Switch', status: 'online', ip: '10.10.9.7', mac: '00:1A:2B:5D:6E:7F', location: 'Accounting Office, 2F', department: 'Accounting Office', firmware: 'v2.9.0', lastSeen: 'Just now', throughput: 22, devicesConnected: 11, uptime: '64d 20h' },
  { id: 'DEV-011', name: 'Router - Mayor\u2019s Office', type: 'Router', status: 'online', ip: '10.10.10.1', mac: '3C:5A:B4:55:2E:9D', location: 'Office of the City Mayor', department: 'Office of the Mayor', firmware: 'v4.2.1', lastSeen: 'Just now', throughput: 45, devicesConnected: 28, uptime: '21d 07h' },
]

const deviceTypes: DeviceType[] = ['Router', 'Switch', 'Access Point']
const departments = ['Information Technology Office', 'Health Office', 'Engineering Office', 'Treasury Office', 'Civil Registrar', 'Human Resources', 'Library Services', 'Accounting Office', 'Office of the Mayor']

function meterClass(status: DeviceStatus) {
  if (status === 'offline') return 'dm-meter offline'
  if (status === 'warning') return 'dm-meter warning'
  return 'dm-meter'
}

function deviceIcon(type: DeviceType): IconName {
  return type === 'Switch' ? 'switch' : 'devices'
}

function DeviceCard({ device, expanded, onToggle }: { device: Device; expanded: boolean; onToggle: () => void }) {
  return (
    <article className={`dashboard-card dm-card${expanded ? ' expanded' : ''}`}>
      <div
        className="dm-card-header"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      >
        <div className="dm-card-id">
          <div className={`dm-card-icon${device.type === 'Switch' ? ' dm-card-icon--switch' : ''}`}>
            <Icon name={deviceIcon(device.type)} />
          </div>
          <span>
            <strong>{device.name}</strong>
            <small>{device.id} &middot; {device.ip}</small>
          </span>
        </div>
        <div className="dm-card-header-right">
          <p className={device.status}>
            <Icon name={device.status} />
            {device.status === 'online' ? 'Online' : device.status === 'warning' ? 'Warning' : 'Offline'}
          </p>
          <button className="dm-more" type="button" aria-label="Device actions" onClick={e => e.stopPropagation()}>
            <Icon name="dots" />
          </button>
          <Icon name="chevron" />
        </div>
      </div>

      <div className="dm-card-details">
        <div className="dm-card-details-inner">
          <div className="dm-details-grid">
            <dl className="dm-details-list">
              <div><dt>Type</dt><dd>{device.type}</dd></div>
              <div><dt>IP Address</dt><dd>{device.ip}</dd></div>
              <div><dt>MAC Address</dt><dd>{device.mac}</dd></div>
              <div><dt>Location</dt><dd>{device.location}</dd></div>
              <div><dt>Department</dt><dd>{device.department}</dd></div>
              <div><dt>Firmware Version</dt><dd>{device.firmware}</dd></div>
              <div><dt>Last Seen</dt><dd>{device.lastSeen}</dd></div>
            </dl>
            <div className="dm-details-side">
              <div className="dm-throughput-card">
                <div className="dm-throughput-head"><span>Throughput</span><b>{device.throughput}%</b></div>
                <div className={meterClass(device.status)}><i style={{ width: `${device.throughput}%` }} /></div>
              </div>
              <div className="dm-metric-card">
                <div className="dm-metric-icon"><Icon name="link" /></div>
                <span className="dm-metric-label">Devices Connected</span>
                <span className="dm-metric-value">{device.devicesConnected}</span>
              </div>
              <div className="dm-metric-card">
                <div className="dm-metric-icon"><Icon name="clock" /></div>
                <span className="dm-metric-label">Uptime</span>
                <span className="dm-metric-value">{device.uptime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function AddDeviceModal({ onClose, onAdd, existingIds }: { onClose: () => void; onAdd: (device: Device) => void; existingIds: string[] }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<DeviceType>('Router')
  const [ip, setIp] = useState('')
  const [mac, setMac] = useState('')
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState(departments[0])
  const [firmware, setFirmware] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  const macPattern = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/

  const validate = () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Device name is required.'
    if (!ip.trim()) next.ip = 'IP address is required.'
    else if (!ipPattern.test(ip.trim())) next.ip = 'Enter a valid IP address (e.g. 10.10.0.5).'
    if (mac.trim() && !macPattern.test(mac.trim())) next.mac = 'Use MAC format like AC:DE:48:00:11:22.'
    if (!location.trim()) next.location = 'Location is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    let n = existingIds.length + 1
    let id = `DEV-${String(n).padStart(3, '0')}`
    while (existingIds.includes(id)) { n += 1; id = `DEV-${String(n).padStart(3, '0')}` }
    onAdd({
      id,
      name: name.trim(),
      type,
      status: 'online',
      ip: ip.trim(),
      mac: mac.trim() || '\u2014',
      location: location.trim(),
      department,
      firmware: firmware.trim() || '\u2014',
      lastSeen: 'Just now',
      throughput: 0,
      devicesConnected: 0,
      uptime: '0m',
    })
  }

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="add-device-modal" role="dialog" aria-modal="true" aria-labelledby="add-device-title">
        <div className="add-device-header">
          <div>
            <h2 id="add-device-title">Add Device</h2>
            <p>Register a new device to start monitoring it.</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>&times;</button>
        </div>

        <form className="add-device-body" onSubmit={handleSubmit}>
          <div className="dm-form-grid">
            <div className="dm-field">
              <label className="dm-field-label" htmlFor="dev-name">Device Name<em>*</em></label>
              <input id="dev-name" type="text" placeholder="e.g. Switch - Records Office" value={name} onChange={e => setName(e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <span className="dm-field-error">{errors.name}</span>}
            </div>
            <div className="dm-field">
              <label className="dm-field-label" htmlFor="dev-type">Device Type<em>*</em></label>
              <select id="dev-type" value={type} onChange={e => setType(e.target.value as DeviceType)}>
                {deviceTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="dm-field">
              <label className="dm-field-label" htmlFor="dev-ip">IP Address<em>*</em></label>
              <input id="dev-ip" type="text" placeholder="10.10.0.5" value={ip} onChange={e => setIp(e.target.value)} aria-invalid={!!errors.ip} />
              {errors.ip && <span className="dm-field-error">{errors.ip}</span>}
            </div>
            <div className="dm-field">
              <label className="dm-field-label" htmlFor="dev-mac">MAC Address</label>
              <input id="dev-mac" type="text" placeholder="AC:DE:48:00:11:22" value={mac} onChange={e => setMac(e.target.value)} aria-invalid={!!errors.mac} />
              {errors.mac && <span className="dm-field-error">{errors.mac}</span>}
            </div>
            <div className="dm-field">
              <label className="dm-field-label" htmlFor="dev-location">Location<em>*</em></label>
              <input id="dev-location" type="text" placeholder="e.g. City Hall, 2nd Floor" value={location} onChange={e => setLocation(e.target.value)} aria-invalid={!!errors.location} />
              {errors.location && <span className="dm-field-error">{errors.location}</span>}
            </div>
            <div className="dm-field">
              <label className="dm-field-label" htmlFor="dev-department">Department<em>*</em></label>
              <select id="dev-department" value={department} onChange={e => setDepartment(e.target.value)}>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="dm-field">
              <label className="dm-field-label" htmlFor="dev-firmware">Firmware Version</label>
              <input id="dev-firmware" type="text" placeholder="e.g. v4.2.1" value={firmware} onChange={e => setFirmware(e.target.value)} />
            </div>
          </div>

          <div className="add-device-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Device</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeviceMonitoring({ audience = 'administrator' }: { audience?: 'administrator' | 'it' }) {
  const navigate = useNavigate()
  const isIT = audience === 'it'
  const roleNavigation = isIT
    ? navigation.filter(item => ['All Incidents', 'Manage & Assign', 'Device Monitoring', 'Profile'].includes(item.label)).map(item => ({ ...item, label: item.label === 'Manage & Assign' ? 'My Assignments' : item.label, path: item.label === 'Manage & Assign' ? '/it/my-assignments' : item.path.replace('/admin', '/it') }))
    : navigation
  const user = isIT ? { name: 'Juan dela Cruz', role: 'IT Personnel', initial: 'J', profilePath: '/it/profile' } : { name: 'Ricardo Mendoza', role: 'Administrator', initial: 'R', profilePath: '/admin/profile' }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const [deviceList, setDeviceList] = useState<Device[]>(initialDevices)
  const [showAddModal, setShowAddModal] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [live, setLive] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const handleLogout = () => { localStorage.removeItem('batangai-admin-auth'); navigate('/') }

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setLastUpdated(new Date()), 20000)
    return () => clearInterval(id)
  }, [live])

  const filtered = useMemo(() => {
    return deviceList.filter(d => {
      const matchesQuery = query.trim() === '' || d.name.toLowerCase().includes(query.toLowerCase()) || d.ip.includes(query) || d.id.toLowerCase().includes(query.toLowerCase())
      const matchesType = typeFilter === 'All Types' || d.type === typeFilter
      const matchesStatus = statusFilter === 'All Statuses' || d.status === statusFilter.toLowerCase()
      return matchesQuery && matchesType && matchesStatus
    })
  }, [deviceList, query, typeFilter, statusFilter])

  const counts = useMemo(() => ({
    total: deviceList.length,
    online: deviceList.filter(d => d.status === 'online').length,
    warning: deviceList.filter(d => d.status === 'warning').length,
    offline: deviceList.filter(d => d.status === 'offline').length,
  }), [deviceList])

  const handleAddDevice = (device: Device) => {
    setDeviceList(list => [device, ...list])
    setShowAddModal(false)
    setExpandedId(device.id)
  }

  return <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-brand"><img src={logo} alt="Batangas City seal" /><strong>Batang<span>AI</span></strong></div>
      <nav className="sidebar-nav" aria-label={`${user.role} navigation`}>
        {roleNavigation.map(item => <button className={item.label === 'Device Monitoring' ? 'is-active' : ''} key={item.label} type="button" onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
      </nav>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="menu-button" type="button" aria-label="Toggle menu" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed(c => !c)}><Icon name="menu" /></button>
        <div className="topbar-title"><h1>Device Monitoring</h1><p>Track the status and health of all network devices.</p></div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <AdminNotifications />
        <ProfileMenu name={user.name} role={user.role} avatarInitial={user.initial} profilePath={user.profilePath} onLogout={handleLogout} />
      </header>

      <div className="dashboard-content">
        <section className="statistics-grid dm-stats">
          <StatCard icon="devices" number={String(counts.total)} title="Total Devices" tone="blue" />
          <StatCard icon="online" number={String(counts.online)} title="Online" tone="green" />
          <StatCard icon="warning" number={String(counts.warning)} title="Warning" tone="orange" />
          <StatCard icon="offline" number={String(counts.offline)} title="Offline" tone="red" />
        </section>

        <div className="incident-tools">
          <label className="incident-search">
            <Icon name="search" />
            <input type="text" placeholder="Search by name, ID, or IP address..." value={query} onChange={e => setQuery(e.target.value)} />
          </label>
          <button type="button" className={`incident-new live${live ? ' selected' : ''}`} onClick={() => setLive(l => !l)} title={live ? `Auto-refreshing every 20s, last updated ${lastUpdated.toLocaleTimeString()}` : 'Auto-refresh paused'}>
            <Icon name={live ? 'online' : 'offline'} /> {live ? 'Live' : 'Paused'}
          </button>
          <button type="button" className="incident-new" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" /> Add Device
          </button>
        </div>

        <div className="dm-filters incident-tools">
          <label className="dm-filter-select">
            Type
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option>All Types</option>
              <option>Router</option>
              <option>Switch</option>
              <option>Access Point</option>
            </select>
          </label>
          <label className="dm-filter-select">
            Status
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All Statuses</option>
              <option>Online</option>
              <option>Warning</option>
              <option>Offline</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="dm-grid"><div className="dashboard-card dm-empty">No devices match your search or filters.</div></div>
        ) : (
          <div className="dm-grid">
            {filtered.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                expanded={expandedId === device.id}
                onToggle={() => setExpandedId(current => current === device.id ? null : device.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>

    {showAddModal && (
      <AddDeviceModal
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDevice}
        existingIds={deviceList.map(d => d.id)}
      />
    )}
  </div>
}

export default DeviceMonitoring
