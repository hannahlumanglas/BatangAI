import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { AdminNotifications } from '../Admin/AdminNotifications';
import { ProfileMenu } from './Profile';
import { getAuthSession, getCurrentUserId, getCurrentUserDepartment, signOut, } from '../../auth';
import '../Admin/Dashboard.css';
import './ReportIncident.css';
import { API_BASE_URL } from '../../apiConfig';
import { deleteUserAppData, loadUserAppData, saveUserAppData } from '../../utils/userAppData';
import { useSystemOptions } from '../../hooks/useSystemOptions';
import { parseSelfHelpSteps } from '../../utils/selfHelp';
import { analyzeIncidentWithAI } from '../../utils/incidentAi';
import { useAppDialog } from '../../components/AppDialog';
function Icon({ name }) {
    const paths = {
        report: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M7 3h7l4 4v14H7z" }), _jsx("path", { d: "M14 3v5h5M10 12h5M10 16h5" })] })),
        incidents: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2" }), _jsx("path", { d: "M9 4.5h6M9 10h6M9 14h6M9 18h3" })] })),
        profile: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c.7-4.1 3.4-6.2 8-6.2s7.3 2.1 8 6.2" })] })),
        menu: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M4 12h16M4 18h16" }) })),
        logout: (_jsx(_Fragment, { children: _jsx("path", { d: "M10 5H5v14h5M14 8l4 4-4 4M8 12h10" }) })),
        check: (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "m8 12 2.7 2.7L16.5 9" })] })),
        sparkle: (_jsxs(_Fragment, { children: [_jsx("path", { d: "M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" }), _jsx("path", { d: "m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" })] })),
    };
    return (_jsx("svg", { className: "admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] }));
}
const navigation = [
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
];
function isIncidentAnalysis(value) {
    if (!value || typeof value !== 'object')
        return false;
    const analysis = value;
    return (typeof analysis.classification === 'string' &&
        Array.isArray(analysis.keywords) &&
        analysis.keywords.every(keyword => typeof keyword === 'string') &&
        typeof analysis.summary === 'string' &&
        typeof analysis.possibleInterpretation === 'string' &&
        typeof analysis.basicSelfHelp === 'string' &&
        typeof analysis.itTroubleshooting === 'string');
}
function readIncidentReportDraft(key) {
    try {
        const serializedDraft = localStorage.getItem(key);
        if (!serializedDraft)
            return null;
        return readIncidentReportDraftFromValue(JSON.parse(serializedDraft));
    }
    catch (error) {
        console.error('Unable to restore the incident report draft:', error);
        return null;
    }
}
function readIncidentReportDraftFromValue(draft) {
    if (!draft || typeof draft !== 'object')
        return null;
    const candidate = draft;
    const values = candidate.values;
    if (candidate.version !== 1 ||
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
        ].every(field => typeof values[field] === 'string') ||
        (candidate.phase !== 'form' && candidate.phase !== 'result') ||
        (candidate.aiAnalysis !== null && !isIncidentAnalysis(candidate.aiAnalysis)) ||
        (candidate.phase === 'result' && !isIncidentAnalysis(candidate.aiAnalysis)) ||
        (candidate.issueResolved !== '' &&
            candidate.issueResolved !== 'yes' &&
            candidate.issueResolved !== 'no') ||
        !Array.isArray(candidate.checkedSelfHelpSteps) ||
        !candidate.checkedSelfHelpSteps.every(step => Number.isInteger(step) && step >= 0)) {
        return null;
    }
    return candidate;
}
/*
 * Combines the AI troubleshooting sections for storage
 * in the existing incidents.troubleshooting field.
 */
function formatTroubleshootingForStorage(analysis, checkedSteps) {
    const completionRecord = `[Employee checked self-help steps: ${checkedSteps.join(',')}]`;
    return [
        'Basic Self-Help:',
        analysis.basicSelfHelp,
        '',
        'IT Troubleshooting Suggestions:',
        analysis.itTroubleshooting,
        completionRecord,
    ].join('\n');
}
export function IncidentDetailsFields({ values, onChange, departmentEditable = false, showSeverity = false, severityReadOnly = false, }) {
    const { options, loading } = useSystemOptions();
    return (_jsxs("fieldset", { className: "incident-form-section", children: [_jsx("legend", { className: "sr-only", children: "Incident Details" }), _jsxs("div", { className: "incident-form-section-header", children: [_jsx("span", { className: "incident-form-badge", children: "1" }), _jsx("h3", { children: "Incident Details" })] }), _jsxs("div", { className: "incident-form-grid", children: [_jsxs("label", { className: "incident-field", children: [_jsx("span", { className: "incident-field-label", children: "Office" }), _jsx("input", { value: values.department, readOnly: !departmentEditable, disabled: !departmentEditable, title: departmentEditable
                                    ? 'Office'
                                    : 'Automatically filled from your registered account', onChange: e => onChange('department', e.target.value) })] }), _jsxs("label", { className: "incident-field", children: [_jsxs("span", { className: "incident-field-label", children: ["Location / Room ", _jsx("em", { children: "*" })] }), _jsx("input", { required: true, placeholder: "e.g. 2nd Floor, IT Room", value: values.location, onChange: e => onChange('location', e.target.value) })] }), _jsxs("label", { className: "incident-field", children: [_jsxs("span", { className: "incident-field-label", children: ["Issue Category ", _jsx("em", { children: "*" })] }), _jsxs("select", { required: true, disabled: loading, value: values.issueCategory, onChange: e => onChange('issueCategory', e.target.value), children: [_jsx("option", { value: "", children: "Select a category" }), (options.issue_category ?? []).map(item => (_jsx("option", { children: item }, item)))] })] }), _jsxs("label", { className: "incident-field", children: [_jsxs("span", { className: "incident-field-label", children: ["Device Type ", _jsx("em", { children: "*" })] }), _jsxs("select", { required: true, disabled: loading, value: values.deviceType, onChange: e => onChange('deviceType', e.target.value), children: [_jsx("option", { value: "", children: "Select a device type" }), (options.device_type ?? []).filter(item => item !== 'Tablet').map(item => (_jsx("option", { children: item }, item)))] })] }), _jsxs("label", { className: "incident-field", children: [_jsxs("span", { className: "incident-field-label", children: ["Connection Type ", _jsx("em", { children: "*" })] }), _jsxs("select", { required: true, disabled: loading, value: values.connectionType, onChange: e => onChange('connectionType', e.target.value), children: [_jsx("option", { value: "", children: "Select a connection type" }), (options.connection_type ?? []).map(item => (_jsx("option", { children: item }, item)))] })] }), showSeverity && (_jsxs("label", { className: "incident-field", children: [_jsxs("span", { className: "incident-field-label", children: ["Severity ", !severityReadOnly && _jsx("em", { children: "*" })] }), _jsxs("select", { required: !severityReadOnly, disabled: loading || severityReadOnly, title: severityReadOnly ? 'Severity can only be changed by an Administrator or Secretary' : undefined, value: values.severity, onChange: e => onChange('severity', e.target.value), children: [_jsx("option", { value: "", children: "Select severity" }), (options.severity ?? []).map(item => _jsx("option", { value: item, children: item }, item))] })] }))] })] }));
}
export function IncidentDescriptionFields({ values, onChange, }) {
    return (_jsxs("fieldset", { className: "incident-form-section", children: [_jsx("legend", { className: "sr-only", children: "Problem Description" }), _jsxs("div", { className: "incident-form-section-header", children: [_jsx("span", { className: "incident-form-badge", children: "2" }), _jsx("h3", { children: "Problem Description" })] }), _jsxs("div", { className: "incident-form-grid incident-form-grid--single incident-description-grid", children: [_jsxs("label", { className: "incident-field", children: [_jsxs("span", { className: "incident-field-label", children: ["Affected Issue / Service ", _jsx("em", { children: "*" })] }), _jsx("input", { required: true, placeholder: "e.g. Records System login", value: values.affectedService, onChange: e => onChange('affectedService', e.target.value) })] }), _jsxs("label", { className: "incident-field", children: [_jsxs("span", { className: "incident-field-label", children: ["Detailed Problem Description ", _jsx("em", { children: "*" })] }), _jsx("textarea", { required: true, rows: 4, placeholder: "Describe what happened, when it started, and any error messages you saw.", value: values.description, onChange: e => onChange('description', e.target.value) })] })] })] }));
}
function getInitialValues() {
    return {
        severity: '',
        department: getCurrentUserDepartment(),
        location: '',
        issueCategory: '',
        deviceType: '',
        connectionType: '',
        affectedService: '',
        description: '',
    };
}
const THEME_STORAGE_KEY = 'batangai-theme';
function readStoredTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return 'light';
}
function useTheme() {
    const [theme, setTheme] = useState(readStoredTheme);
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);
    const toggleTheme = () => setTheme(current => current === 'dark' ? 'light' : 'dark');
    return {
        theme,
        toggleTheme,
    };
}
function ThemeToggle({ theme, onToggle, }) {
    const isDark = theme === 'dark';
    return (_jsx("button", { type: "button", className: "theme-toggle-button", onClick: onToggle, "aria-label": isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode', "aria-pressed": isDark, title: isDark
            ? 'Switch to light mode'
            : 'Switch to dark mode', children: isDark ? (_jsxs("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "4.2" }), _jsx("path", { d: "M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" })] })) : (_jsx("svg", { viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" }) })) }));
}
function ReportIncident() {
    const navigate = useNavigate();
    const { showAlert } = useAppDialog();
    const draftStorageKey = `batangai-incident-report-draft-${getCurrentUserId()}`;
    const [restoredDraft] = useState(() => readIncidentReportDraft(draftStorageKey));
    const [databaseDraftLoaded, setDatabaseDraftLoaded] = useState(false);
    const discardDraftOnUnmount = useRef(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const analysisRequestActive = useRef(false);
    const [submitError, setSubmitError] = useState('');
    const [draftSaveError, setDraftSaveError] = useState('');
    const [analysisError, setAnalysisError] = useState('');
    const [values, setValues] = useState(() => {
        const initialValues = getInitialValues();
        return {
            ...(restoredDraft?.values ?? initialValues),
            // A saved draft can contain an outdated or empty department. Always
            // show the department registered on the current user's account.
            department: initialValues.department,
        };
    });
    const [phase, setPhase] = useState(() => restoredDraft?.phase ?? 'form');
    const [issueResolved, setIssueResolved] = useState(() => restoredDraft?.issueResolved ?? '');
    const [checkedSelfHelpSteps, setCheckedSelfHelpSteps] = useState(() => restoredDraft?.checkedSelfHelpSteps ?? []);
    const [aiAnalysis, setAiAnalysis] = useState(() => restoredDraft?.aiAnalysis ?? null);
    useEffect(() => {
        let active = true;
        const restoreDraft = async () => {
            try {
                const data = await loadUserAppData();
                if (!active)
                    return;
                const saved = readIncidentReportDraftFromValue(data.incident_report_draft);
                if (saved) {
                    setValues(current => ({ ...current, ...saved.values, department: getInitialValues().department }));
                    setPhase(saved.phase);
                    setAiAnalysis(saved.aiAnalysis);
                    setIssueResolved(saved.issueResolved);
                    setCheckedSelfHelpSteps(saved.checkedSelfHelpSteps);
                }
                else if (restoredDraft) {
                    // Migrate a draft from this browser to the authenticated database record.
                    await saveUserAppData('incident_report_draft', restoredDraft);
                    localStorage.removeItem(draftStorageKey);
                }
            }
            catch (error) {
                console.error('Unable to restore the incident report draft from the database:', error);
                if (active)
                    setDraftSaveError('Database draft storage is unavailable. The draft remains saved in this browser.');
            }
            finally {
                if (active)
                    setDatabaseDraftLoaded(true);
            }
        };
        void restoreDraft();
        return () => { active = false; };
    }, [draftStorageKey, restoredDraft]);
    useEffect(() => {
        if (!databaseDraftLoaded || discardDraftOnUnmount.current)
            return;
        const draft = {
            version: 1,
            values,
            phase,
            aiAnalysis,
            issueResolved,
            checkedSelfHelpSteps,
        };
        const timer = window.setTimeout(() => {
            void saveUserAppData('incident_report_draft', draft)
                .then(() => {
                localStorage.removeItem(draftStorageKey);
                setDraftSaveError('');
            })
                .catch(error => {
                console.error('Unable to save the incident report draft to the database:', error);
                try {
                    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
                }
                catch { /* quota or privacy mode */ }
                setDraftSaveError('Database draft storage is unavailable. The draft remains saved in this browser.');
            });
        }, 500);
        return () => window.clearTimeout(timer);
    }, [
        databaseDraftLoaded,
        aiAnalysis,
        checkedSelfHelpSteps,
        draftStorageKey,
        issueResolved,
        phase,
        values,
    ]);
    const handleLogout = () => {
        signOut();
        navigate('/');
    };
    const currentUser = getAuthSession()?.user;
    const analyze = async (event) => {
        event.preventDefault();
        if (analysisRequestActive.current || analyzing) {
            return;
        }
        setAnalysisError('');
        setSubmitError('');
        setAiAnalysis(null);
        setIssueResolved('');
        setCheckedSelfHelpSteps([]);
        try {
            analysisRequestActive.current = true;
            setAnalyzing(true);
            const analysis = await analyzeIncidentWithAI(values);
            setAiAnalysis(analysis);
            setPhase('result');
        }
        catch (error) {
            console.error('AI analysis error:', error);
            setAnalysisError(error instanceof Error
                ? error.message
                : 'AI assistance is currently unavailable. Please try again.');
        }
        finally {
            analysisRequestActive.current = false;
            setAnalyzing(false);
        }
    };
    const submit = async () => {
        setSubmitError('');
        if (submitting) {
            return;
        }
        const userId = getCurrentUserId();
        if (!userId ||
            currentUser?.role !== 'Employee') {
            setSubmitError('Your Employee login session has expired. Please log in again.');
            navigate('/');
            return;
        }
        if (!aiAnalysis) {
            setSubmitError('Please continue with the incident submission.');
            return;
        }
        if (!issueResolved) {
            setSubmitError('Please choose whether the basic self-help resolved the issue.');
            return;
        }
        const selfHelpSteps = parseSelfHelpSteps(aiAnalysis.basicSelfHelp);
        if (issueResolved === 'yes' &&
            selfHelpSteps.length > 0 &&
            checkedSelfHelpSteps.length < selfHelpSteps.length) {
            setSubmitError('Please mark each self-help step you tried before confirming that the issue is resolved.');
            return;
        }
        const analysis = aiAnalysis;
        try {
            setSubmitting(true);
            const response = await fetch(`${API_BASE_URL}/create_incident.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    resolvedByUser: issueResolved === 'yes',
                    affectedIssue: values.affectedService,
                    description: values.description,
                    issueCategory: values.issueCategory,
                    deviceType: values.deviceType,
                    connectionType: values.connectionType,
                    location: values.location,
                    // Severity is set by Admin/Secretary only.
                    severity: null,
                    /* AI classification is saved alongside the report. */
                    classification: analysis.classification,
                    keywords: analysis.keywords,
                    summary: analysis.summary,
                    /*
                     * Both employee-safe self-help and IT-only
                     * troubleshooting are generated by Gemini
                     * and stored in the database.
                     */
                    troubleshooting: formatTroubleshootingForStorage(analysis, issueResolved === 'yes'
                        ? parseSelfHelpSteps(analysis.basicSelfHelp).map((_, index) => index)
                        : checkedSelfHelpSteps),
                }),
            });
            const responseText = await response.text();
            console.log('PHP Response:', responseText);
            let data;
            try {
                data = JSON.parse(responseText);
            }
            catch {
                console.error('Invalid JSON from PHP:', responseText);
                void showAlert('The server returned an invalid response. Please check your PHP API.');
                return;
            }
            if (!response.ok ||
                !data.success) {
                setSubmitError(data.message ||
                    'Failed to submit incident.');
                console.error('Create incident error:', data);
                return;
            }
            console.log('Incident created:', data);
            discardDraftOnUnmount.current = true;
            localStorage.removeItem(draftStorageKey);
            void deleteUserAppData('incident_report_draft').catch(error => {
                console.error('Unable to remove the submitted incident draft from the database:', error);
            });
            setSubmitted(true);
            setValues(getInitialValues());
            setPhase('form');
            setAiAnalysis(null);
            setAnalysisError('');
            navigate('/employee/incidents');
        }
        catch (error) {
            console.error('Submit incident error:', error);
            setSubmitError('Unable to submit the report. Please make sure the shared API and database are available.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const closeReport = () => {
        discardDraftOnUnmount.current = true;
        localStorage.removeItem(draftStorageKey);
        void deleteUserAppData('incident_report_draft').catch(error => {
            console.error('Unable to remove the discarded incident draft from the database:', error);
        });
        setValues(getInitialValues());
        setPhase('form');
        setAiAnalysis(null);
        setAnalysisError('');
        navigate('/employee/incidents');
    };
    const editReport = () => {
        setSubmitError('');
        setPhase('form');
    };
    return (_jsxs("div", { className: `admin-shell${sidebarCollapsed
            ? ' sidebar-collapsed'
            : ''}`, children: [_jsxs("aside", { className: "admin-sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("img", { src: logo, alt: "Batangas City seal" }), _jsxs("strong", { children: ["Batang", _jsx("span", { children: "AI" })] })] }), _jsx("nav", { className: "sidebar-nav", "aria-label": "Employee navigation", children: navigation.map(item => (_jsxs("button", { type: "button", className: item.label ===
                                'Report Incident'
                                ? 'is-active'
                                : '', onClick: () => navigate(item.path), children: [_jsx(Icon, { name: item.icon }), _jsx("span", { children: item.label })] }, item.label))) })] }), _jsxs("main", { className: "admin-main", children: [_jsxs("header", { className: "admin-topbar", children: [_jsx("button", { className: "menu-button", type: "button", "aria-label": "Toggle menu", "aria-expanded": !sidebarCollapsed, onClick: () => setSidebarCollapsed(value => !value), children: _jsx(Icon, { name: "menu" }) }), _jsxs("div", { className: "topbar-title", children: [_jsx("h1", { children: "Report Incident" }), _jsx("p", { children: "Submit a new IT incident report." })] }), _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }), _jsx(AdminNotifications, {}), _jsx(ProfileMenu, { name: currentUser?.fullName ||
                                    'Employee', role: "Employee", avatarInitial: (currentUser?.fullName ||
                                    'E')
                                    .charAt(0)
                                    .toUpperCase(), onLogout: handleLogout })] }), _jsx("div", { className: "dashboard-content employee-report-page", children: _jsx("article", { className: "employee-report-dialog", role: "region", "aria-label": "Report a Network Incident form", children: _jsxs("div", { className: "employee-report-dialog-body", children: [phase === 'form' ? (_jsxs("form", { className: "incident-form", onSubmit: analyze, children: [_jsx(IncidentDetailsFields, { values: values, onChange: (field, value) => {
                                                    setDraftSaveError('');
                                                    setValues(v => ({ ...v, [field]: value }));
                                                } }), _jsx(IncidentDescriptionFields, { values: values, onChange: (field, value) => {
                                                    setDraftSaveError('');
                                                    setValues(v => ({ ...v, [field]: value }));
                                                } }), _jsxs("footer", { className: "employee-report-footer", children: [_jsx("button", { className: "btn-secondary", type: "button", onClick: closeReport, children: "Cancel" }), _jsxs("button", { className: "incident-new", type: "submit", disabled: analyzing, children: [_jsx(Icon, { name: "sparkle" }), "Analyze with BatangAI"] })] }), analyzing && (_jsx("div", { className: "employee-report-loading-overlay", role: "status", "aria-live": "polite", "aria-busy": "true", children: _jsxs("div", { className: "employee-report-loading-card", children: [_jsx("span", { className: "employee-report-spinner", "aria-hidden": "true" }), _jsx("h2", { children: "Generating response" }), _jsx("span", { className: "employee-report-loading-note", children: "This may take a few moments." })] }) })), analysisError && (_jsx("div", { className: "employee-report-error", role: "alert", children: _jsx("p", { children: analysisError }) })), submitted && (_jsxs("p", { className: "employee-report-success", children: [_jsx(Icon, { name: "check" }), "Your incident report has been submitted."] }))] })) : (_jsxs("section", { className: "employee-ai-result", "aria-live": "polite", children: [_jsxs("section", { className: "employee-self-help", "aria-labelledby": "employee-self-help-title", children: [_jsx("h3", { id: "employee-self-help-title", children: "Basic Self Help" }), parseSelfHelpSteps(aiAnalysis?.basicSelfHelp || '').length ? (_jsx("ol", { className: "employee-self-help-checklist", children: parseSelfHelpSteps(aiAnalysis?.basicSelfHelp || '').map((step, index) => (_jsx("li", { className: checkedSelfHelpSteps.includes(index) ? 'is-checked' : '', children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: checkedSelfHelpSteps.includes(index), onChange: event => setCheckedSelfHelpSteps(current => event.target.checked
                                                                            ? [...current, index]
                                                                            : current.filter(stepIndex => stepIndex !== index)) }), _jsx("span", { children: step })] }) }, index))) })) : _jsx("p", { children: "No troubleshooting steps were provided. You can still submit the report for IT assistance." })] }), _jsxs("section", { className: "employee-resolution-choice", "aria-labelledby": "employee-resolution-title", children: [_jsx("h3", { id: "employee-resolution-title", children: "Were you able to resolve the issue?" }), _jsx("p", { children: "Try the steps above, mark the steps you completed, then choose the result before submitting." }), _jsxs("div", { className: "employee-resolution-options", children: [_jsxs("label", { className: issueResolved === 'yes' ? 'is-selected' : '', children: [_jsx("input", { type: "radio", name: "issueResolved", value: "yes", checked: issueResolved === 'yes', onChange: () => setIssueResolved('yes') }), _jsx("span", { className: "employee-resolution-icon employee-resolution-icon--yes", "aria-hidden": "true", children: "\u2713" }), _jsx("strong", { children: "Yes, Resolved!" }), _jsx("small", { children: "Save to All Incidents as resolved by you" })] }), _jsxs("label", { className: issueResolved === 'no' ? 'is-selected' : '', children: [_jsx("input", { type: "radio", name: "issueResolved", value: "no", checked: issueResolved === 'no', onChange: () => setIssueResolved('no') }), _jsx("span", { className: "employee-resolution-icon employee-resolution-icon--no", "aria-hidden": "true", children: "\u00D7" }), _jsx("strong", { children: "Not Resolved" }), _jsx("small", { children: "Save as pending for admin or secretary assignment" })] })] })] }), submitError && (_jsx("p", { className: "employee-report-error", role: "alert", children: submitError })), _jsxs("div", { className: "employee-ai-actions", children: [_jsx("button", { className: "employee-ai-back", type: "button", onClick: closeReport, children: "Close" }), _jsx("button", { className: "employee-ai-edit", type: "button", onClick: editReport, children: "Edit Report" }), _jsxs("button", { className: "incident-new", type: "button", onClick: submit, disabled: submitting, children: [_jsx(Icon, { name: "check" }), submitting
                                                                ? 'Submitting…'
                                                                : issueResolved === 'yes'
                                                                    ? 'Submit as Resolved'
                                                                    : issueResolved === 'no'
                                                                        ? 'Submit for IT Assignment'
                                                                        : 'Submit Incident'] })] }), submitting && (_jsxs("div", { className: "employee-report-loading", role: "status", "aria-live": "polite", "aria-busy": "true", children: [_jsx("span", { className: "employee-report-spinner", "aria-hidden": "true" }), _jsx("span", { children: "Processing your incident report..." })] }))] })), draftSaveError && (_jsx("p", { className: "employee-report-error", role: "alert", children: draftSaveError }))] }) }) })] })] }));
}
export default ReportIncident;
