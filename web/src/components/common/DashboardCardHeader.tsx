import type { ReactNode } from 'react'
import { Box, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

interface DashboardCardHeaderProps {
  title: string
  icon?: ReactNode
  badge?: ReactNode
  rightContent?: ReactNode
  onRefresh?: () => void
  isRefreshing?: boolean
  refreshTooltip?: string
}

export function DashboardCardHeader({
  title,
  icon,
  badge,
  rightContent,
  onRefresh,
  isRefreshing = false,
  refreshTooltip = 'Refresh',
}: DashboardCardHeaderProps) {
  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'rgba(33, 31, 38, 0.6)',
        flexWrap: 'wrap',
        gap: 1.5,
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        {icon}
        <Typography
          sx={{
            fontSize: 13,
            color: m3Tokens.onSurface,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
        {badge}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {rightContent}

        {onRefresh && (
          <Tooltip title={refreshTooltip}>
            <span>
              <IconButton
                size="small"
                onClick={onRefresh}
                disabled={isRefreshing}
                sx={{
                  color: m3Tokens.onSurfaceVariant,
                  p: 0.5,
                  '&:hover': { color: m3Tokens.primary },
                }}
              >
                {isRefreshing ? (
                  <CircularProgress size={14} sx={{ color: m3Tokens.primary }} />
                ) : (
                  <RefreshIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

export default DashboardCardHeader
