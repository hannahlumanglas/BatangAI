import './IncidentDetailModal.css'
import type { ReactNode } from 'react'
import { parseSelfHelpSteps, parseTechnicianSteps } from '../utils/selfHelp'

export type IncidentDetail = {
  incidentID: string
  affectedIssue?: string | null
  classification?: string | null
  connectionType?: string | null
  createdAt?: string | null
  department?: string | null
  description?: string | null
  deviceType?: string | null
  employeeName?: string | null
  issueCategory?: string | null
  keywords?: string[] | null
  location?: string | null
  resolutionNotes?: string | null
  resolvedAt?: string | null
  resolvedBy?: string | null
  durationMinutes?: number | string | null
  severity?: string | null
  status?: string | null
  summary?: string | null
  troubleshooting?: string | string[] | null
  assigned?: string | null
  assignedTo?: string | number | null
  assignedToName?: string | null
}

type Props = {
  incident: IncidentDetail
  onClose: () => void
  footer?: ReactNode
  showSelfHelpChecklist?: boolean
  showTechnicianChecklist?: boolean
  checkedTechnicianSteps?: number[]
  onTechnicianStepChange?: (index: number, checked: boolean) => void
  resolutionNotesDraft?: string
  onResolutionNotesDraftChange?: (value: string) => void
}

function displayTroubleshooting(value: IncidentDetail['troubleshooting']) {
  if (Array.isArray(value)) return value.join('\n')
  return value || ''
}

function displayDuration(value: IncidentDetail['durationMinutes']) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return typeof value === 'number'
    ? `${value} minutes`
    : value
}

function formatIncidentDateTime(value: string | null | undefined) {
  if (!value) return 'Not recorded'
  const normalized = value.trim().replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  const localDateTime = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/)
  const parsed = !hasTimezone && localDateTime
    ? new Date(
        Number(localDateTime[1]),
        Number(localDateTime[2]) - 1,
        Number(localDateTime[3]),
        Number(localDateTime[4]),
        Number(localDateTime[5]),
        Number(localDateTime[6] || 0),
        Number((localDateTime[7] || '0').padEnd(3, '0')),
      )
    : new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return 'Not recorded'
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed)
}

export function IncidentDetailModal({ incident, onClose, footer, showSelfHelpChecklist = false, showTechnicianChecklist = false, checkedTechnicianSteps = [], onTechnicianStepChange, resolutionNotesDraft, onResolutionNotesDraftChange }: Props) {
  const duration = displayDuration(incident.durationMinutes)
  const troubleshooting = displayTroubleshooting(incident.troubleshooting)
  const checkedMatch = troubleshooting.match(/\[Employee checked self-help steps: ([^\]]*)\]/i)
  // ReportIncident stores the checked steps as zero-based array indexes.
  // Keep that representation here so, for example, "0,1" restores steps 1 and 2.
  const savedCheckedSteps = new Set((checkedMatch?.[1] || '').split(',').map(value => value.trim()).filter(value => value !== '').map(Number).filter(index => Number.isInteger(index) && index >= 0))
  const selfHelpSteps = parseSelfHelpSteps(troubleshooting)
  const showEmployeeCheckMarks = (incident.status || '').trim().toLowerCase() !== 'pending'
  const technicianSteps = parseTechnicianSteps(troubleshooting)
  const savedTechnicianMatch = troubleshooting.match(/\[IT manually checked troubleshooting steps: ([^\]]*)\]/i)
  const savedTechnicianSteps = new Set((savedTechnicianMatch?.[1] || '').split(',').map(value => value.trim()).filter(value => value !== '').map(Number).filter(index => Number.isInteger(index) && index >= 0))
  const technicianWorkStarted = ['in progress', 'resolved', 'closed'].includes((incident.status || '').trim().toLowerCase())

  const keywordExtraction = [
    ['Reporter', incident.employeeName],
    ['Office', incident.department],
    ['Location / Room', incident.location],
    ['Issue Category', incident.issueCategory],
    ['Device Type', incident.deviceType],
    ['Connection Type', incident.connectionType],
    ['Severity', incident.severity],
    ['Status', incident.status],
  ]
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
    .map(([label, value]) => `${label}: ${value}`)
  return (
    <div className="modal-overlay incident-detail-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="incident-detail-modal" role="dialog" aria-modal="true" aria-labelledby="incident-detail-title">
        <header className="incident-detail-header">
          <div>
            <h2 id="incident-detail-title">{incident.incidentID}</h2>
            <p>Reported {formatIncidentDateTime(incident.createdAt)}</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close incident details">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="incident-detail-body">
          {(incident.classification || incident.keywords?.length || incident.summary || incident.troubleshooting || showSelfHelpChecklist || showTechnicianChecklist) && (
            <section className="incident-ai-analysis">
              <h3 className="incident-ai-analysis-title">BatangAI Analysis</h3>
              <div className="incident-ai-summary-grid">
                <AnalysisBlock label="Classification" value={incident.classification || ''} />
                <div className="incident-ai-block incident-keyword-block">
                  <span>Keyword Extraction</span>
                  <dl className="incident-keyword-list">
                    {keywordExtraction.map(item => {
                      const separator = item.indexOf(': ')
                      return <div key={item}><dt>{item.slice(0, separator)}</dt><dd>{item.slice(separator + 2)}</dd></div>
                    })}
                  </dl>
                </div>
                <AnalysisBlock label="Summarization" value={incident.summary || ''} />
              </div>
              {showSelfHelpChecklist ? (
                <div className="incident-ai-block">
                  <span>Basic Self-Help</span>
                  {selfHelpSteps.length ? <ul className="incident-self-help-checklist">
                    {selfHelpSteps.map((step, index) => {
                      const checked = showEmployeeCheckMarks && savedCheckedSteps.has(index)
                      return <li key={`${index}-${step}`} className={checked ? 'is-checked' : ''}>
                        <label><input type="checkbox" checked={checked} readOnly /><span>{step}</span></label>
                      </li>
                    })}
                  </ul> : <p>No basic self-help guidance was recorded.</p>}
                </div>
              ) : incident.troubleshooting && <AnalysisBlock label="Troubleshooting" value={troubleshooting} />}
              {showTechnicianChecklist && <div className="incident-ai-block">
                <span>Technician Troubleshooting Steps</span>
                {technicianSteps.length ? <ul className="incident-self-help-checklist">
                  {technicianSteps.map((step, index) => {
                    const checked = technicianWorkStarted && (checkedTechnicianSteps.includes(index) || savedTechnicianSteps.has(index))
                    return <li key={`tech-${index}-${step}`} className={checked ? 'is-checked' : ''}>
                      <label><input type="checkbox" checked={checked} disabled={!technicianWorkStarted || !onTechnicianStepChange} onChange={event => onTechnicianStepChange?.(index, event.target.checked)} /><span>{step}</span></label>
                    </li>
                  })}
                </ul> : <p>No technician troubleshooting steps were generated.</p>}
              </div>}
          {onResolutionNotesDraftChange && <div className="incident-ai-block incident-resolution-notes-editor">
            <label htmlFor="incident-resolution-notes">Resolution Notes</label>
            <textarea
              id="incident-resolution-notes"
              value={resolutionNotesDraft || ''}
              onChange={event => onResolutionNotesDraftChange(event.target.value)}
              placeholder="Describe the troubleshooting performed and how the issue was resolved."
              rows={4}
            />
          </div>}
          {!onResolutionNotesDraftChange && incident.resolutionNotes && <div className="incident-ai-block incident-resolution-notes-editor">
            <label htmlFor="incident-resolution-notes-readonly">Resolution Notes</label>
            <textarea
              id="incident-resolution-notes-readonly"
              value={incident.resolutionNotes}
              rows={4}
              readOnly
            />
          </div>}
            </section>
          )}

          {(incident.resolvedBy || incident.resolvedAt || duration) && (
            <section className="incident-resolution-panel">
              <div className="incident-resolution-grid">
                {incident.resolvedBy && <ResolutionField label="Resolved By" value={incident.resolvedBy} detail={incident.resolvedBy === incident.employeeName ? 'Reporter' : 'Technician'} />}
                {incident.resolvedAt && <ResolutionField label="Resolution Date/Time" value={formatIncidentDateTime(incident.resolvedAt)} />}
                {duration && <ResolutionField label="Duration Time" value={duration} />}
              </div>
            </section>
          )}
          {incident.resolvedBy && incident.resolvedBy === incident.employeeName && (
            <section className="incident-resolution-panel"><h3>Resolution Result</h3><p>Resolved by the reporting employee using basic self-help.</p></section>
          )}
        </div>

        {footer && <footer className="incident-detail-footer">{footer}</footer>}
      </section>
    </div>
  )
}

function AnalysisBlock({ label, value }: { label: string; value: string }) {
  return <div className="incident-ai-block"><span>{label}</span><p style={{ whiteSpace: 'pre-line' }}>{value}</p></div>
}

function ResolutionField({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="incident-resolution-field"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
}
