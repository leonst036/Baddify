import { useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  InputAdornment,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  PersonOutlined,
  LockOutlined,
} from '@mui/icons-material'
import { Footer } from '@/components/common'

interface RegisterPageProps {
  onNavigateToLogin?: () => void
}

export function RegisterPage({ onNavigateToLogin }: RegisterPageProps = {}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    fetch('/api/register', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = '/'
        } else {
          return fetch('/api/login', {
            method: 'POST',
            body: formData,
          }).then((res) => {
            if (res.ok) {
              window.location.href = '/'
            } else {
              setErrorMessage('Registration failed. Please check your credentials.')
            }
          })
        }
      })
      .catch(() => {
        setErrorMessage('Could not connect to server. Please try again.')
      })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <Box
        component="header"
        sx={{
          px: { xs: 2, sm: 4 },
          py: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          component="a"
          href="/"
          variant="h6"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            textDecoration: 'none',
          }}
        >
          Baddify
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'inline' } }}
          >
            Already have an account?
          </Typography>
          <Button
            href="#login"
            color="primary"
            sx={{ px: 2 }}
            onClick={(e) => {
              if (onNavigateToLogin) {
                e.preventDefault()
                onNavigateToLogin()
              }
            }}
          >
            Log in
          </Button>
        </Box>
      </Box>

      {/* Register Card */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 440, p: { xs: 1.5, sm: 2 } }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 500 }} gutterBottom>
                Create an account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please enter your details to sign up for Baddify.
              </Typography>
            </Box>

            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage('')}>
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                id="register-username"
                name="username"
                label="Username or Email"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlined color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                id="register-password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                id="register-confirm-password"
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          edge="end"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      color="primary"
                      required
                    />
                  }
                  label={<Typography variant="body2" color="text.secondary">I agree to the Terms & Privacy Policy</Typography>}
                />
              </Box>

              <Button type="submit" variant="contained" size="large" fullWidth sx={{ py: 1.25 }}>
                Sign Up
              </Button>

              <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    href="#login"
                    color="primary"
                    underline="hover"
                    sx={{ fontWeight: 500, cursor: 'pointer' }}
                    onClick={(e) => {
                      if (onNavigateToLogin) {
                        e.preventDefault()
                        onNavigateToLogin()
                      }
                    }}
                  >
                    Log in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Footer />
    </Box>
  )
}

export default RegisterPage
