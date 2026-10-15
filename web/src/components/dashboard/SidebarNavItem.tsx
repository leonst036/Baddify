import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'

interface SidebarNavItemProps {
  label?: string
  icon: ReactNode
  isActive: boolean
  onClick: () => void
}

export function SidebarNavItem({ label, icon, isActive, onClick }: SidebarNavItemProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        height: 36,
        borderRadius: '8px',
        bgcolor: isActive ? m3Tokens.surfaceContainer : 'transparent',
        border: `1px solid ${isActive ? m3Tokens.outlineVariant : 'transparent'}`,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        gap: 1.25,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: isActive ? m3Tokens.surfaceContainer : 'rgba(33, 31, 38, 0.6)',
        },
      }}
    >
      <Box
        sx={{
          width: 16,
          height: 16,
          borderRadius: '4px',
          bgcolor: isActive ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>

      {label ? (
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? m3Tokens.onSurface : m3Tokens.onSurfaceVariant,
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      ) : (
        <Box
          sx={{
            height: 10,
            width: 112,
            bgcolor: isActive ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
            borderRadius: '4px',
          }}
        />
      )}
    </Box>
  )
}

export default SidebarNavItem
