import './IncidentDetailModal.css'
import type { ReactNode } from 'react'

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
}

function statusClass(status?: string | null) {
  const value = status?.trim().toLowerCase()
  if (value === 'resolved' || value === 'closed') return 'resolved-tag'
  if (value === 'in progress' || value === 'ongoing') return 'progress-tag'
  return 'pending-tag'
}

function severityClass(severity?: string | null) {
  const value = severity?.trim().toLowerCase()
  return value === 'high' || value === 'medium' ? `${value}-tag` : 'low-tag'
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

export function IncidentDetailModal({ incident, onClose, footer }: Props) {
  const status = incident.status || 'Pending'
  const severity = incident.severity || 'Low'
  const duration = displayDuration(incident.durationMinutes)

  return (
    <div className="modal-overlay incident-detail-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="incident-detail-modal" role="dialog" aria-modal="true" aria-labelledby="incident-detail-title">
        <header className="incident-detail-header">
          <div>
            <h2 id="incident-detail-title">{incident.incidentID}</h2>
            <p>Reported {incident.createdAt || '-'}</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>x</button>
        </header>

        <div className="incident-detail-body">
          <h3 className="incident-detail-group-title">Incident Information</h3>
          <div className="incident-detail-grid">
            <DetailField label="Reporter" value={incident.employeeName || 'Not specified'} />
            <DetailField label="Department" value={incident.department || 'Not specified'} />
            <DetailField label="Location / Room" value={incident.location || 'Not specified'} />
            <DetailField label="Issue Category" value={incident.issueCategory || 'Not specified'} />
            <DetailField label="Device Type" value={incident.deviceType || 'Not specified'} />
            <DetailField label="Connection Type" value={incident.connectionType || 'Not specified'} />
            <DetailField label="Severity" value={<span className={`tag ${severityClass(severity)}`}>{severity}</span>} />
            <DetailField label="Status" value={<span className={`tag ${statusClass(status)}`}>{status}</span>} />
            <DetailField label="Assigned" value={incident.assigned || 'No'} />
            <DetailField label="Assigned To" value={incident.assignedToName || incident.assignedTo || 'Not assigned'} />
          </div>

          <section className="incident-detail-section incident-detail-section--service"><h3>Affected Issue / Service</h3><p>{incident.affectedIssue || 'Not specified'}</p></section>
          <section className="incident-detail-section incident-detail-section--description"><h3>Detailed Problem Description</h3><p>{incident.description || 'No problem description provided.'}</p></section>

          {(incident.classification || incident.summary || incident.troubleshooting) && (
            <section className="incident-ai-analysis">
              <h3 className="incident-ai-analysis-title">BatangAI Analysis</h3>
              {incident.classification && <AnalysisBlock label="Classification" value={incident.classification} />}
              {incident.summary && <AnalysisBlock label="Incident Summary" value={incident.summary} />}
              {incident.troubleshooting && <AnalysisBlock label="Troubleshooting" value={displayTroubleshooting(incident.troubleshooting)} />}
            </section>
          )}

          {(incident.resolutionNotes || incident.resolvedBy || incident.resolvedAt || duration) && (
            <section className="incident-resolution-panel">
              <h3>Resolution Information</h3>
              <div className="incident-resolution-grid">
                {incident.resolutionNotes && <ResolutionField label="Resolution Notes" value={incident.resolutionNotes} />}
                {incident.resolvedBy && <ResolutionField label="Resolved By" value={incident.resolvedBy} detail="IT Personnel" />}
                {incident.resolvedAt && <ResolutionField label="Resolution Date/Time" value={incident.resolvedAt} />}
                {duration && <ResolutionField label="Troubleshooting Duration" value={duration} />}
              </div>
            </section>
          )}
        </div>

        <footer className="incident-detail-footer">
          <button className="btn-secondary" type="button" onClick={onClose}>Close</button>
          {footer}
        </footer>
      </section>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return <div className="incident-detail-field"><span>{label}</span><strong>{value}</strong></div>
}

function AnalysisBlock({ label, value }: { label: string; value: string }) {
  return <div className="incident-ai-block"><span>{label}</span><p style={{ whiteSpace: 'pre-line' }}>{value}</p></div>
}

function ResolutionField({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="incident-resolution-field"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
}
