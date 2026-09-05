import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AUTH_STORAGE_KEY,
  getAuthSession,
  getDefaultProfileAvatar,
  getProfilePhotoUrl,
  signOut,
} from '../../auth'
import logo from '../../assets/logo.png'
import { AdminNotifications } from './AdminNotifications'
import './Dashboard.css'
import './Profile.css'

type Audience =
  | 'administrator'
  | 'secretary'
  | 'it'
  | 'employee'

type View =
  | 'profile'
  | 'settings'

type Account = {
  name: string
  email: string
  id: string
  department: string
  role: string
  initial: string
  profilePath: string
  settingsPath: string
}

type NavIconName =
  | 'dashboard'
  | 'incidents'
  | 'assign'
  | 'devices'
  | 'users'
  | 'reports'
  | 'profile'
  | 'settings'


/*
|--------------------------------------------------------------------------
| Convert the authenticated user's role into the Profile audience.
|--------------------------------------------------------------------------
*/
function getAudienceFromRole(role: string): Audience {
  switch (role) {
    case 'Administrator':
      return 'administrator'

    case 'Secretary':
      return 'secretary'

    case 'IT Personnel':
      return 'it'

    case 'Employee':
      return 'employee'

    default:
      return 'employee'
  }
}


/*
|--------------------------------------------------------------------------
| Build the account information from the authenticated session.
|--------------------------------------------------------------------------
*/
function getAccountFromSession(
  audience: Audience,
): Account | null {
  const session = getAuthSession()

  if (!session?.user) {
    return null
  }

  const user = session.user

  const paths: Record<
    Audience,
    {
      profilePath: string
      settingsPath: string
    }
  > = {
    administrator: {
      profilePath: '/admin/profile',
      settingsPath: '/admin/settings',
    },

    secretary: {
      profilePath: '/secretary/profile',
      settingsPath: '/secretary/settings',
    },

    it: {
      profilePath: '/it/profile',
      settingsPath: '/it/settings',
    },

    employee: {
      profilePath: '/employee/profile',
      settingsPath: '/employee/settings',
    },
  }

  const path = paths[audience]

  return {
    name: user.fullName,
    email: user.email,
    id: user.employeeId,
    department: user.department,
    role: user.role,
    initial: user.fullName
      .split(/\s+/)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    profilePath: path.profilePath,
    settingsPath: path.settingsPath,
  }
}


/*
|--------------------------------------------------------------------------
| Storage key for account information.
|--------------------------------------------------------------------------
*/
function accountKey() {
  const userID = getAuthSession()?.user.userID ?? 'guest'

  return `batangai-account-${userID}`
}


/*
|--------------------------------------------------------------------------
| Profile navigation icons.
|--------------------------------------------------------------------------
*/
function ProfileNavIcon({
  name,
}: {
  name: NavIconName
}) {
  const paths: Record<NavIconName, JSX.Element> = {
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

    assign: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />
        <path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6M18 8v6M15 11h6" />
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

    settings: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3"
        />
        <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.7a7.6 7.6 0 0 0-2.6 1.5l-2.4-.7-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.7a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.7a7.6 7.6 0 0 0 2.6-1.5l2.4.7 2.4-.7 2-3.4Z" />
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


/*
|--------------------------------------------------------------------------
| Profile dropdown menu.
|--------------------------------------------------------------------------
*/
function ProfileMenu({
  account,
  avatar,
  onLogout,
}: {
  account: Account
  avatar: string
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

    document.addEventListener(
      'mousedown',
      close,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        close,
      )
    }
  }, [])

  return (
    <div
      className="profile-menu-root"
      ref={rootRef}
    >
      <button
        type="button"
        className="topbar-user profile-menu-trigger"
        onClick={() =>
          setOpen(value => !value)
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <div className="topbar-avatar">
          {avatar ? (
            <img
              src={avatar}
              alt=""
            />
          ) : (
            account.initial
          )}
        </div>

        <div>
          <strong>{account.name}</strong>
          <span>{account.role}</span>
        </div>

        <span className="profile-menu-chevron">
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
            onClick={() => {
              setOpen(false)
              navigate(account.profilePath)
            }}
          >
            My Profile
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate(account.settingsPath)
            }}
          >
            Settings
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate(
                `${account.settingsPath}#security`,
              )
            }}
          >
            Change Password
          </button>

          <span className="profile-menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}


/*
|--------------------------------------------------------------------------
| Main Profile component.
|--------------------------------------------------------------------------
*/
function Profile({
  audience: requestedAudience = 'administrator',
  view = 'profile',
}: {
  audience?: Audience
  view?: View
}) {
  const navigate = useNavigate()

  /*
  |--------------------------------------------------------------------------
  | Get currently authenticated user.
  |--------------------------------------------------------------------------
  */
  const session = getAuthSession()

  /*
  |--------------------------------------------------------------------------
  | If there is no logged-in user, return to login.
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!session?.user) {
      navigate('/', {
        replace: true,
      })
    }
  }, [session, navigate])

  /*
  |--------------------------------------------------------------------------
  | Determine actual audience from logged-in user's role.
  |--------------------------------------------------------------------------
  */
  const actualAudience = session?.user
    ? getAudienceFromRole(session.user.role)
    : requestedAudience

  /*
  |--------------------------------------------------------------------------
  | Build account from authentication session.
  |--------------------------------------------------------------------------
  */
  const sessionAccount =
    getAccountFromSession(actualAudience)

  /*
  |--------------------------------------------------------------------------
  | Fallback account.
  |--------------------------------------------------------------------------
  */
  const defaultAccount: Account =
    sessionAccount ?? {
      name: 'BatangAI User',
      email: '',
      id: '',
      department: '',
      role: '',
      initial: 'BU',
      profilePath: '/',
      settingsPath: '/',
    }

  /*
  |--------------------------------------------------------------------------
  | Account state.
  |--------------------------------------------------------------------------
  */
  const [account, setAccount] =
    useState<Account>(defaultAccount)

  /*
  |--------------------------------------------------------------------------
  | Keep account synchronized with authenticated user.
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const currentAccount =
      getAccountFromSession(actualAudience)

    if (currentAccount) {
      setAccount(currentAccount)
    }
  }, [actualAudience])

  /*
  |--------------------------------------------------------------------------
  | Profile avatar.
  |--------------------------------------------------------------------------
  |
  | Uses the profilePhoto saved in the authenticated session.
  | If no photo exists, a default avatar is generated.
  |--------------------------------------------------------------------------
  */
  const [avatar, setAvatar] = useState(() => {
    const currentSession = getAuthSession()

    if (!currentSession?.user) {
      return getDefaultProfileAvatar()
    }

    return getProfilePhotoUrl(
      currentSession.user.profilePhoto,
      currentSession.user.fullName,
      currentSession.user.role,
    )
  })

  /*
  |--------------------------------------------------------------------------
  | Profile editing.
  |--------------------------------------------------------------------------
  */
  const [editing, setEditing] =
    useState(false)

  const [notice, setNotice] =
    useState('')

  /*
  |--------------------------------------------------------------------------
  | Uploading state.
  |--------------------------------------------------------------------------
  */
  const [uploadingPhoto, setUploadingPhoto] =
    useState(false)

  /*
  |--------------------------------------------------------------------------
  | Theme.
  |--------------------------------------------------------------------------
  */
  const [theme, setTheme] =
    useState<'light' | 'dark'>(() =>
      localStorage.getItem(
        'batangai-theme',
      ) === 'dark'
        ? 'dark'
        : 'light',
    )

  /*
  |--------------------------------------------------------------------------
  | Two-factor authentication.
  |--------------------------------------------------------------------------
  */
  const [twoFactor, setTwoFactor] =
    useState(
      () =>
        localStorage.getItem(
          'batangai-two-factor',
        ) === 'true',
    )

  /*
  |--------------------------------------------------------------------------
  | Password.
  |--------------------------------------------------------------------------
  */
  const [password, setPassword] =
    useState({
      next: '',
      confirm: '',
    })

  const fileRef =
    useRef<HTMLInputElement>(null)

  /*
  |--------------------------------------------------------------------------
  | Account information displayed on the page.
  |--------------------------------------------------------------------------
  */
  const info = useMemo(
    () => [
      [
        'Full name',
        account.name,
      ],
      [
        'Email address',
        account.email,
      ],
      [
        'Employee ID',
        account.id,
      ],
      [
        'Department',
        account.department,
      ],
      [
        'Role',
        account.role,
      ],
    ],
    [account],
  )

  /*
  |--------------------------------------------------------------------------
  | Navigation based on role.
  |--------------------------------------------------------------------------
  */
  const navigation:
    {
      label: string
      path: string
      icon: NavIconName
    }[] =
    actualAudience === 'administrator'
      ? [
          {
            label: 'Dashboard',
            path: '/admin',
            icon: 'dashboard',
          },
          {
            label: 'All Incidents',
            path: '/admin/incidents',
            icon: 'incidents',
          },
          {
            label: 'Manage & Assign',
            path: '/admin/manage-assign',
            icon: 'assign',
          },
          {
            label: 'Device Monitoring',
            path: '/admin/device-monitoring',
            icon: 'devices',
          },
          {
            label: 'User Management',
            path: '/admin/user-management',
            icon: 'users',
          },
          {
            label: 'Generate Reports',
            path: '/admin/generate-reports',
            icon: 'reports',
          },
        ]
      : actualAudience === 'secretary'
        ? [
            {
              label: 'All Incidents',
              path: '/secretary/incidents',
              icon: 'incidents',
            },
            {
              label: 'Manage & Assign',
              path: '/secretary/manage-assign',
              icon: 'assign',
            },
          ]
        : actualAudience === 'it'
          ? [
              {
                label: 'All Incidents',
                path: '/it/incidents',
                icon: 'incidents',
              },
              {
                label: 'My Assignments',
                path: '/it/my-assignments',
                icon: 'assign',
              },
              {
                label: 'Device Monitoring',
                path: '/it/device-monitoring',
                icon: 'devices',
              },
            ]
          : [
              {
                label: 'Report Incident',
                path: '/employee/report-incident',
                icon: 'reports',
              },
              {
                label: 'All Incidents',
                path: '/employee/incidents',
                icon: 'incidents',
              },
            ]

  /*
  |--------------------------------------------------------------------------
  | Theme effect.
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme,
    )

    localStorage.setItem(
      'batangai-theme',
      theme,
    )
  }, [theme])

  /*
  |--------------------------------------------------------------------------
  | Save profile information.
  |--------------------------------------------------------------------------
  */
  const saveAccount = () => {
    localStorage.setItem(
      accountKey(),
      JSON.stringify(account),
    )

    setEditing(false)

    setNotice(
      'Your account information has been updated.',
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Upload profile photo.
  |--------------------------------------------------------------------------
  |
  | Sends the selected image to:
  |
  | upload_profile_photo.php
  |
  | The PHP API saves the image to:
  |
  | uploads/profile_photos/
  |
  | and updates:
  |
  | users.profilePhoto
  |--------------------------------------------------------------------------
  */
  const uploadAvatar = async (
    file?: File,
  ) => {
    if (!file) {
      return
    }

    const currentSession = getAuthSession()

    if (!currentSession?.user) {
      setNotice(
        'You are not logged in.',
      )

      return
    }

    /*
    |--------------------------------------------------------------------------
    | Validate image type.
    |--------------------------------------------------------------------------
    */
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setNotice(
        'Please choose a JPG, PNG, or WEBP image.',
      )

      return
    }

    /*
    |--------------------------------------------------------------------------
    | Validate file size.
    |--------------------------------------------------------------------------
    */
    const maxFileSize =
      5 * 1024 * 1024

    if (file.size > maxFileSize) {
      setNotice(
        'Profile photo must not exceed 5 MB.',
      )

      return
    }

    /*
    |--------------------------------------------------------------------------
    | Start uploading.
    |--------------------------------------------------------------------------
    */
    setUploadingPhoto(true)

    setNotice(
      'Uploading profile photo...',
    )

    try {
      const formData =
        new FormData()

      formData.append(
        'userID',
        String(
          currentSession.user.userID,
        ),
      )

      formData.append(
        'profilePhoto',
        file,
      )

      const response =
        await fetch(
          'http://localhost/BatangAI/api/upload_profile_photo.php',
          {
            method: 'POST',
            body: formData,
          },
        )

      const data =
        await response.json()

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to upload profile photo.',
        )
      }

      /*
      |--------------------------------------------------------------------------
      | Update authentication session with new photo.
      |--------------------------------------------------------------------------
      */
      const updatedSession = {
        ...currentSession,
        user: {
          ...currentSession.user,
          profilePhoto:
            data.profilePhoto,
        },
      }

      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(
          updatedSession,
        ),
      )

      /*
      |--------------------------------------------------------------------------
      | Build the new photo URL.
      |--------------------------------------------------------------------------
      */
      const newAvatar =
        getProfilePhotoUrl(
          data.profilePhoto,
          currentSession.user.fullName,
          currentSession.user.role,
        )

      /*
      |--------------------------------------------------------------------------
      | Immediately update the profile page.
      |--------------------------------------------------------------------------
      */
      setAvatar(newAvatar)

      /*
      |--------------------------------------------------------------------------
      | Reset file input so the same file can be selected again.
      |--------------------------------------------------------------------------
      */
      if (fileRef.current) {
        fileRef.current.value = ''
      }

      setNotice(
        'Profile photo updated successfully.',
      )

    } catch (error) {
      console.error(
        'Profile photo upload error:',
        error,
      )

      setNotice(
        error instanceof Error
          ? error.message
          : 'Failed to upload profile photo.',
      )

    } finally {
      setUploadingPhoto(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update password.
  |--------------------------------------------------------------------------
  */
  const updatePassword = () => {
    if (password.next.length < 8) {
      setNotice(
        'Password must contain at least 8 characters.',
      )

      return
    }

    if (
      password.next !==
      password.confirm
    ) {
      setNotice(
        'Passwords do not match.',
      )

      return
    }

    setPassword({
      next: '',
      confirm: '',
    })

    setNotice(
      'Password updated successfully.',
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Toggle 2FA.
  |--------------------------------------------------------------------------
  */
  const toggle2FA = () => {
    const next = !twoFactor

    setTwoFactor(next)

    localStorage.setItem(
      'batangai-two-factor',
      String(next),
    )

    setNotice(
      next
        ? 'Two-factor authentication enabled.'
        : 'Two-factor authentication disabled.',
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Logout.
  |--------------------------------------------------------------------------
  */
  const handleLogout = () => {
    signOut()

    navigate('/', {
      replace: true,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | Render.
  |--------------------------------------------------------------------------
  */
  return (
    <div className="admin-shell profile-shell">

      {/* ================================================================
          SIDEBAR
      ================================================================ */}
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
          aria-label={`${account.role} navigation`}
        >

          {navigation.map(item => (
            <button
              key={item.path}
              type="button"
              onClick={() =>
                navigate(item.path)
              }
            >

              <ProfileNavIcon
                name={item.icon}
              />

              <span>
                {item.label}
              </span>

            </button>
          ))}

          <button
            type="button"
            className={
              view === 'profile'
                ? 'is-active'
                : ''
            }
            onClick={() =>
              navigate(
                account.profilePath,
              )
            }
          >

            <ProfileNavIcon
              name="profile"
            />

            <span>
              Profile
            </span>

          </button>

          <button
            type="button"
            className={
              view === 'settings'
                ? 'is-active'
                : ''
            }
            onClick={() =>
              navigate(
                account.settingsPath,
              )
            }
          >

            <ProfileNavIcon
              name="settings"
            />

            <span>
              Settings
            </span>

          </button>

        </nav>

      </aside>


      {/* ================================================================
          MAIN
      ================================================================ */}
      <main className="admin-main">

        {/* ==============================================================
            TOP BAR
        ============================================================== */}
        <header className="admin-topbar">

          <div className="topbar-title">

            <h1>
              {view === 'profile'
                ? 'My Profile'
                : 'Settings'}
            </h1>

            <p>
              {view === 'profile'
                ? 'Review and update your account information.'
                : 'Manage appearance and account security.'}
            </p>

          </div>

          <AdminNotifications />

          <ProfileMenu
            account={account}
            avatar={avatar}
            onLogout={handleLogout}
          />

        </header>


        {/* ==============================================================
            PAGE CONTENT
        ============================================================== */}
        <div className="dashboard-content profile-page-content">

          {/* ============================================================
              NOTICE
          ============================================================ */}
          {notice && (
            <div
              className="profile-toast"
              role="status"
            >

              {notice}

              <button
                type="button"
                onClick={() =>
                  setNotice('')
                }
                aria-label="Dismiss"
              >
                ×
              </button>

            </div>
          )}


          {/* ============================================================
              PROFILE
          ============================================================ */}
          {view === 'profile' ? (

            <section className="profile-layout">

              {/* ========================================================
                  PROFILE PHOTO
              ======================================================== */}
              <article className="dashboard-card profile-identity-card">

                <div className="profile-photo">

                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile"
                    />
                  ) : (
                    account.initial
                  )}

                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  disabled={uploadingPhoto}
                  onChange={event =>
                    uploadAvatar(
                      event.target.files?.[0],
                    )
                  }
                />

                <button
                  type="button"
                  className="profile-photo-button"
                  disabled={uploadingPhoto}
                  onClick={() =>
                    fileRef.current?.click()
                  }
                >
                  {uploadingPhoto
                    ? 'Uploading...'
                    : 'Change photo'}
                </button>

                <small>
                  JPG, PNG, or WEBP.
                  Maximum 5 MB.
                  Your photo appears
                  in the top bar.
                </small>

              </article>


              {/* ========================================================
                  ACCOUNT INFORMATION
              ======================================================== */}
              <article className="dashboard-card profile-card">

                <div className="profile-card-heading">

                  <div>

                    <h2>
                      Account Information
                    </h2>

                    <p>
                      Keep your personal
                      details accurate.
                    </p>

                  </div>

                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={() =>
                      editing
                        ? saveAccount()
                        : setEditing(true)
                    }
                  >
                    {editing
                      ? 'Save changes'
                      : 'Edit information'}
                  </button>

                </div>


                <div className="account-form">

                  {info.map(
                    ([label, value]) => (
                      <label
                        key={label}
                      >

                        <span>
                          {label}
                        </span>

                        <input
                          value={value}
                          disabled={
                            !editing ||
                            label ===
                              'Employee ID' ||
                            label ===
                              'Role'
                          }
                          onChange={event => {

                            const newValue =
                              event.target
                                .value

                            setAccount(
                              current => ({
                                ...current,

                                ...(label ===
                                'Full name'
                                  ? {
                                      name: newValue,
                                    }
                                  : label ===
                                    'Email address'
                                    ? {
                                        email:
                                          newValue,
                                      }
                                    : label ===
                                      'Department'
                                      ? {
                                          department:
                                            newValue,
                                        }
                                      : {}),
                              }),
                            )

                          }}
                        />

                      </label>
                    ),
                  )}

                </div>

              </article>

            </section>

          ) : (

            /* ============================================================
               SETTINGS
            ============================================================ */
            <section className="settings-layout">

              {/* ========================================================
                  APPEARANCE
              ======================================================== */}
              <article className="dashboard-card settings-card">

                <div>

                  <h2>
                    Appearance
                  </h2>

                  <p>
                    Choose the display
                    theme you prefer.
                  </p>

                </div>

                <div className="theme-options">

                  <button
                    type="button"
                    className={
                      theme === 'light'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      setTheme('light')
                    }
                  >
                    ☀

                    <span>
                      Light mode
                    </span>

                  </button>

                  <button
                    type="button"
                    className={
                      theme === 'dark'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      setTheme('dark')
                    }
                  >
                    ☾

                    <span>
                      Dark mode
                    </span>

                  </button>

                </div>

              </article>


              {/* ========================================================
                  SECURITY
              ======================================================== */}
              <article
                className="dashboard-card settings-card"
                id="security"
              >

                <div>

                  <h2>
                    Security
                  </h2>

                  <p>
                    Protect your account
                    and sign-in details.
                  </p>

                </div>


                {/* ======================================================
                    TWO FACTOR
                ====================================================== */}
                <div className="security-row">

                  <div>

                    <strong>
                      Two-factor authentication
                    </strong>

                    <span>
                      Add a verification
                      step when signing in.
                    </span>

                  </div>

                  <button
                    type="button"
                    className={`security-switch${
                      twoFactor
                        ? ' enabled'
                        : ''
                    }`}
                    onClick={toggle2FA}
                    aria-pressed={
                      twoFactor
                    }
                  >
                    <i />
                  </button>

                </div>


                {/* ======================================================
                    CHANGE PASSWORD
                ====================================================== */}
                <div className="password-form">

                  <h3>
                    Change password
                  </h3>

                  <label>

                    New password

                    <input
                      type="password"
                      value={
                        password.next
                      }
                      onChange={event =>
                        setPassword(
                          current => ({
                            ...current,
                            next:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="At least 8 characters"
                    />

                  </label>

                  <label>

                    Confirm new password

                    <input
                      type="password"
                      value={
                        password.confirm
                      }
                      onChange={event =>
                        setPassword(
                          current => ({
                            ...current,
                            confirm:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Re-enter password"
                    />

                  </label>

                  <button
                    type="button"
                    className="incident-new"
                    onClick={
                      updatePassword
                    }
                  >
                    Update password
                  </button>

                </div>

              </article>

            </section>
          )}

        </div>

      </main>

    </div>
  )
}

export default Profile