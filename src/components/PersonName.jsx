import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { getProfilePhotoUrl } from '../auth';
/** Consistent, deterministic initials avatar for names shown in lists and details. */
export function PersonName({ name, className = '', compact = false, profilePhoto = null }) {
    const [failedPhotoUrl, setFailedPhotoUrl] = useState(null);
    const photoUrl = profilePhoto ? getProfilePhotoUrl(profilePhoto) : null;
    const identityName = name.split(/\s+-\s+/)[0].trim();
    const initials = identityName
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const hue = [...identityName].reduce((total, letter) => total + letter.charCodeAt(0), 0) % 360;
    const style = { '--person-hue': hue };
    return (_jsxs("span", { className: `person-name${compact ? ' person-name--compact' : ''}${className ? ` ${className}` : ''}`, children: [_jsx("span", { className: "person-avatar", style: style, "aria-hidden": "true", children: photoUrl && failedPhotoUrl !== photoUrl ? (_jsx("img", { src: photoUrl, alt: "", onError: () => setFailedPhotoUrl(photoUrl) })) : initials }), _jsx("span", { className: "person-name-label", children: name })] }));
}
