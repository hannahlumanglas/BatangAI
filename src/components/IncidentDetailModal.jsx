import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import './IncidentDetailModal.css';
import { parseSelfHelpSteps, parseTechnicianSteps } from '../utils/selfHelp';
import { analyzeIncidentWithAI } from '../utils/incidentAi';
import { API_BASE_URL } from '../apiConfig';
function displayTroubleshooting(value) {
    if (Array.isArray(value))
        return value.join('\n');
    return value || '';
}
function displayDuration(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return typeof value === 'number'
        ? `${value} minutes`
        : value;
}
function formatIncidentDateTime(value) {
    if (!value)
        return 'Not recorded';
    const normalized = value.trim().replace(' ', 'T');
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
    const localDateTime = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
    const parsed = !hasTimezone && localDateTime
        ? new Date(Number(localDateTime[1]), Number(localDateTime[2]) - 1, Number(localDateTime[3]), Number(localDateTime[4]), Number(localDateTime[5]), Number(localDateTime[6] || 0), Number((localDateTime[7] || '0').padEnd(3, '0')))
        : new Date(normalized);
    if (Number.isNaN(parsed.getTime()))
        return 'Not recorded';
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }).format(parsed);
}
export function IncidentDetailModal({ incident, onClose, footer, showSelfHelpChecklist = false, showTechnicianChecklist = false, checkedTechnicianSteps = [], onTechnicianStepChange, resolutionNotesDraft, onResolutionNotesDraftChange }) {
    const duration = displayDuration(incident.durationMinutes);
    const [generatedTroubleshooting, setGeneratedTroubleshooting] = useState('');
    const [generatingGuidance, setGeneratingGuidance] = useState(false);
    const [guidanceError, setGuidanceError] = useState('');
    const [generationAttempt, setGenerationAttempt] = useState(0);
    useEffect(() => {
        let cancelled = false;
        const existing = displayTroubleshooting(incident.troubleshooting);
        const needsBasic = showSelfHelpChecklist && parseSelfHelpSteps(existing).length === 0;
        const needsTechnical = showTechnicianChecklist && parseTechnicianSteps(existing).length === 0;
        if ((!needsBasic && !needsTechnical) || !incident.incidentID) return undefined;
        setGeneratingGuidance(true);
        setGuidanceError('');
        const report = {
            department: incident.department || '',
            location: incident.location || '',
            issueCategory: incident.issueCategory || '',
            deviceType: incident.deviceType || '',
            connectionType: incident.connectionType || '',
            affectedService: incident.affectedIssue || incident.issueCategory || '',
            description: incident.description || incident.summary || '',
        };
        analyzeIncidentWithAI(report).then(async analysis => {
            const response = await fetch(`${API_BASE_URL}/save_incident_troubleshooting.php`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    incidentID: incident.incidentID,
                    basicSelfHelp: analysis.basicSelfHelp,
                    itTroubleshooting: analysis.itTroubleshooting,
                }),
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Unable to save the generated troubleshooting steps.');
            }
            if (!cancelled) {
                setGeneratedTroubleshooting(`${payload.basicSelfHelp || analysis.basicSelfHelp}\n\nIT Troubleshooting Suggestions:\n${payload.itTroubleshooting || analysis.itTroubleshooting}`);
            }
        }).catch(error => {
            if (!cancelled) setGuidanceError(error instanceof Error ? error.message : 'AI troubleshooting generation failed.');
        }).finally(() => {
            if (!cancelled) setGeneratingGuidance(false);
        });
        return () => { cancelled = true; };
    }, [incident.incidentID, incident.troubleshooting, showSelfHelpChecklist, showTechnicianChecklist, generationAttempt]);
    const troubleshooting = displayTroubleshooting(generatedTroubleshooting || incident.troubleshooting);
    const checkedMatch = troubleshooting.match(/\[Employee checked self-help steps: ([^\]]*)\]/i);
    // ReportIncident stores the checked steps as zero-based array indexes.
    // Keep that representation here so, for example, "0,1" restores steps 1 and 2.
    const savedCheckedSteps = new Set((checkedMatch?.[1] || '').split(',').map(value => value.trim()).filter(value => value !== '').map(Number).filter(index => Number.isInteger(index) && index >= 0));
    const selfHelpSteps = parseSelfHelpSteps(troubleshooting);
    const showEmployeeCheckMarks = (incident.status || '').trim().toLowerCase() !== 'pending';
    const technicianSteps = parseTechnicianSteps(troubleshooting);
    const savedTechnicianMatch = troubleshooting.match(/\[IT manually checked troubleshooting steps: ([^\]]*)\]/i);
    const savedTechnicianSteps = new Set((savedTechnicianMatch?.[1] || '').split(',').map(value => value.trim()).filter(value => value !== '').map(Number).filter(index => Number.isInteger(index) && index >= 0));
    const technicianWorkStarted = ['in progress', 'resolved', 'closed'].includes((incident.status || '').trim().toLowerCase());
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
        .map(([label, value]) => `${label}: ${value}`);
    return (_jsx("div", { className: "modal-overlay incident-detail-overlay", onMouseDown: event => event.target === event.currentTarget && onClose(), children: _jsxs("section", { className: "incident-detail-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "incident-detail-title", children: [_jsxs("header", { className: "incident-detail-header", children: [_jsxs("div", { children: [_jsx("h2", { id: "incident-detail-title", children: incident.incidentID }), _jsxs("p", { children: ["Reported ", formatIncidentDateTime(incident.createdAt)] })] }), _jsx("button", { className: "modal-close", type: "button", onClick: onClose, "aria-label": "Close incident details", children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }), _jsxs("div", { className: "incident-detail-body", children: [(incident.classification || incident.keywords?.length || incident.summary || incident.troubleshooting || showSelfHelpChecklist || showTechnicianChecklist) && (_jsxs("section", { className: "incident-ai-analysis", children: [_jsx("h3", { className: "incident-ai-analysis-title", children: "BatangAI Analysis" }), _jsxs("div", { className: "incident-ai-summary-grid", children: [_jsx(AnalysisBlock, { label: "Classification", value: incident.classification || '' }), _jsxs("div", { className: "incident-ai-block incident-keyword-block", children: [_jsx("span", { children: "Keyword Extraction" }), _jsx("dl", { className: "incident-keyword-list", children: keywordExtraction.map(item => {
                                                        const separator = item.indexOf(': ');
                                                        return _jsxs("div", { children: [_jsx("dt", { children: item.slice(0, separator) }), _jsx("dd", { children: item.slice(separator + 2) })] }, item);
                                                    }) })] }), _jsx(AnalysisBlock, { label: "Summarization", value: incident.summary || '' })] }), showSelfHelpChecklist ? (_jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "Basic Self-Help" }), selfHelpSteps.length ? _jsx("ul", { className: "incident-self-help-checklist", children: selfHelpSteps.map((step, index) => {
                                                const checked = showEmployeeCheckMarks && savedCheckedSteps.has(index);
                                                return _jsx("li", { className: checked ? 'is-checked' : '', children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: checked, readOnly: true }), _jsx("span", { children: step })] }) }, `${index}-${step}`);
                                            }) }) : _jsx("div", { children: generatingGuidance ? _jsx("p", { role: "status", children: "Generating incident-specific steps with BatangAI…" }) : guidanceError ? _jsxs("div", { children: [_jsx("p", { role: "alert", children: guidanceError }), _jsx("button", { type: "button", className: "btn-secondary", onClick: () => setGenerationAttempt(value => value + 1), children: "Generate Again" })] }) : _jsx("p", { role: "status", children: "AI troubleshooting guidance is being prepared…" }) })] })) : incident.troubleshooting && _jsx(AnalysisBlock, { label: "Troubleshooting", value: troubleshooting }), showTechnicianChecklist && _jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: "Technician Troubleshooting Steps" }), technicianSteps.length ? _jsx("ul", { className: "incident-self-help-checklist", children: technicianSteps.map((step, index) => {
                                                const checked = technicianWorkStarted && (checkedTechnicianSteps.includes(index) || savedTechnicianSteps.has(index));
                                                return _jsx("li", { className: checked ? 'is-checked' : '', children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: checked, disabled: !technicianWorkStarted || !onTechnicianStepChange, onChange: event => onTechnicianStepChange?.(index, event.target.checked) }), _jsx("span", { children: step })] }) }, `tech-${index}-${step}`);
                                            }) }) : generatingGuidance ? _jsx("p", { role: "status", children: "Generating incident-specific steps with BatangAI…" }) : guidanceError ? _jsx("p", { role: "alert", children: guidanceError }) : _jsx("p", { role: "status", children: "AI troubleshooting guidance is being prepared…" })] }), onResolutionNotesDraftChange && _jsxs("div", { className: "incident-ai-block incident-resolution-notes-editor", children: [_jsx("label", { htmlFor: "incident-resolution-notes", children: "Resolution Notes" }), _jsx("textarea", { id: "incident-resolution-notes", value: resolutionNotesDraft || '', onChange: event => onResolutionNotesDraftChange(event.target.value), placeholder: "Describe the troubleshooting performed and how the issue was resolved.", rows: 4 })] }), !onResolutionNotesDraftChange && incident.resolutionNotes && _jsxs("div", { className: "incident-ai-block incident-resolution-notes-editor", children: [_jsx("label", { htmlFor: "incident-resolution-notes-readonly", children: "Resolution Notes" }), _jsx("textarea", { id: "incident-resolution-notes-readonly", value: incident.resolutionNotes, rows: 4, readOnly: true })] })] })), (incident.resolvedBy || incident.resolvedAt || duration) && (_jsx("section", { className: "incident-resolution-panel", children: _jsxs("div", { className: "incident-resolution-grid", children: [incident.resolvedBy && _jsx(ResolutionField, { label: "Resolved By", value: incident.resolvedBy, detail: incident.resolvedBy === incident.employeeName ? 'Reporter' : 'Technician' }), incident.resolvedAt && _jsx(ResolutionField, { label: "Resolution Date/Time", value: formatIncidentDateTime(incident.resolvedAt) }), duration && _jsx(ResolutionField, { label: "Duration Time", value: duration })] }) })), incident.resolvedBy && incident.resolvedBy === incident.employeeName && (_jsxs("section", { className: "incident-resolution-panel", children: [_jsx("h3", { children: "Resolution Result" }), _jsx("p", { children: "Resolved by the reporting employee using basic self-help." })] }))] }), footer && _jsx("footer", { className: "incident-detail-footer", children: footer })] }) }));
}
function AnalysisBlock({ label, value }) {
    return _jsxs("div", { className: "incident-ai-block", children: [_jsx("span", { children: label }), _jsx("p", { style: { whiteSpace: 'pre-line' }, children: value })] });
}
function ResolutionField({ label, value, detail }) {
    return _jsxs("div", { className: "incident-resolution-field", children: [_jsx("span", { children: label }), _jsx("strong", { children: value }), detail && _jsx("small", { children: detail })] });
}
