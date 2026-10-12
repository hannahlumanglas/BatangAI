import { API_BASE_URL } from '../apiConfig'

export const USER_APP_DATA_URL = `${API_BASE_URL}/user_app_data.php`

export type UserAppData = Record<string, unknown>

export async function loadUserAppData(signal?: AbortSignal): Promise<UserAppData> {
  const response = await fetch(USER_APP_DATA_URL, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    signal,
    headers: { Accept: 'application/json' },
  })
  const result = await response.json() as {
    success?: boolean
    data?: UserAppData
    message?: string
  }
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || 'Unable to load data from the database.')
  }
  return result.data
}

export async function saveUserAppData(key: string, value: unknown): Promise<void> {
  const response = await fetch(USER_APP_DATA_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
  const result = await response.json() as { success?: boolean; message?: string }
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Unable to save data to the database.')
  }
}

export async function deleteUserAppData(key: string): Promise<void> {
  const response = await fetch(USER_APP_DATA_URL, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  const result = await response.json() as { success?: boolean; message?: string }
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Unable to remove saved data from the database.')
  }
}
