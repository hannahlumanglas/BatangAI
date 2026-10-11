import { API_BASE_URL } from '../apiConfig'
import type { IncidentAnalysis, IncidentFormValues } from '../pages/Employee/ReportIncident'

type IncidentAnalysisResponse = {
  success?: boolean
  message?: string
  analysis?: {
    classification?: unknown
    keywords?: unknown
    summary?: unknown
    possibleInterpretation?: unknown
    basicSelfHelp?: unknown
    itTroubleshooting?: unknown
  }
}

function responseText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Calls the PHP Gemini API for the incident analysis. */
export async function analyzeIncidentWithAI(
  values: IncidentFormValues,
): Promise<IncidentAnalysis> {
  const response = await fetch(`${API_BASE_URL}/analyze_incident.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      department: values.department,
      location: values.location,
      issueCategory: values.issueCategory,
      deviceType: values.deviceType,
      connectionType: values.connectionType,
      affectedService: values.affectedService,
      description: values.description,
    }),
  })

  let data: IncidentAnalysisResponse
  try {
    data = await response.json() as IncidentAnalysisResponse
  } catch {
    throw new Error('The AI server returned an invalid response.')
  }

  if (!response.ok || !data.success || !data.analysis) {
    throw new Error(data.message || 'AI assistance is currently unavailable. Please try again.')
  }

  const analysis = data.analysis
  return {
    classification: responseText(analysis.classification).trim(),
    keywords: Array.isArray(analysis.keywords)
      ? analysis.keywords.filter((keyword): keyword is string => typeof keyword === 'string')
      : [],
    summary: responseText(analysis.summary),
    possibleInterpretation: responseText(analysis.possibleInterpretation),
    basicSelfHelp: responseText(analysis.basicSelfHelp),
    itTroubleshooting: responseText(analysis.itTroubleshooting),
  }
}
