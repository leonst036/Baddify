import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  AccessTime as AccessTimeIcon,
  Dns as DnsIcon,
  Memory as MemoryIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'

interface NodeInfoResponse {
  hostname: string
  os: string
  platform: string
  platform_version: string
  kernel_version: string
  kernel_arch: string
  uptime: number
  uptime_formatted: string
  cpu_model: string
  logical_cores: number
  physical_cores: number
  total_ram: number
  docker_version: string
  docker_status: string
  load_avg_1: number
  load_avg_5: number
  load_avg_15: number
}

function getCookieToken(): string | null {
  const cookieRow = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
  if (!cookieRow) return null
  const token = cookieRow.split('=')[1]
  return token ? decodeURIComponent(token) : null
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(1)} GB`
}

export function NodeDetails() {
  const [nodeInfo, setNodeInfo] = useState<NodeInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNodeInfo = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    const token = getCookieToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const res = await fetch('/api/node-info', {
        headers,
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error(`Failed to load node info (${res.status})`)
      }
      const data: NodeInfoResponse = await res.json()
      setNodeInfo(data)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNodeInfo()
    const interval = setInterval(() => {
      fetchNodeInfo()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card
      sx={{
        borderRadius: `${m3Tokens.cardRadius}px`,
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        boxShadow: m3Tokens.cardShadow,
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'rgba(33, 31, 38, 0.6)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <DnsIcon sx={{ fontSize: 18, color: m3Tokens.primary }} />
          <Typography
            sx={{
              fontSize: 13,
              color: m3Tokens.onSurface,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Node Details
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh node info">
            <span>
              <IconButton
                size="small"
                onClick={() => fetchNodeInfo(true)}
                disabled={refreshing}
                sx={{
                  color: m3Tokens.onSurfaceVariant,
                  p: 0.5,
                  '&:hover': { color: m3Tokens.primary },
                }}
              >
                {refreshing ? (
                  <CircularProgress size={14} sx={{ color: m3Tokens.primary }} />
                ) : (
                  <RefreshIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Body content */}
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
            {/* Hostname & Operating System */}
            <Box
              sx={{
                p: 1.75,
                borderRadius: '12px',
                bgcolor: m3Tokens.surfaceContainerLow,
                border: `1px solid ${m3Tokens.outlineVariant}`,
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
            </Box>

            {/* Hardware Profile & CPU */}
            <Box
              sx={{
                p: 1.75,
                borderRadius: '12px',
                bgcolor: m3Tokens.surfaceContainerLow,
                border: `1px solid ${m3Tokens.outlineVariant}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
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
            </Box>

            {/* Load Average & Uptime */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
              }}
            >
              {/* Uptime Box */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: m3Tokens.surfaceContainerLow,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
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
              </Box>

              {/* Docker Engine Box */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: m3Tokens.surfaceContainerLow,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
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
              </Box>
            </Box>

            {/* Load Average Strip */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                bgcolor: m3Tokens.surfaceContainerLow,
                border: `1px solid ${m3Tokens.outlineVariant}`,
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
            </Box>
          </>
        ) : null}
      </Box>
    </Card>
  )
}

export default NodeDetails
