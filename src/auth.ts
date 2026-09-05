export const AUTH_STORAGE_KEY = 'batangai-admin-auth'

export type UserRole =
  | 'Administrator'
  | 'Employee'
  | 'Secretary'
  | 'IT Personnel'

export type AuthUser = {
  userID: number | string
  dateCreated?: string
  department: string
  email: string
  employeeId: string
  fullName: string
  profilePhoto?: string | null
  role: UserRole
  status: string
}

export type AuthSession = {
  user: AuthUser
  isAuthenticated: true
}

/**
 * Creates a default profile avatar using the actual
 * logged-in user's full name.
 */
export function getDefaultProfileAvatar(
  fullName?: string,
  role?: UserRole,
) {
  const name = fullName?.trim() || 'BatangAI User'

  const colors: Record<UserRole | 'guest', string> = {
    Administrator: '#075df6',
    Employee: '#009b5a',
    Secretary: '#7c3aed',
    'IT Personnel': '#d97706',
    guest: '#64748b',
  }

  const color =
    role && colors[role]
      ? colors[role]
      : colors.guest

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect
        width="120"
        height="120"
        rx="60"
        fill="${color}"
      />

      <circle
        cx="60"
        cy="43"
        r="23"
        fill="white"
        fill-opacity=".92"
      />

      <path
        d="M22 112c5-27 20-42 38-42s33 15 38 42"
        fill="white"
        fill-opacity=".92"
      />

      <text
        x="60"
        y="112"
        text-anchor="middle"
        font-family="Arial,sans-serif"
        font-size="17"
        font-weight="700"
        fill="${color}"
      >
        ${initials}
      </text>
    </svg>
  `)}`
}

/**
 * Returns the uploaded profile photo URL if available.
 * Otherwise, returns a default avatar using the actual
 * logged-in user's name.
 */
export function getProfilePhotoUrl(
  profilePhoto?: string | null,
  fullName?: string,
  role?: UserRole,
) {
  // No uploaded photo
  if (!profilePhoto) {
    return getDefaultProfileAvatar(
      fullName,
      role,
    )
  }

  // Already a complete URL or Base64 image
  if (
    profilePhoto.startsWith('http://') ||
    profilePhoto.startsWith('https://') ||
    profilePhoto.startsWith('data:')
  ) {
    return profilePhoto
  }

  // Uploaded photo stored in XAMPP
  return `http://localhost/BatangAI/uploads/profile_photos/${profilePhoto}`
}

/**
 * Logs in using the PHP/MySQL authentication API.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthSession | null> {
  try {
    const response = await fetch(
      'http://localhost/BatangAI/api/login.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
    )

    const data = await response.json()

    if (
      !response.ok ||
      !data.success ||
      !data.user
    ) {
      return null
    }

    const user = data.user as AuthUser

    const session: AuthSession = {
      user,
      isAuthenticated: true,
    }

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(session),
    )

    return session
  } catch (error) {
    console.error('Login error:', error)

    return null
  }
}

/**
 * Returns the currently logged-in user's session.
 */
export function getAuthSession(): AuthSession | null {
  const savedSession =
    localStorage.getItem(AUTH_STORAGE_KEY)

  if (!savedSession) {
    return null
  }

  try {
    const parsed =
      JSON.parse(savedSession) as Partial<AuthSession>

    if (
      parsed.isAuthenticated !== true ||
      !parsed.user
    ) {
      return null
    }

    const user = parsed.user as AuthUser

    if (
      !user.userID ||
      !user.email ||
      !user.fullName ||
      !user.department ||
      !user.role
    ) {
      return null
    }

    return {
      user,
      isAuthenticated: true,
    }
  } catch {
    return null
  }
}

/**
 * Returns the role of the currently logged-in user.
 */
export function getCurrentUserRole(): UserRole | null {
  return getAuthSession()?.user.role ?? null
}

/**
 * Checks whether the logged-in user has a specific role.
 */
export function hasRole(role: UserRole) {
  return getCurrentUserRole() === role
}

/**
 * Returns the currently logged-in user's database ID.
 */
export function getCurrentUserId(): number | string | null {
  return getAuthSession()?.user.userID ?? null
}

/**
 * Returns the currently logged-in user's full name.
 */
export function getCurrentUserName(): string {
  return (
    getAuthSession()?.user.fullName ??
    'BatangAI User'
  )
}

/**
 * Returns the currently logged-in user's department.
 */
export function getCurrentUserDepartment(): string {
  return (
    getAuthSession()?.user.department ?? ''
  )
}

/**
 * Returns the currently logged-in user's email.
 */
export function getCurrentUserEmail(): string {
  return (
    getAuthSession()?.user.email ?? ''
  )
}

/**
 * Returns the currently logged-in user's profile photo.
 */
export function getCurrentUserProfilePhoto(): string {
  const session = getAuthSession()

  if (!session) {
    return getDefaultProfileAvatar()
  }

  return getProfilePhotoUrl(
    session.user.profilePhoto,
    session.user.fullName,
    session.user.role,
  )
}

/**
 * Logs out the current user.
 */
export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}