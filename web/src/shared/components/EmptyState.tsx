import React from 'react'
import { Box, Typography, type SxProps, type Theme } from '@mui/material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  dashed?: boolean
  sx?: SxProps<Theme>
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  dashed = true,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: icon ? 8 : 6,
        px: 4,
        borderRadius: '16px',
        bgcolor: m3Tokens.surfaceContainer,
        border: dashed
          ? `1px dashed ${m3Tokens.outlineVariant}`
          : `1px solid ${m3Tokens.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.75,
        my: icon ? 'auto' : 0,
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '16px',
            bgcolor: 'rgba(208, 188, 255, 0.08)',
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: m3Tokens.primary,
            mb: 0.5,
          }}
        >
          {icon}
        </Box>
      )}

      <Typography
        sx={{
          fontSize: icon ? 20 : 16,
          fontWeight: 600,
          color: m3Tokens.onSurface,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          sx={{
            fontSize: 13,
            color: m3Tokens.onSurfaceVariant,
            maxWidth: 420,
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      )}

      {(action || secondaryAction) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
          {action}
          {secondaryAction}
        </Box>
      )}
    </Box>
  )
}
