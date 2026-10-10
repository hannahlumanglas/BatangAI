/**
 * Development can use the local PHP API; deployments serve the API on the
 * same origin so Vercel Functions receive the existing endpoint paths.
 */
export const API_BASE_URL = (
  import.meta.env.DEV
    ? import.meta.env.VITE_API_BASE_URL || '/api'
    : '/api'
).replace(/\/$/, '')

/**
 * Public folder where uploaded profile photos are stored.
 */
export const PROFILE_PHOTOS_BASE_URL = (
  import.meta.env.DEV
    ? import.meta.env.VITE_PROFILE_PHOTOS_BASE_URL ||
      `${API_BASE_URL.startsWith('/') ? '' : API_BASE_URL.replace(/\/api$/, '')}/uploads/profile_photos`
    : '/uploads/profile_photos'
).replace(/\/$/, '')
