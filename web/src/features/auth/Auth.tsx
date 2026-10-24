import { useState, useEffect } from 'react'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'

function getInitialAuthMode(): 'login' | 'register' {
  const hash = window.location.hash.toLowerCase()
  if (hash === '#signup' || hash === '#register') {
    return 'register'
  }
  return 'login'
}

export function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>(getInitialAuthMode)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase()
      if (hash === '#signup' || hash === '#register') {
        setMode('register')
      } else {
        setMode('login')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title = mode === 'register' ? 'baddify - Register' : 'baddify - Login'
  }, [mode])

  const navigateToRegister = () => {
    window.location.hash = '#signup'
    setMode('register')
  }

  const navigateToLogin = () => {
    window.location.hash = '#login'
    setMode('login')
  }

  return mode === 'register' ? (
    <RegisterPage onNavigateToLogin={navigateToLogin} />
  ) : (
    <LoginPage onNavigateToRegister={navigateToRegister} />
  )
}

export default Auth
