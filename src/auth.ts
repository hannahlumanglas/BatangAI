export const AUTH_STORAGE_KEY = 'batangai-admin-auth'

export type UserRole = 'Administrator' | 'Employee' | 'Secretary' | 'IT Personnel'

type AuthSession = {
  username: 'admin' | 'employee' | 'secretary' | 'itpersonnel'
  role: UserRole
  isAuthenticated: true
}

const accounts = {
  admin: { password: 'admin123', role: 'Administrator' },
  employee: { password: 'employee123', role: 'Employee' },
  secretary: { password: 'secretary123', role: 'Secretary' },
  itpersonnel: { password: 'it123', role: 'IT Personnel' },
} as const

const profileNames = { admin: 'Ricardo Mendoza', employee: 'Juan Dela Cruz', secretary: 'Teresa Lopez', itpersonnel: 'Juan dela Cruz', guest: 'BatangAI User' } as const

/** A local fallback portrait means every account has an identifiable profile image before upload. */
export function getDefaultProfileAvatar(username = getAuthSession()?.username ?? 'guest') {
  const name = profileNames[username as keyof typeof profileNames] ?? profileNames.guest
  const color = { admin: '#075df6', employee: '#009b5a', secretary: '#7c3aed', itpersonnel: '#d97706', guest: '#64748b' }[username as keyof typeof profileNames] ?? '#64748b'
  const initials = name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="${color}"/><circle cx="60" cy="43" r="23" fill="white" fill-opacity=".92"/><path d="M22 112c5-27 20-42 38-42s33 15 38 42" fill="white" fill-opacity=".92"/><text x="60" y="112" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="${color}">${initials}</text></svg>`)}`
}

export function signIn(username: string, password: string): AuthSession | null {
  const account = accounts[username as keyof typeof accounts]
  if (!account || account.password !== password) return null

  const session: AuthSession = {
    username: username as AuthSession['username'],
    role: account.role,
    isAuthenticated: true,
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function getAuthSession(): AuthSession | null {
  const savedSession = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!savedSession) return null

  try {
    const parsed = JSON.parse(savedSession) as Partial<AuthSession>
    const username = parsed.username
    if (parsed.isAuthenticated !== true || (username !== 'admin' && username !== 'employee' && username !== 'secretary' && username !== 'itpersonnel')) return null

    // The username is the authority for the hardcoded accounts. This also
    // safely migrates sessions saved before the role labels were standardized.
    return {
      username,
      role: username === 'admin' ? 'Administrator' : username === 'secretary' ? 'Secretary' : username === 'itpersonnel' ? 'IT Personnel' : 'Employee',
      isAuthenticated: true,
    }
  } catch {
    return null
  }
}

export function hasRole(role: UserRole) {
  return getAuthSession()?.role === role
}

export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
