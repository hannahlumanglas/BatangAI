import { useState } from 'react';

export default function ProfileAvatar({ src, name, alt = '' }) {
    const [failedPhotoUrl, setFailedPhotoUrl] = useState(null);
    const initials = (name || 'User')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();

    if (!src || failedPhotoUrl === src) {
        return (
            <span aria-label={alt || `${name || 'User'} profile photo unavailable`} style={{ color: '#fff' }}>
                {initials}
            </span>
        );
    }

    return <img src={src} alt={alt} onError={() => setFailedPhotoUrl(src)} />;
}
