import { useMemo, type ReactNode } from 'react'
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material'

export function createAppTheme(isDarkMode: boolean) {
  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#d0bcff' : '#6750a4',
        contrastText: isDarkMode ? '#381e72' : '#ffffff',
      },
      background: {
        default: isDarkMode ? '#141218' : '#fef7ff',
        paper: isDarkMode ? '#211f26' : '#f2ecf3',
      },
      text: {
        primary: isDarkMode ? '#e6e0e9' : '#1d1b20',
        secondary: isDarkMode ? '#cac4d0' : '#494551',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Roboto Flex", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 28,
            boxShadow: isDarkMode
              ? '0px 1px 3px rgba(0, 0, 0, 0.45), 0px 3px 8px rgba(0, 0, 0, 0.3)'
              : '0px 1px 3px rgba(29, 27, 32, 0.2), 0px 2px 6px rgba(29, 27, 32, 0.1)',
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
