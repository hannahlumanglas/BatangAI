import { useState, useEffect, useRef } from 'react'
import type { FormEvent, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { AdminNotifications } from '../Admin/AdminNotifications'
import { ProfileMenu } from './Profile'
import {
  getAuthSession,
  getCurrentUserId,
  getCurrentUserDepartment,
  signOut,
} from '../../auth'
import '../Admin/Dashboard.css'
import './ReportIncident.css'
import { API_BASE_URL } from '../../apiConfig'
import { parseSelfHelpSteps } from '../../utils/selfHelp'

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
        <path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />
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
  'Server / System Downtime',
  'Security / Access Issue',
]

export const DEVICE_TYPES = [
  'Access Point',
  'Biometrics Scanner',
  'Desktop Computer',
  'Laptop',
  'Printer',
  'Router',
  'Server',
  'Switch',
  'Tablet',
]

export const CONNECTION_TYPES = ['LAN', 'Wi-Fi']

export type IncidentFormValues = {
  severity: string
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
 */
export type IncidentAnalysis = {
  classification: string
  keywords: string[]
  summary: string
  possibleInterpretation: string
  basicSelfHelp: string
  itTroubleshooting: string
}

type IncidentReportDraft = {
  version: 1
  values: IncidentFormValues
  phase: 'form' | 'result'
  aiAnalysis: IncidentAnalysis | null
  issueResolved: 'yes' | 'no' | ''
  checkedSelfHelpSteps: number[]
}

function isIncidentAnalysis(value: unknown): value is IncidentAnalysis {
  if (!value || typeof value !== 'object') return false
  const analysis = value as Partial<IncidentAnalysis>
  return (
    typeof analysis.classification === 'string' &&
    Array.isArray(analysis.keywords) &&
    analysis.keywords.every(keyword => typeof keyword === 'string') &&
    typeof analysis.summary === 'string' &&
    typeof analysis.possibleInterpretation === 'string' &&
    typeof analysis.basicSelfHelp === 'string' &&
    typeof analysis.itTroubleshooting === 'string'
  )
}

function readIncidentReportDraft(key: string): IncidentReportDraft | null {
  try {
    const serializedDraft = localStorage.getItem(key)
    if (!serializedDraft) return null

    const draft: unknown = JSON.parse(serializedDraft)
    if (!draft || typeof draft !== 'object') return null

    const candidate = draft as Partial<IncidentReportDraft>
    const values = candidate.values
    if (
      candidate.version !== 1 ||
      !values ||
      typeof values !== 'object' ||
      ![
        'severity',
        'department',
        'location',
        'issueCategory',
        'deviceType',
        'connectionType',
        'affectedService',
        'description',
      ].every(field => typeof values[field as keyof IncidentFormValues] === 'string') ||
      (candidate.phase !== 'form' && candidate.phase !== 'result') ||
      (candidate.aiAnalysis !== null && !isIncidentAnalysis(candidate.aiAnalysis)) ||
      (candidate.phase === 'result' && !isIncidentAnalysis(candidate.aiAnalysis)) ||
      (candidate.issueResolved !== '' &&
        candidate.issueResolved !== 'yes' &&
        candidate.issueResolved !== 'no') ||
      !Array.isArray(candidate.checkedSelfHelpSteps) ||
      !candidate.checkedSelfHelpSteps.every(
        step => Number.isInteger(step) && step >= 0,
      )
    ) {
      return null
    }

    return candidate as IncidentReportDraft
  } catch (error) {
    console.error('Unable to restore the incident report draft:', error)
    return null
  }
}

/*
 * Calls the PHP Gemini API.
 *
 * Gemini is the only source of the incident analysis
 * and troubleshooting suggestions.
 */
export async function analyzeIncidentWithAI(
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
        'AI assistance is currently unavailable. Please try again.',
    )
  }

  return {
    classification: typeof data.analysis.classification === 'string'
      ? data.analysis.classification.trim()
      : '',
    keywords: Array.isArray(data.analysis.keywords)
      ? data.analysis.keywords.filter((keyword: unknown) => typeof keyword === 'string')
      : [],
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
 */
function formatTroubleshootingForStorage(
  analysis: IncidentAnalysis,
  checkedSteps: number[],
): string {
  const completionRecord = `[Employee checked self-help steps: ${checkedSteps.join(',')}]`
  return [
    'Basic Self-Help:',
    analysis.basicSelfHelp,
    '',
    'IT Troubleshooting Suggestions:',
    analysis.itTroubleshooting,
    completionRecord,
  ].join('\n')
}

export function IncidentDetailsFields({
  values,
  onChange,
  departmentEditable = false,
  showSeverity = false,
}: {
  values: IncidentFormValues
  onChange: (
    field: keyof IncidentFormValues,
    value: string,
  ) => void
  departmentEditable?: boolean
  showSeverity?: boolean
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

        {showSeverity && (
          <label className="incident-field">
            <span className="incident-field-label">
              Severity <em>*</em>
            </span>
            <select
              required
              value={values.severity}
              onChange={e => onChange('severity', e.target.value)}
            >
              <option value="">Select severity</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
        )}
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

function getInitialValues(): IncidentFormValues {
  return {
    severity: '',
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
  const draftStorageKey = `batangai-incident-report-draft-${getCurrentUserId()}`
  const [restoredDraft] = useState(() =>
    readIncidentReportDraft(draftStorageKey),
  )
  const discardDraftOnUnmount = useRef(false)

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

  const [draftSaveError, setDraftSaveError] =
    useState('')

  const [analysisError, setAnalysisError] =
    useState('')

  const [values, setValues] =
    useState<IncidentFormValues>(
      () => {
        const initialValues = getInitialValues()
        return {
          ...(restoredDraft?.values ?? initialValues),
          // A saved draft can contain an outdated or empty department. Always
          // show the department registered on the current user's account.
          department: initialValues.department,
        }
      },
    )

  const [phase, setPhase] =
    useState<'form' | 'result'>(() => restoredDraft?.phase ?? 'form')

  const [issueResolved, setIssueResolved] =
    useState<'yes' | 'no' | ''>(() => restoredDraft?.issueResolved ?? '')

  const [checkedSelfHelpSteps, setCheckedSelfHelpSteps] =
    useState<number[]>(() => restoredDraft?.checkedSelfHelpSteps ?? [])


  const [aiAnalysis, setAiAnalysis] =
    useState<IncidentAnalysis | null>(() => restoredDraft?.aiAnalysis ?? null)

  useEffect(() => {
    if (discardDraftOnUnmount.current) return

    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          version: 1,
          values,
          phase,
          aiAnalysis,
          issueResolved,
          checkedSelfHelpSteps,
        } satisfies IncidentReportDraft),
      )
      setDraftSaveError('')
    } catch (error) {
      console.error('Unable to save the incident report draft:', error)
      setDraftSaveError('Your incident report draft could not be saved in this browser.')
    }
  }, [
    aiAnalysis,
    checkedSelfHelpSteps,
    draftStorageKey,
    issueResolved,
    phase,
    values,
  ])

  const handleLogout = () => {
    signOut()
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
    setIssueResolved('')
    setCheckedSelfHelpSteps([])

    try {
      setAnalyzing(true)

      const analysis =
        await analyzeIncidentWithAI(values)

      try {
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            version: 1,
            values,
            phase: 'result',
            aiAnalysis: analysis,
            issueResolved: '',
            checkedSelfHelpSteps: [],
          } satisfies IncidentReportDraft),
        )
      } catch (storageError) {
        console.error('Unable to save the incident analysis draft:', storageError)
        setDraftSaveError('Your AI analysis could not be saved in this browser.')
      }

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
          : 'AI assistance is currently unavailable. Please try again.',
      )
    } finally {
      setAnalyzing(false)
    }
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


    if (!aiAnalysis) {
      setSubmitError(
        'Please continue with the incident submission.',
      )

      return
    }

    if (!issueResolved) {
      setSubmitError('Please choose whether the basic self-help resolved the issue.')
      return
    }

    const selfHelpSteps = parseSelfHelpSteps(aiAnalysis.basicSelfHelp)
    if (
      issueResolved === 'yes' &&
      selfHelpSteps.length > 0 &&
      checkedSelfHelpSteps.length < selfHelpSteps.length
    ) {
      setSubmitError('Please mark each self-help step you tried before confirming that the issue is resolved.')
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
            resolvedByUser: issueResolved === 'yes',

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

            /* AI classification is saved alongside the report. */
            classification:
              analysis.classification,

            keywords:
              analysis.keywords,

            summary:
              analysis.summary,

            /*
             * Both employee-safe self-help and IT-only
             * troubleshooting are generated by Gemini
             * and stored in the database.
             */
            troubleshooting:
              formatTroubleshootingForStorage(
                analysis,
                issueResolved === 'yes'
                  ? parseSelfHelpSteps(analysis.basicSelfHelp).map((_, index) => index)
                  : checkedSelfHelpSteps,
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

      discardDraftOnUnmount.current = true
      localStorage.removeItem(draftStorageKey)
      setSubmitted(true)

      setValues(
        getInitialValues(),
      )

      setPhase('form')


      setAiAnalysis(null)

      setAnalysisError('')

      navigate('/employee/incidents')
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
    discardDraftOnUnmount.current = true
    localStorage.removeItem(draftStorageKey)
    setValues(
      getInitialValues(),
    )

    setPhase('form')


    setAiAnalysis(null)

    setAnalysisError('')

    navigate('/employee/incidents')
  }

  const editReport = () => {
    setSubmitError('')
    setPhase('form')
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
              </div>
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
                  <section className="employee-self-help" aria-labelledby="employee-self-help-title">
                    <h3 id="employee-self-help-title">Basic Self Help</h3>
                    {parseSelfHelpSteps(aiAnalysis?.basicSelfHelp || '').length ? (
                      <ol className="employee-self-help-checklist">
                        {parseSelfHelpSteps(aiAnalysis?.basicSelfHelp || '').map((step, index) => (
                          <li key={index} className={checkedSelfHelpSteps.includes(index) ? 'is-checked' : ''}>
                            <label>
                              <input
                                type="checkbox"
                                checked={checkedSelfHelpSteps.includes(index)}
                                onChange={event => setCheckedSelfHelpSteps(current =>
                                  event.target.checked
                                    ? [...current, index]
                                    : current.filter(stepIndex => stepIndex !== index),
                                )}
                              />
                              <span>{step}</span>
                            </label>
                          </li>
                        ))}
                      </ol>
                    ) : <p>No troubleshooting steps were provided. You can still submit the report for IT assistance.</p>}
                    {parseSelfHelpSteps(aiAnalysis?.basicSelfHelp || '').length > 0 && (
                      <p className="employee-self-help-progress" aria-live="polite">
                        {checkedSelfHelpSteps.length} of {parseSelfHelpSteps(aiAnalysis?.basicSelfHelp || '').length} steps completed
                      </p>
                    )}
                  </section>

                  <section className="employee-resolution-choice" aria-labelledby="employee-resolution-title">
                    <h3 id="employee-resolution-title">Were you able to resolve the issue?</h3>
                    <p>Try the steps above, mark the steps you completed, then choose the result before submitting.</p>
                    <div className="employee-resolution-options">
                      <label className={issueResolved === 'yes' ? 'is-selected' : ''}>
                        <input type="radio" name="issueResolved" value="yes" checked={issueResolved === 'yes'} onChange={() => setIssueResolved('yes')} />
                        <span className="employee-resolution-icon employee-resolution-icon--yes" aria-hidden="true">&#10003;</span>
                        <strong>Yes, Resolved!</strong>
                        <small>Save to All Incidents as resolved by you</small>
                      </label>
                      <label className={issueResolved === 'no' ? 'is-selected' : ''}>
                        <input type="radio" name="issueResolved" value="no" checked={issueResolved === 'no'} onChange={() => setIssueResolved('no')} />
                        <span className="employee-resolution-icon employee-resolution-icon--no" aria-hidden="true">&#215;</span>
                        <strong>Not Resolved</strong>
                        <small>Save as pending for admin or secretary assignment</small>
                      </label>
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
                      onClick={closeReport}
                    >
                      Close
                    </button>

                    <button
                      className="employee-ai-edit"
                      type="button"
                      onClick={editReport}
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
                        : issueResolved === 'yes'
                          ? 'Submit as Resolved'
                          : issueResolved === 'no'
                            ? 'Submit for IT Assignment'
                            : 'Submit Incident'}
                    </button>
                  </div>
                </section>
              )}

              {draftSaveError && (
                <p className="employee-report-error" role="alert">
                  {draftSaveError}
                </p>
              )}
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}

export default ReportIncident
