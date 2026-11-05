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

function stripChecklistHeading(value) {
    return value
        .replace(/^\s*(?:Basic Self-Help|IT Troubleshooting Suggestions|Technician Troubleshooting Steps|Troubleshooting)\s*:?\s*/i, '')
        .trim();
}

function extractChecklistSection(value, stopLabels, includeAfter = false) {
    const cleaned = value
        .replace(/\r\n?/g, '\n')
        .replace(/\[Employee checked self-help steps: [^\]]*\]/i, '')
        .replace(/\[IT (?:manually )?checked troubleshooting steps: [^\]]*\]/i, '')
        .trim();

    if (!cleaned)
        return '';

    let earliestIndex = Number.POSITIVE_INFINITY;
    let earliestMatch = null;

    for (const label of stopLabels) {
        const regex = new RegExp(`(^|\\n)\\s*${label}\\s*:?\\s*(?:\\n|$)`, 'i');
        const match = cleaned.match(regex);
        if (!match || match.index === undefined) continue;
        if (match.index < earliestIndex) {
            earliestIndex = match.index;
            earliestMatch = match;
        }
    }

    if (earliestMatch) {
        const sectionStart = earliestMatch.index + earliestMatch[0].length;
        return stripChecklistHeading(includeAfter ? cleaned.slice(sectionStart).trim() : cleaned.slice(0, earliestIndex).trim());
    }

    return stripChecklistHeading(cleaned);
}

/** Keep Basic Self-Help formatting identical in the report form and incident view. */
export function parseSelfHelpSteps(value) {
    const normalized = extractChecklistSection(value, ['IT Troubleshooting Suggestions', 'Technician Troubleshooting Steps', 'Troubleshooting'], false);
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
    const normalized = extractChecklistSection(value, ['IT Troubleshooting Suggestions', 'Technician Troubleshooting Steps', 'Troubleshooting'], true);
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
