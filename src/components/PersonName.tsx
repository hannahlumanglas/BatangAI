import { useState, type CSSProperties } from 'react'
import { getProfilePhotoUrl } from '../auth'

type PersonNameProps = {
  name: string
  className?: string
  compact?: boolean
  profilePhoto?: string | null
}

/** Consistent, deterministic initials avatar for names shown in lists and details. */
export function PersonName({ name, className = '', compact = false, profilePhoto = null }: PersonNameProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null)
  const photoUrl = profilePhoto ? getProfilePhotoUrl(profilePhoto) : null
  const identityName = name.split(/\s+-\s+/)[0].trim()
  const initials = identityName
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const hue = [...identityName].reduce((total, letter) => total + letter.charCodeAt(0), 0) % 360
  const style = { '--person-hue': hue } as CSSProperties

  return (
    <span className={`person-name${compact ? ' person-name--compact' : ''}${className ? ` ${className}` : ''}`}>
      <span className="person-avatar" style={style} aria-hidden="true">
        {photoUrl && failedPhotoUrl !== photoUrl ? (
          <img src={photoUrl} alt="" onError={() => setFailedPhotoUrl(photoUrl)} />
        ) : initials}
      </span>
      <span className="person-name-label">{name}</span>
    </span>
  )
}
