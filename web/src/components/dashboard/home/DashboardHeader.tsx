import { Box, Typography } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { m3Tokens } from '../../../theme/m3Tokens'

interface DashboardHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function DashboardHeader({
  searchQuery,
  onSearchChange,
}: DashboardHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1.5,
        borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: 28,
            fontWeight: 600,
            color: m3Tokens.onSurface,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Overview
        </Typography>
        <Typography
          component="p"
          sx={{
            fontFamily: m3Tokens.fontCode,
            fontSize: 12,
            color: m3Tokens.onSurfaceVariant,
            m: 0,
          }}
        >
          See the stats of your server
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            height: 38,
            px: 1.75,
            bgcolor: m3Tokens.surfaceContainer,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            transition: 'border-color 0.2s',
            '&:focus-within': {
              borderColor: m3Tokens.primary,
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: m3Tokens.onSurfaceVariant, opacity: 0.8 }} />
          <Box
            component="input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter resources..."
            sx={{
              border: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              color: m3Tokens.onSurface,
              fontFamily: m3Tokens.fontSans,
              fontSize: 13,
              width: 120,
              '&::placeholder': {
                color: m3Tokens.onSurfaceVariant,
                opacity: 0.6,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardHeader
