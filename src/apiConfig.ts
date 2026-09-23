/**
 * API server used by the BatangAI web application.
 * The production build uses the shared InfinityFree server.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost/BatangAI/api'
).replace(/\/$/, '')

/**
 * Public folder where uploaded profile photos are stored.
 */
export const PROFILE_PHOTOS_BASE_URL = (
  import.meta.env.VITE_PROFILE_PHOTOS_BASE_URL ||
  `${API_BASE_URL.replace(/\/api$/, '')}/uploads/profile_photos`
).replace(/\/$/, '')