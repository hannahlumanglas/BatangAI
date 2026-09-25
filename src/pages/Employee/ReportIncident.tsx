import { useState, useEffect } from 'react'
import type { FormEvent, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from '../Admin/AdminNotifications'
import { ProfileMenu } from './Profile'
import {
  getAuthSession,
  getCurrentUserId,
  getCurrentUserDepartment,
} from '../../auth'
import '../Admin/Dashboard.css'
import './ReportIncident.css'
import { API_BASE_URL } from '../../apiConfig'

type IconName =
  | 'report'
  | 'incidents'
  | 'profile'
  | 'menu'
  | 'logout'
  | 'check'
  | 'sparkle'

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
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.7 2.7L16.5 9" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
        <path d="m19 16 .6 2.4L22 19l-2.4.6L19 16Z" />
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

/* =============================================================
   SHARED INCIDENT FORM PIECES
   ============================================================= */

export const ISSUE_CATEGORIES = [
  'Network Connectivity',
  'Hardware Malfunction',
  'Software / Application Error',
  'Email / Communication',
  'Printer / Peripheral',
  'Server / System Downtime',
  'Security / Access Issue',
]

export const DEVICE_TYPES = [
  'Desktop Computer',
  'Laptop',
  'Printer',
  'Router',
  'Switch',
  'Access Point',
]

export const CONNECTION_TYPES = ['LAN', 'Wi-Fi']

export type IncidentFormValues = {
  department: string
  location: string
  issueCategory: string
  deviceType: string
  connectionType: string
  affectedService: string
  description: string
}

/*
 * AI analysis returned by analyze_incident.php.
 *
 * Gemini provides assistance only. It does not resolve,
 * assign, close, or determine the final status of an incident.
 *
 * The IT troubleshooting field is retained internally so
 * that it can be stored with the incident for IT Personnel.
 * It is NOT displayed to Employees.
 */
export type IncidentAnalysis = {
  summary: string
  possibleInterpretation: string
  basicSelfHelp: string
  itTroubleshooting: string
}

/*
 * Generates a non-AI fallback representation of the incident.
 *
 * This is intentionally not presented as an AI-generated analysis.
 * It allows normal incident submission when Gemini is unavailable.
 */
export function generateIncidentAnalysis(
  values: IncidentFormValues,
): IncidentAnalysis {
  return {
    summary: `${values.affectedService} — ${values.description}`,
    possibleInterpretation:
      'No AI interpretation is available. IT Support should review the reported symptoms and determine the appropriate technical assessment.',
    basicSelfHelp:
      'Check that the device is properly connected and try restarting the affected device if appropriate. If the problem continues, submit the incident for IT Support review.',
    itTroubleshooting:
      'AI assistance was unavailable. IT Support should manually assess the incident based on the reported symptoms and available network information.',
  }
}

/*
 * Calls the PHP Gemini API.
 */
async function analyzeIncidentWithAI(
  values: IncidentFormValues,
): Promise<IncidentAnalysis> {
  const response = await fetch(
    `${API_BASE_URL}/analyze_incident.php`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        department: values.department,
        location: values.location,
        issueCategory: values.issueCategory,
        deviceType: values.deviceType,
        connectionType: values.connectionType,
        affectedService: values.affectedService,
        description: values.description,
      }),
    },
  )

  const responseText = await response.text()

  console.log('Gemini PHP Response:', responseText)

  let data

  try {
    data = JSON.parse(responseText)
  } catch {
    throw new Error(
      'The AI server returned an invalid response.',
    )
  }

  if (!response.ok || !data.success || !data.analysis) {
    console.error('Gemini analysis error:', data)

    throw new Error(
      data.message ||
        'AI assistance is currently unavailable.',
    )
  }

  return {
    summary: data.analysis.summary || '',
    possibleInterpretation:
      data.analysis.possibleInterpretation || '',
    basicSelfHelp: data.analysis.basicSelfHelp || '',
    itTroubleshooting:
      data.analysis.itTroubleshooting || '',
  }
}

/*
 * Combines the AI troubleshooting sections for storage
 * in the existing incidents.troubleshooting field.
 *
 * IT troubleshooting is stored for IT Personnel review.
 * It is not displayed to Employees.
 */
function formatTroubleshootingForStorage(
  analysis: IncidentAnalysis,
): string {
  return [
    'Basic Self-Help:',
    analysis.basicSelfHelp,
    '',
    'IT Troubleshooting Suggestions:',
    analysis.itTroubleshooting,
  ].join('\n')
}

export function IncidentDetailsFields({
  values,
  onChange,
  departmentEditable = false,
}: {
  values: IncidentFormValues
  onChange: (
    field: keyof IncidentFormValues,
    value: string,
  ) => void
  departmentEditable?: boolean
}) {
  return (
    <fieldset className="incident-form-section">
      <legend className="sr-only">Incident Details</legend>

      <div className="incident-form-section-header">
        <span className="incident-form-badge">1</span>
        <h3>Incident Details</h3>
      </div>

      <div className="incident-form-grid">
        <label className="incident-field">
          <span className="incident-field-label">
            Department
          </span>

          <input
            value={values.department}
            readOnly={!departmentEditable}
            disabled={!departmentEditable}
            title={
              departmentEditable
                ? 'Department'
                : 'Automatically filled from your registered account'
            }
            onChange={e =>
              onChange('department', e.target.value)
            }
          />
        </label>

        <label className="incident-field">
          <span className="incident-field-label">
            Location / Room <em>*</em>
          </span>

          <input
            required
            placeholder="e.g. 2nd Floor, IT Room"
            value={values.location}
            onChange={e =>
              onChange('location', e.target.value)
            }
          />
        </label>

        <label className="incident-field">
          <span className="incident-field-label">
            Issue Category <em>*</em>
          </span>

          <select
            required
            value={values.issueCategory}
            onChange={e =>
              onChange('issueCategory', e.target.value)
            }
          >
            <option value="">Select a category</option>

            {ISSUE_CATEGORIES.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="incident-field">
          <span className="incident-field-label">
            Device Type <em>*</em>
          </span>

          <select
            required
            value={values.deviceType}
            onChange={e =>
              onChange('deviceType', e.target.value)
            }
          >
            <option value="">Select a device type</option>

            {DEVICE_TYPES.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="incident-field">
          <span className="incident-field-label">
            Connection Type <em>*</em>
          </span>

          <select
            required
            value={values.connectionType}
            onChange={e =>
              onChange('connectionType', e.target.value)
            }
          >
            <option value="">
              Select a connection type
            </option>

            {CONNECTION_TYPES.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  )
}

export function IncidentDescriptionFields({
  values,
  onChange,
}: {
  values: IncidentFormValues
  onChange: (
    field: keyof IncidentFormValues,
    value: string,
  ) => void
}) {
  return (
    <fieldset className="incident-form-section">
      <legend className="sr-only">
        Problem Description
      </legend>

      <div className="incident-form-section-header">
        <span className="incident-form-badge">2</span>
        <h3>Problem Description</h3>
      </div>

      <div className="incident-form-grid incident-form-grid--single">
        <label className="incident-field">
          <span className="incident-field-label">
            Affected Issue / Service <em>*</em>
          </span>

          <input
            required
            placeholder="e.g. Records System login"
            value={values.affectedService}
            onChange={e =>
              onChange(
                'affectedService',
                e.target.value,
              )
            }
          />
        </label>

        <label className="incident-field">
          <span className="incident-field-label">
            Detailed Problem Description <em>*</em>
          </span>

          <textarea
            required
            rows={4}
            placeholder="Describe what happened, when it started, and any error messages you saw."
            value={values.description}
            onChange={e =>
              onChange('description', e.target.value)
            }
          />
        </label>
      </div>
    </fieldset>
  )
}

/*
 * Employee-facing AI analysis result.
 *
 * IMPORTANT:
 * IT troubleshooting suggestions are intentionally NOT
 * rendered here. They remain available inside the
 * IncidentAnalysis object and are stored in the database
 * for IT Personnel review.
 */
export function IncidentAnalysisResult({
  analysis,
  reviewNote,
}: {
  analysis: IncidentAnalysis
  reviewNote: string
}) {
  return (
    <>
      <div className="employee-ai-result-heading">
        <svg
          className="admin-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
          <path d="m19 16 .6 2.4L22 19l-2.4.6L19 16Z" />
        </svg>

        <div>
          <h3>BatangAI Analysis Result</h3>
          <p>{reviewNote}</p>
        </div>
      </div>

      <div className="employee-ai-block">
        <span>Incident Summary</span>

        <p>{analysis.summary}</p>
      </div>

      <div className="employee-ai-block">
        <span>Possible Interpretation</span>

        <p>
          {analysis.possibleInterpretation ||
            'No possible interpretation was generated from the provided information.'}
        </p>
      </div>

      <div className="employee-ai-block">
        <span>Basic Self-Help</span>

        <p>
          {analysis.basicSelfHelp ||
            'No basic self-help steps were generated. Please wait for IT Support assistance.'}
        </p>
      </div>
    </>
  )
}

function getInitialValues(): IncidentFormValues {
  return {
    department: getCurrentUserDepartment(),
    location: '',
    issueCategory: '',
    deviceType: '',
    connectionType: '',
    affectedService: '',
    description: '',
  }
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
  const [theme, setTheme] = useState<Theme>(
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
      current === 'dark' ? 'light' : 'dark',
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
          <circle cx="12" cy="12" r="4.2" />
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

function ReportIncident() {
  const navigate = useNavigate()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const { theme, toggleTheme } = useTheme()

  const [submitted, setSubmitted] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [analyzing, setAnalyzing] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const [analysisError, setAnalysisError] =
    useState('')

  const [values, setValues] =
    useState<IncidentFormValues>(
      getInitialValues,
    )

  const [phase, setPhase] =
    useState<'form' | 'result'>('form')

  const [resolutionStatus, setResolutionStatus] =
    useState<
      'resolved' | 'unresolved' | null
    >(null)

  const [aiAnalysis, setAiAnalysis] =
    useState<IncidentAnalysis | null>(null)

  const [aiWasUnavailable, setAiWasUnavailable] =
    useState(false)

  const handleLogout = () => {
    localStorage.removeItem(
      'batangai-admin-auth',
    )

    navigate('/')
  }

  const currentUser =
    getAuthSession()?.user

  const analyze = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (analyzing) {
      return
    }

    setAnalysisError('')
    setSubmitError('')
    setAiAnalysis(null)
    setAiWasUnavailable(false)

    try {
      setAnalyzing(true)

      const analysis =
        await analyzeIncidentWithAI(values)

      setAiAnalysis(analysis)
      setPhase('result')
    } catch (error) {
      console.error(
        'AI analysis error:',
        error,
      )

      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'AI assistance is currently unavailable.',
      )

      setAiWasUnavailable(true)
    } finally {
      setAnalyzing(false)
    }
  }

  /*
   * Allows normal incident reporting even when Gemini
   * is unavailable.
   */
  const continueWithoutAI = () => {
    setAnalysisError('')

    const fallbackAnalysis =
      generateIncidentAnalysis(values)

    setAiAnalysis(fallbackAnalysis)
    setAiWasUnavailable(true)
    setPhase('result')
  }

  const submit = async () => {
    setSubmitError('')

    if (submitting) {
      return
    }

    const userId =
      getCurrentUserId()

    if (
      !userId ||
      currentUser?.role !== 'Employee'
    ) {
      setSubmitError(
        'Your Employee login session has expired. Please log in again.',
      )

      navigate('/')

      return
    }

    if (!resolutionStatus) {
      setSubmitError(
        'Please select whether the basic self-help resolved the issue before submitting.',
      )

      return
    }

    if (!aiAnalysis) {
      setSubmitError(
        'Please continue with the incident submission.',
      )

      return
    }

    const analysis = aiAnalysis

    try {
      setSubmitting(true)

      const response = await fetch(
        `${API_BASE_URL}/create_incident.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            userId,

            affectedIssue:
              values.affectedService,

            description:
              values.description,

            issueCategory:
              values.issueCategory,

            deviceType:
              values.deviceType,

            connectionType:
              values.connectionType,

            location:
              values.location,

            // Severity is set by Admin/Secretary only.
            severity: null,

            /*
             * Classification is based on the employee-selected
             * issue category. It is not presented as an AI decision.
             */
            classification:
              values.issueCategory,

            summary:
              analysis.summary,

            /*
             * Both employee-safe self-help and IT-only
             * troubleshooting are stored in the database.
             *
             * The employee UI does not display the IT section.
             */
            troubleshooting:
              formatTroubleshootingForStorage(
                analysis,
              ),
          }),
        },
      )

      const responseText =
        await response.text()

      console.log(
        'PHP Response:',
        responseText,
      )

      let data

      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error(
          'Invalid JSON from PHP:',
          responseText,
        )

        alert(
          'The server returned an invalid response. Please check your PHP API.',
        )

        return
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setSubmitError(
          data.message ||
            'Failed to submit incident.',
        )

        console.error(
          'Create incident error:',
          data,
        )

        return
      }

      console.log(
        'Incident created:',
        data,
      )

      setSubmitted(true)

      setValues(
        getInitialValues(),
      )

      setPhase('form')

      setResolutionStatus(null)

      setAiAnalysis(null)

      setAiWasUnavailable(false)

      setAnalysisError('')

      alert(
        `Incident submitted successfully!\nIncident ID: ${data.incidentID}`,
      )
    } catch (error) {
      console.error(
        'Submit incident error:',
        error,
      )

      setSubmitError(
        'Unable to submit the report. Please make sure the shared API and database are available.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const closeReport = () => {
    setValues(
      getInitialValues(),
    )

    setPhase('form')

    setResolutionStatus(null)

    setAiAnalysis(null)

    setAiWasUnavailable(false)

    navigate('/employee/incidents')
  }

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
            Batang<span>AI</span>
          </strong>
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Employee navigation"
        >
          {navigation.map(item => (
            <button
              key={item.label}
              type="button"
              className={
                item.label ===
                'Report Incident'
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                navigate(item.path)
              }
            >
              <Icon name={item.icon} />

              <span>
                {item.label}
              </span>
            </button>
          ))}
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
                value => !value,
              )
            }
          >
            <Icon name="menu" />
          </button>

          <div className="topbar-title">
            <h1>Report Incident</h1>
            <p>
              Submit a new IT incident report.
            </p>
          </div>

          <ThemeToggle
            theme={theme}
            onToggle={toggleTheme}
          />

          <AdminNotifications />

          <ProfileMenu
            name={
              currentUser?.fullName ||
              'Employee'
            }
            role="Employee"
            avatarInitial={(
              currentUser?.fullName ||
              'E'
            )
              .charAt(0)
              .toUpperCase()}
            onLogout={handleLogout}
          />
        </header>

        <div className="dashboard-content employee-report-page">
          <article
            className="employee-report-dialog"
            role="region"
            aria-labelledby="employee-report-title"
          >
            <header className="employee-report-dialog-header">
              <div>
                <h2 id="employee-report-title">
                  Report a Network Incident
                </h2>

                <p>
                  Fill out the form below.
                  BatangAI may provide
                  optional AI-assisted
                  analysis and basic
                  self-help guidance.
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                aria-label="Close report form"
                onClick={closeReport}
              >
                ×
              </button>
            </header>

            <div className="employee-report-dialog-body">
              {phase === 'form' ? (
                <form
                  className="incident-form"
                  onSubmit={analyze}
                >
                  <IncidentDetailsFields
                    values={values}
                    onChange={(
                      field,
                      value,
                    ) =>
                      setValues(v => ({
                        ...v,
                        [field]: value,
                      }))
                    }
                  />

                  <IncidentDescriptionFields
                    values={values}
                    onChange={(
                      field,
                      value,
                    ) =>
                      setValues(v => ({
                        ...v,
                        [field]: value,
                      }))
                    }
                  />

                  <footer className="employee-report-footer">
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={closeReport}
                    >
                      Cancel
                    </button>

                    <button
                      className="incident-new"
                      type="submit"
                      disabled={analyzing}
                    >
                      <Icon name="sparkle" />

                      {analyzing
                        ? 'Analyzing with BatangAI…'
                        : 'Analyze with BatangAI'}
                    </button>
                  </footer>

                  {analysisError && (
                    <div
                      className="employee-report-error"
                      role="alert"
                    >
                      <p>
                        {analysisError}
                      </p>

                      {aiWasUnavailable && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={
                            continueWithoutAI
                          }
                        >
                          Continue Without AI
                        </button>
                      )}
                    </div>
                  )}

                  {submitted && (
                    <p className="employee-report-success">
                      <Icon name="check" />

                      Your incident report
                      has been submitted.
                    </p>
                  )}
                </form>
              ) : (
                <section
                  className="employee-ai-result"
                  aria-live="polite"
                >
                  {aiAnalysis && (
                    <IncidentAnalysisResult
                      analysis={
                        aiAnalysis
                      }
                      reviewNote={
                        aiWasUnavailable
                          ? 'AI assistance was unavailable. The incident can still be submitted for manual IT Support review.'
                          : 'Review the AI-generated assistance before submitting your incident. AI suggestions are advisory and do not determine the final resolution.'
                      }
                    />
                  )}

                  <section className="employee-resolution-check">
                    <h3>
                      Did the basic self-help resolve the issue?
                    </h3>

                    <p>
                      Select the result of your
                      basic self-help attempt.
                      IT Support remains responsible
                      for technical review and final
                      incident handling.
                    </p>

                    <div className="employee-resolution-options">
                      <button
                        type="button"
                        className={`employee-resolution-option resolved${
                          resolutionStatus ===
                          'resolved'
                            ? ' selected'
                            : ''
                        }`}
                        onClick={() =>
                          setResolutionStatus(
                            'resolved',
                          )
                        }
                      >
                        <b>✓</b>

                        <strong>
                          Yes, Resolved!
                        </strong>

                        <span>
                          Basic self-help resolved
                          the issue
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`employee-resolution-option unresolved${
                          resolutionStatus ===
                          'unresolved'
                            ? ' selected'
                            : ''
                        }`}
                        onClick={() =>
                          setResolutionStatus(
                            'unresolved',
                          )
                        }
                      >
                        <b>×</b>

                        <strong>
                          Not Resolved
                        </strong>

                        <span>
                          Submit for IT Support
                          review
                        </span>
                      </button>
                    </div>
                  </section>

                  {submitError && (
                    <p
                      className="employee-report-error"
                      role="alert"
                    >
                      {submitError}
                    </p>
                  )}

                  <div className="employee-ai-actions">
                    <button
                      className="employee-ai-back"
                      type="button"
                      onClick={() => {
                        setAiAnalysis(
                          null,
                        )

                        setAnalysisError(
                          '',
                        )

                        setAiWasUnavailable(
                          false,
                        )

                        setPhase('form')
                      }}
                    >
                      Edit Report
                    </button>

                    <button
                      className="incident-new"
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                    >
                      <Icon name="check" />

                      {submitting
                        ? 'Submitting…'
                        : 'Submit Incident'}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}

export default ReportIncident