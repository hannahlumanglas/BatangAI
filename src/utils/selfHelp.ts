/** Keep Basic Self-Help formatting identical in the report form and incident view. */
export function parseSelfHelpSteps(value: string): string[] {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\s+(?=\d+[.)]\s+)/g, '\n')
    .split(/\n+/)
    .map(step => step.trim()
      .replace(/^Basic Self-Help:\s*/i, '')
      .replace(/^(?:[-*\u2022]\s*|\d+[.)]\s*)/, ''))
    .filter(Boolean)
}
