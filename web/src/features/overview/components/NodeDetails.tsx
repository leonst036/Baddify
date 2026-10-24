import { Box, Chip, Skeleton, Typography } from '@mui/material'
import {
  AccessTime as AccessTimeIcon,
  Dns as DnsIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import { apiFetch } from '@/api/client'
import type { NodeInfoResponse } from '@/api/types'
import { formatBytes } from '@/utils/formatters'
import { usePolling } from '@/hooks/usePolling'
import { DashboardCard, DashboardCardHeader } from '@/components/common'
import { NodeInfoTile } from './NodeInfoTile'

export function NodeDetails() {
  const {
    data: nodeInfo,
    loading,
    refreshing,
    error,
    refetch,
  } = usePolling<NodeInfoResponse>(() => apiFetch<NodeInfoResponse>('/api/node-info'), 5000)

  return (
    <DashboardCard sx={{ overflow: 'hidden' }}>
      <DashboardCardHeader
        title="Node Details"
        icon={<DnsIcon sx={{ fontSize: 18, color: m3Tokens.primary }} />}
        onRefresh={refetch}
        isRefreshing={refreshing}
        refreshTooltip="Refresh node info"
      />

      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {loading ? (
          <>
            <Skeleton variant="rounded" height={60} sx={{ bgcolor: m3Tokens.surfaceContainerHigh }} />
            <Skeleton variant="rounded" height={60} sx={{ bgcolor: m3Tokens.surfaceContainerHigh }} />
            <Skeleton variant="rounded" height={60} sx={{ bgcolor: m3Tokens.surfaceContainerHigh }} />
          </>
        ) : error && !nodeInfo ? (
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(255, 180, 171, 0.1)',
              border: `1px solid ${m3Tokens.error}`,
              color: m3Tokens.error,
              fontSize: 12,
            }}
          >
            {error}
          </Box>
        ) : nodeInfo ? (
          <>
            {/* Host & Kernel */}
            <NodeInfoTile
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: m3Tokens.onSurfaceVariant,
                    fontWeight: 500,
                  }}
                >
                  Host & Kernel
                </Typography>
                <Typography
                  sx={{
                    fontFamily: m3Tokens.fontCode,
                    fontSize: 13,
                    color: m3Tokens.onSurface,
                    fontWeight: 600,
                    mt: 0.25,
                  }}
                >
                  {nodeInfo.hostname || 'localhost'}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: m3Tokens.fontCode,
                    fontSize: 11,
                    color: m3Tokens.onSurfaceVariant,
                    mt: 0.2,
                  }}
                >
                  {nodeInfo.platform} {nodeInfo.platform_version} ({nodeInfo.kernel_arch})
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '8px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  fontFamily: m3Tokens.fontCode,
                  fontSize: 11,
                  color: m3Tokens.primary,
                }}
              >
                Linux {nodeInfo.kernel_version ? nodeInfo.kernel_version.split('-')[0] : ''}
              </Box>
            </NodeInfoTile>

            {/* Hardware Profile & CPU */}
            <NodeInfoTile sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <MemoryIcon sx={{ fontSize: 15, color: m3Tokens.secondary }} />
                  <Typography
                    sx={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: m3Tokens.onSurfaceVariant,
                      fontWeight: 500,
                    }}
                  >
                    Hardware Specs
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: m3Tokens.fontCode,
                    fontSize: 11,
                    color: m3Tokens.onSurfaceVariant,
                  }}
                >
                  {formatBytes(nodeInfo.total_ram)} RAM
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: 12,
                  color: m3Tokens.onSurface,
                  fontFamily: m3Tokens.fontSans,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={nodeInfo.cpu_model}
              >
                {nodeInfo.cpu_model || 'Generic CPU'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mt: 0.25 }}>
                <Chip
                  size="small"
                  label={`${nodeInfo.physical_cores} Cores / ${nodeInfo.logical_cores} Threads`}
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontFamily: m3Tokens.fontCode,
                    bgcolor: m3Tokens.surfaceContainer,
                    color: m3Tokens.onSurfaceVariant,
                    border: `1px solid ${m3Tokens.outlineVariant}`,
                  }}
                />
              </Box>
            </NodeInfoTile>

            {/* Load Average & Uptime */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
              }}
            >
              {/* Uptime Box */}
              <NodeInfoTile sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant }} />
                  <Typography
                    sx={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: m3Tokens.onSurfaceVariant,
                      fontWeight: 500,
                    }}
                  >
                    Uptime
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: m3Tokens.fontCode,
                    fontSize: 13,
                    color: m3Tokens.onSurface,
                    fontWeight: 600,
                  }}
                >
                  {nodeInfo.uptime_formatted || '--'}
                </Typography>
              </NodeInfoTile>

              {/* Docker Engine Box */}
              <NodeInfoTile sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: m3Tokens.onSurfaceVariant,
                    fontWeight: 500,
                  }}
                >
                  Docker Daemon
                </Typography>
                <Typography
                  sx={{
                    fontFamily: m3Tokens.fontCode,
                    fontSize: 12,
                    color: m3Tokens.primary,
                    fontWeight: 600,
                  }}
                >
                  v{nodeInfo.docker_version || 'Unknown'}
                </Typography>
              </NodeInfoTile>
            </Box>

            {/* Load Average Strip */}
            <NodeInfoTile
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <SpeedIcon sx={{ fontSize: 14, color: m3Tokens.tertiaryContainer }} />
                <Typography
                  sx={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: m3Tokens.onSurfaceVariant,
                    fontWeight: 500,
                  }}
                >
                  Load Avg
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography sx={{ fontFamily: m3Tokens.fontCode, fontSize: 11, color: m3Tokens.onSurface }}>
                  <Box component="span" sx={{ color: m3Tokens.onSurfaceVariant, mr: 0.25 }}>1m</Box>
                  {nodeInfo.load_avg_1.toFixed(2)}
                </Typography>
                <Typography sx={{ fontFamily: m3Tokens.fontCode, fontSize: 11, color: m3Tokens.onSurface }}>
                  <Box component="span" sx={{ color: m3Tokens.onSurfaceVariant, mr: 0.25 }}>5m</Box>
                  {nodeInfo.load_avg_5.toFixed(2)}
                </Typography>
                <Typography sx={{ fontFamily: m3Tokens.fontCode, fontSize: 11, color: m3Tokens.onSurface }}>
                  <Box component="span" sx={{ color: m3Tokens.onSurfaceVariant, mr: 0.25 }}>15m</Box>
                  {nodeInfo.load_avg_15.toFixed(2)}
                </Typography>
              </Box>
            </NodeInfoTile>
          </>
        ) : null}
      </Box>
    </DashboardCard>
  )
}

export default NodeDetails
