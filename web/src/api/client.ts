export function getCookieToken(): string | null {
  const cookieRow = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
  if (!cookieRow) return null
  const token = cookieRow.split('=')[1]
  return token ? decodeURIComponent(token) : null
}

export function getAuthHeaders(): Record<string, string> {
  const token = getCookieToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getCookieToken()
  const headers = new Headers(options.headers || {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`Failed request to ${endpoint} (${res.status})`)
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return {} as T
}

export async function checkHeartbeat(): Promise<boolean> {
  try {
    const res = await fetch('/api/heartbeat', {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
    return res.ok
  } catch {
    return false
  }
}
