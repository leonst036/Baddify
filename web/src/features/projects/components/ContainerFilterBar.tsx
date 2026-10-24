import { Box, Button } from '@mui/material'
import { m3Tokens } from '@/theme/m3Tokens'
import { SearchBar } from '@/shared'

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
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Filter containers..."
        width={{ xs: 120, sm: 180 }}
      />

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
