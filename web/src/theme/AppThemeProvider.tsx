import { useMemo, type ReactNode } from 'react'
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material'

import { m3Tokens } from './m3Tokens'

function createAppTheme(isDarkMode: boolean) {
  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? m3Tokens.primary : '#6750a4',
        contrastText: isDarkMode ? m3Tokens.onPrimary : '#ffffff',
      },
      secondary: {
        main: isDarkMode ? m3Tokens.secondary : '#625b71',
      },
      background: {
        default: isDarkMode ? m3Tokens.background : '#fef7ff',
        paper: isDarkMode ? m3Tokens.surfaceContainer : '#f2ecf3',
      },
      text: {
        primary: isDarkMode ? m3Tokens.onSurface : '#1d1b20',
        secondary: isDarkMode ? m3Tokens.onSurfaceVariant : '#494551',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: m3Tokens.fontSans,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: m3Tokens.cardRadius,
            boxShadow: isDarkMode
              ? m3Tokens.cardShadow
              : '0px 1px 3px rgba(29, 27, 32, 0.2), 0px 2px 6px rgba(29, 27, 32, 0.1)',
            backgroundColor: isDarkMode ? m3Tokens.surfaceContainer : '#ffffff',
            border: `1px solid ${m3Tokens.outlineVariant}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            backgroundColor: m3Tokens.surfaceContainerHigh,
          },
          bar: {
            borderRadius: 9999,
            backgroundColor: m3Tokens.primary,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
          },
        },
      },
    },
  })
}

interface AppThemeProviderProps {
  children: ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(() => createAppTheme(prefersDarkMode), [prefersDarkMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export default AppThemeProvider
