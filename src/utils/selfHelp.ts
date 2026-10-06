/** Keep Basic Self-Help formatting identical in the report form and incident view. */
export function parseSelfHelpSteps(value: string): string[] {
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .replace(/\[Employee checked self-help steps: [^\]]*\]/i, '')
    .split(/^\s*IT Troubleshooting Suggestions:\s*$/im)[0]
    .replace(/^\s*Basic Self-Help:\s*/i, '')
    .trim()

  // Older records may store the AI list as a JSON array.
  try {
    const parsed: unknown = JSON.parse(normalized)
    if (Array.isArray(parsed)) {
      return parsed.map(step => String(step).trim()).filter(Boolean)
    }
  } catch {
    // Plain text is the normal storage format.
  }

  return normalized
    .replace(/\s+(?=(?:\d+[.)]|[-*\u2022])\s+)/g, '\n')
    .split(/\n+/)
    .map(step => step.trim()
      .replace(/^(?:[-*\u2022]\s*|\d+[.)]\s*)/, '')
      .trim())
    .filter(Boolean)
}

export function parseTechnicianSteps(value: string): string[] {
  const normalized = value
    .replace(/\r\n?/g, '\n')
    .split(/^\s*IT Troubleshooting Suggestions:\s*$/im)[1]
    ?.replace(/\[IT checked troubleshooting steps: [^\]]*\]/i, '')
    .replace(/\[Employee checked self-help steps: [^\]]*\]/i, '')
    .trim() ?? ''

  if (!normalized) return []
  try {
    const parsed: unknown = JSON.parse(normalized)
    if (Array.isArray(parsed)) return parsed.map(step => String(step).trim()).filter(Boolean)
  } catch {
    // Plain text is the normal storage format.
  }
  return normalized
    .replace(/\s+(?=(?:\d+[.)]|[-*\u2022])\s+)/g, '\n')
    .split(/\n+/)
    .map(step => step.trim().replace(/^(?:[-*\u2022]\s*|\d+[.)]\s*)/, '').trim())
    .filter(Boolean)
}
