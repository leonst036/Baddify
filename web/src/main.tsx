import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppThemeProvider } from './theme/AppThemeProvider'

const hasToken = document.cookie
  .split('; ')
  .some((row) => row.startsWith('token=') && row.split('=')[1])

if (!hasToken) {
  window.location.replace('/login/')
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </StrictMode>,
  )
}
