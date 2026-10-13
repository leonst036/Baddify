import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Auth from './Auth'
import { AppThemeProvider } from '../theme/AppThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <Auth />
    </AppThemeProvider>
  </StrictMode>
)
