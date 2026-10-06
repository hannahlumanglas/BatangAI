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
  const parsed = new Date(value.trim().replace(' ', 'T'))
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

export function IncidentDetailModal({ incident, onClose, footer, showSelfHelpChecklist = false, showTechnicianChecklist = false, checkedTechnicianSteps = [], onTechnicianStepChange }: Props) {
  const duration = displayDuration(incident.durationMinutes)
  const troubleshooting = displayTroubleshooting(incident.troubleshooting)
  const checkedMatch = troubleshooting.match(/\[Employee checked self-help steps: ([^\]]*)\]/i)
  // ReportIncident stores the checked steps as zero-based array indexes.
  // Keep that representation here so, for example, "0,1" restores steps 1 and 2.
  const savedCheckedSteps = new Set((checkedMatch?.[1] || '').split(',').map(value => Number(value.trim())).filter(index => Number.isInteger(index) && index >= 0))
  const selfHelpSteps = parseSelfHelpSteps(troubleshooting)
  const technicianSteps = parseTechnicianSteps(troubleshooting)
  const savedTechnicianMatch = troubleshooting.match(/\[IT checked troubleshooting steps: ([^\]]*)\]/i)
  const savedTechnicianSteps = new Set((savedTechnicianMatch?.[1] || '').split(',').map(value => Number(value.trim())).filter(index => Number.isInteger(index) && index >= 0))
  const keywords = (incident.keywords || []).filter(keyword => typeof keyword === 'string')
  const keywordExtraction = [
    ['Reporter', incident.employeeName],
    ['Department', incident.department],
    ['Location / Room', incident.location],
    ['Issue Category', incident.issueCategory],
    ['Device Type', incident.deviceType],
    ['Connection Type', incident.connectionType],
    ['Severity', incident.severity],
    ['Status', incident.status],
  ]
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
    .map(([label, value]) => `${label}: ${value}`)
  if (keywords.length) {
    keywordExtraction.push(`Extracted terms: ${keywords.join(', ')}`)
  }
  // A confirmed employee resolution means every suggested self-help step was
  // completed, including reports created before check data was saved.
  const resolvedByReporter = Boolean(incident.resolvedBy && incident.employeeName && incident.resolvedBy.trim() === incident.employeeName.trim())

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
                    {selfHelpSteps.map((step, index) => <li key={`${index}-${step}`} className={resolvedByReporter || savedCheckedSteps.has(index) ? 'is-checked' : ''}>
                      <label><input type="checkbox" checked={resolvedByReporter || savedCheckedSteps.has(index)} readOnly /><span>{step}</span></label>
                    </li>)}
                  </ul> : <p>No basic self-help guidance was recorded.</p>}
                </div>
              ) : incident.troubleshooting && <AnalysisBlock label="Troubleshooting" value={troubleshooting} />}
              {showTechnicianChecklist && <div className="incident-ai-block">
                <span>Technician Troubleshooting Steps</span>
                {technicianSteps.length ? <ul className="incident-self-help-checklist">
                  {technicianSteps.map((step, index) => {
                    const checked = checkedTechnicianSteps.includes(index) || savedTechnicianSteps.has(index)
                    return <li key={`tech-${index}-${step}`} className={checked ? 'is-checked' : ''}>
                      <label><input type="checkbox" checked={checked} disabled={!onTechnicianStepChange || savedTechnicianSteps.has(index)} onChange={event => onTechnicianStepChange?.(index, event.target.checked)} /><span>{step}</span></label>
                    </li>
                  })}
                </ul> : <p>No technician troubleshooting steps were generated.</p>}
                {technicianSteps.length > 0 && <p>{Math.max(checkedTechnicianSteps.length, savedTechnicianSteps.size)} of {technicianSteps.length} steps completed</p>}
              </div>}
            </section>
          )}

          {(incident.resolutionNotes || incident.resolvedBy || incident.resolvedAt || duration) && (
            <section className="incident-resolution-panel">
              <h3>Resolution Information</h3>
              <div className="incident-resolution-grid">
                {incident.resolutionNotes && <ResolutionField label="Resolution Notes" value={incident.resolutionNotes} />}
                {incident.resolvedBy && <ResolutionField label="Resolved By" value={incident.resolvedBy} detail={incident.resolvedBy === incident.employeeName ? 'Reporter' : 'IT Personnel'} />}
                {incident.resolvedAt && <ResolutionField label="Resolution Date/Time" value={incident.resolvedAt} />}
                {duration && <ResolutionField label="Troubleshooting Duration" value={duration} />}
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

