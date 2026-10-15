import { useState } from 'react'
import { Box, Chip, Skeleton, Typography } from '@mui/material'
import { Inventory2 as ContainerIcon } from '@mui/icons-material'
import { m3Tokens } from '../../../theme/m3Tokens'
import { apiFetch } from '../../../api/client'
import type { ContainerItem } from '../../../api/types'
import { usePolling } from '../../../hooks/usePolling'
import { DashboardCard, DashboardCardHeader } from '../shared'
import { WorkloadRow } from './WorkloadRow'

export function WorkloadAllocations() {
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [actionPendingId, setActionPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    data: containersData,
    loading,
    refreshing,
    error: fetchError,
    refetch,
  } = usePolling<ContainerItem[]>(() => apiFetch<ContainerItem[]>('/api/containers'), 4000)

  const containers = containersData || []
  const error = actionError || fetchError

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    setActionPendingId(id)
    try {
      await apiFetch(`/api/containers/${id}/${action}`, { method: 'POST' })
      setActionError(null)
      await refetch()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed'
      setActionError(message)
    } finally {
      setActionPendingId(null)
    }
  }

  const runningCount = containers.filter((c) => c.state === 'running').length
  const filteredContainers = containers.filter((c) => {
    if (filter === 'running') return c.state === 'running'
    if (filter === 'stopped') return c.state !== 'running'
    return true
  })

  return (
    <DashboardCard
      sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 427,
      }}
    >
      <DashboardCardHeader
        title="Workload Allocations"
        icon={
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '3px',
              bgcolor: m3Tokens.primary,
              boxShadow: `0 0 8px ${m3Tokens.primary}`,
            }}
          />
        }
        badge={
          <Chip
            size="small"
            label={`${runningCount} Active / ${containers.length} Total`}
            sx={{
              height: 22,
              fontSize: 10,
              fontFamily: m3Tokens.fontCode,
              bgcolor: m3Tokens.surfaceContainerHigh,
              color: m3Tokens.onSurfaceVariant,
              border: `1px solid ${m3Tokens.outlineVariant}`,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        }
        rightContent={
          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: m3Tokens.surfaceContainerLow, p: 0.5, borderRadius: '8px' }}>
            {(['all', 'running', 'stopped'] as const).map((key) => {
              const active = filter === key
              return (
                <Box
                  key={key}
                  onClick={() => setFilter(key)}
                  sx={{
                    px: 1,
                    py: 0.35,
                    borderRadius: '6px',
                    fontSize: 11,
                    fontFamily: m3Tokens.fontCode,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    bgcolor: active ? m3Tokens.surfaceContainerHighest : 'transparent',
                    color: active ? m3Tokens.onSurface : m3Tokens.onSurfaceVariant,
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                    '&:hover': {
                      color: m3Tokens.onSurface,
                    },
                  }}
                >
                  {key}
                </Box>
              )
            })}
          </Box>
        }
        onRefresh={refetch}
        isRefreshing={refreshing}
        refreshTooltip="Refresh workloads"
      />

      {/* Container list body */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: `${m3Tokens.outlineVariant} transparent`,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: m3Tokens.outlineVariant, borderRadius: '9999px' },
          '&::-webkit-scrollbar-thumb:hover': { bgcolor: m3Tokens.outline },
        }}
      >
        {loading ? (
          <>
            <Skeleton variant="rounded" height={68} sx={{ bgcolor: m3Tokens.surfaceContainerHigh }} />
            <Skeleton variant="rounded" height={68} sx={{ bgcolor: m3Tokens.surfaceContainerHigh }} />
            <Skeleton variant="rounded" height={68} sx={{ bgcolor: m3Tokens.surfaceContainerHigh }} />
          </>
        ) : error && containers.length === 0 ? (
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              bgcolor: 'rgba(255, 180, 171, 0.08)',
              border: `1px solid ${m3Tokens.error}`,
              color: m3Tokens.error,
              fontSize: 12,
            }}
          >
            {error}
          </Box>
        ) : filteredContainers.length === 0 ? (
          <Box
            sx={{
              py: 5,
              px: 3,
              borderRadius: '16px',
              bgcolor: m3Tokens.surfaceContainerLow,
              border: `1px dashed ${m3Tokens.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              textAlign: 'center',
            }}
          >
            <ContainerIcon sx={{ fontSize: 36, color: m3Tokens.outline, opacity: 0.7 }} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: m3Tokens.onSurface }}>
                {filter === 'all'
                  ? 'No active workloads discovered'
                  : `No ${filter} workloads found`}
              </Typography>
              <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant, mt: 0.5 }}>
                Deploy services using the Baddify deployment API or start existing Docker containers.
              </Typography>
            </Box>
          </Box>
        ) : (
          filteredContainers.map((item) => (
            <WorkloadRow
              key={item.id}
              item={item}
              isPending={actionPendingId === item.id}
              onAction={handleAction}
            />
          ))
        )}
      </Box>
    </DashboardCard>
  )
}

export default WorkloadAllocations
