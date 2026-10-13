import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import LoginPage from './LoginPage'
import { AppThemeProvider } from '../theme/AppThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <LoginPage />
    </AppThemeProvider>
  </StrictMode>
)
