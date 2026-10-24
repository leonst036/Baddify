import React from 'react'
import { Box, Button } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface ContainerFilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: 'all' | 'running' | 'stopped'
  onStatusFilterChange: (status: 'all' | 'running' | 'stopped') => void
  runningCount: number
  stoppedCount: number
}

export function ContainerFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  runningCount,
  stoppedCount,
}: ContainerFilterBarProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      {/* Search Bar */}
      <Box
        sx={{
          height: 38,
          px: 1.5,
          bgcolor: m3Tokens.surfaceContainer,
          border: `1px solid ${m3Tokens.outlineVariant}`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:focus-within': {
            borderColor: m3Tokens.primary,
          },
        }}
      >
        <SearchIcon sx={{ fontSize: 16, color: m3Tokens.onSurfaceVariant, opacity: 0.8 }} />
        <Box
          component="input"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          placeholder="Filter containers..."
          sx={{
            border: 'none',
            outline: 'none',
            bgcolor: 'transparent',
            color: m3Tokens.onSurface,
            fontSize: 13,
            fontFamily: m3Tokens.fontSans,
            width: { xs: 120, sm: 180 },
            '&::placeholder': {
              color: m3Tokens.onSurfaceVariant,
              opacity: 0.7,
            },
          }}
        />
      </Box>

      {/* Status Filter Tabs */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: m3Tokens.surfaceContainerLow,
          p: 0.5,
          borderRadius: '8px',
          border: `1px solid ${m3Tokens.outlineVariant}`,
        }}
      >
        {(['all', 'running', 'stopped'] as const).map((s) => (
          <Button
            key={s}
            size="small"
            onClick={() => onStatusFilterChange(s)}
            sx={{
              fontSize: 11,
              fontFamily: m3Tokens.fontCode,
              textTransform: 'uppercase',
              px: 1.25,
              py: 0.25,
              minWidth: 'auto',
              borderRadius: '6px',
              color: statusFilter === s ? m3Tokens.onPrimary : m3Tokens.onSurfaceVariant,
              bgcolor: statusFilter === s ? m3Tokens.primary : 'transparent',
              '&:hover': {
                bgcolor: statusFilter === s ? m3Tokens.primary : 'rgba(255,255,255,0.04)',
              },
            }}
          >
            {s} {s === 'running' ? `(${runningCount})` : s === 'stopped' ? `(${stoppedCount})` : ''}
          </Button>
        ))}
      </Box>
    </Box>
  )
}
