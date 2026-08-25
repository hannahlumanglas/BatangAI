import type { CSSProperties } from 'react'

type PersonNameProps = {
  name: string
  className?: string
  compact?: boolean
}

/** Consistent, deterministic initials avatar for names shown in lists and details. */
export function PersonName({ name, className = '', compact = false }: PersonNameProps) {
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
      <span className="person-avatar" style={style} aria-hidden="true">{initials}</span>
      <span className="person-name-label">{name}</span>
    </span>
  )
}
