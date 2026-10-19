function checklistItemText(item) {
    if (typeof item === 'string')
        return item.trim();
    if (typeof item === 'number')
        return String(item);
    if (Array.isArray(item))
        return item.map(checklistItemText).filter(Boolean).join(' ');
    if (!item || typeof item !== 'object')
        return '';
    const record = item;
    for (const key of ['step', 'instruction', 'text', 'title', 'description', 'action', 'content', 'label']) {
        const text = checklistItemText(record[key]);
        if (text)
            return text;
    }
    return '';
}
/** Keep Basic Self-Help formatting identical in the report form and incident view. */
export function parseSelfHelpSteps(value) {
    const normalized = value
        .replace(/\r\n?/g, '\n')
        .replace(/\[Employee checked self-help steps: [^\]]*\]/i, '')
        .split(/^\s*IT Troubleshooting Suggestions:\s*$/im)[0]
        .replace(/^\s*Basic Self-Help:\s*/i, '')
        .trim();
    // Older records may store the AI list as a JSON array.
    try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
            return parsed.map(checklistItemText).filter(Boolean);
        }
    }
    catch {
        // Plain text is the normal storage format.
    }
    return normalized
        .replace(/\s+(?=(?:\d+[.)]|[-*\u2022])\s+)/g, '\n')
        .split(/\n+/)
        .map(step => step.trim()
        .replace(/^(?:[-*\u2022]\s*|\d+[.)]\s*)/, '')
        .trim())
        .filter(Boolean);
}
export function parseTechnicianSteps(value) {
    const normalized = value
        .replace(/\r\n?/g, '\n')
        .split(/^\s*IT Troubleshooting Suggestions:\s*$/im)[1]
        ?.replace(/\[IT (?:manually )?checked troubleshooting steps: [^\]]*\]/i, '')
        .replace(/\[Employee checked self-help steps: [^\]]*\]/i, '')
        .trim() ?? '';
    if (!normalized)
        return [];
    try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed))
            return parsed.map(checklistItemText).filter(Boolean);
    }
    catch {
        // Plain text is the normal storage format.
    }
    return normalized
        .replace(/\s+(?=(?:\d+[.)]|[-*\u2022])\s+)/g, '\n')
        .split(/\n+/)
        .map(step => step.trim().replace(/^(?:[-*\u2022]\s*|\d+[.)]\s*)/, '').trim())
        .filter(Boolean);
}
