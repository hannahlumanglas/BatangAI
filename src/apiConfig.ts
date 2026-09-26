/**
 * API server used by the BatangAI web application.
 * Development serves PHP from the workspace on port 8000. Production uses
 * the shared InfinityFree server configured in .env.production.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api'
).replace(/\/$/, '')

/**
 * Public folder where uploaded profile photos are stored.
 */
export const PROFILE_PHOTOS_BASE_URL = (
  import.meta.env.VITE_PROFILE_PHOTOS_BASE_URL ||
  `${API_BASE_URL.replace(/\/api$/, '')}/uploads/profile_photos`
).replace(/\/$/, '')