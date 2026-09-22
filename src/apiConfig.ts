/**
 * All clients must point this at the one shared PHP server.  Do not use each
 * developer's localhost when the team needs to see the same data.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost/BatangAI/api'
).replace(/\/$/, '')

/** The public directory served by the same host as the API. */
export const PROFILE_PHOTOS_BASE_URL = (
  import.meta.env.VITE_PROFILE_PHOTOS_BASE_URL ||
  `${API_BASE_URL.replace(/\/api$/, '')}/uploads/profile_photos`
).replace(/\/$/, '')
