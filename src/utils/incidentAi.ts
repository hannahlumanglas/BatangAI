import { API_BASE_URL } from '../apiConfig'
import type { IncidentAnalysis, IncidentFormValues } from '../pages/Employee/ReportIncident'

type IncidentAnalysisResponse = {
  success?: unknown
  message?: unknown
  analysis?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIncidentAnalysis(value: unknown): value is IncidentAnalysis {
  if (!isRecord(value)) return false

  return (
    typeof value.classification === 'string' &&
    Array.isArray(value.keywords) &&
    value.keywords.every((keyword) => typeof keyword === 'string') &&
    typeof value.summary === 'string' &&
    typeof value.possibleInterpretation === 'string' &&
    typeof value.basicSelfHelp === 'string' &&
    typeof value.itTroubleshooting === 'string'
  )
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
    const payload: unknown = await response.json()
    if (!isRecord(payload)) throw new Error('Invalid response shape')
    data = payload as IncidentAnalysisResponse
  } catch {
    throw new Error('The AI server returned an invalid response.')
  }

  if (!response.ok || data.success !== true) {
    throw new Error(
      typeof data.message === 'string' && data.message.trim()
        ? data.message
        : 'AI assistance is currently unavailable. Please try again.',
    )
  }

  if (!isIncidentAnalysis(data.analysis)) {
    throw new Error('The AI server returned an incomplete analysis. Please try again.')
  }

  return {
    ...data.analysis,
    classification: data.analysis.classification.trim(),
    keywords: data.analysis.keywords.filter((keyword) => keyword.trim()),
  }
}
