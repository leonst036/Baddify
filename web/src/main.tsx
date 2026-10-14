import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppThemeProvider } from './theme/AppThemeProvider'

function getCookieToken(): string | null {
  const cookieRow = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
  if (!cookieRow) return null
  const token = cookieRow.split('=')[1]
  return token ? decodeURIComponent(token) : null
}

function clearTokenCookie() {
  document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
}

async function startApp() {
  const token = getCookieToken()
  if (!token) {
    window.location.replace('/login/')
    return
  }

  try {
    const res = await fetch('/api/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      clearTokenCookie()
      window.location.replace('/login/')
      return
    }
  } catch {
    clearTokenCookie()
    window.location.replace('/login/')
    return
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </StrictMode>
  )
}

startApp()
