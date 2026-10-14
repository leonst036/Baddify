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
  Inventory2 as ContainerIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartIcon,
  Stop as StopIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'

interface ContainerPort {
  ip?: string
  private_port: number
  public_port?: number
  type: string
}

interface ContainerItem {
  id: string
  short_id: string
  name: string
  image: string
  state: string
  status: string
  created: number
  ports: ContainerPort[]
}

function getCookieToken(): string | null {
  const cookieRow = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
  if (!cookieRow) return null
  const token = cookieRow.split('=')[1]
  return token ? decodeURIComponent(token) : null
}

export function WorkloadAllocations() {
  const [containers, setContainers] = useState<ContainerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionPendingId, setActionPendingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchContainers = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    const token = getCookieToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const res = await fetch('/api/containers', {
        headers,
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error(`Failed to load containers (${res.status})`)
      }
      const data: ContainerItem[] = await res.json()
      setContainers(data || [])
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    setActionPendingId(id)
    const token = getCookieToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const res = await fetch(`/api/containers/${id}/${action}`, {
        method: 'POST',
        headers,
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error(`Action ${action} failed`)
      }
      await fetchContainers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed'
      setError(message)
    } finally {
      setActionPendingId(null)
    }
  }

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(() => {
      fetchContainers()
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const runningCount = containers.filter((c) => c.state === 'running').length
  const filteredContainers = containers.filter((c) => {
    if (filter === 'running') return c.state === 'running'
    if (filter === 'stopped') return c.state !== 'running'
    return true
  })

  return (
    <Card
      sx={{
        borderRadius: `${m3Tokens.cardRadius}px`,
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        boxShadow: m3Tokens.cardShadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 427,
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
          flexWrap: 'wrap',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '3px',
              bgcolor: m3Tokens.primary,
              boxShadow: `0 0 8px ${m3Tokens.primary}`,
            }}
          />
          <Typography
            sx={{
              fontSize: 13,
              color: m3Tokens.onSurface,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Workload Allocations
          </Typography>
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
        </Box>

        {/* Filter chips & refresh */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

          <Tooltip title="Refresh workloads">
            <span>
              <IconButton
                size="small"
                onClick={() => fetchContainers(true)}
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
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: m3Tokens.outlineVariant,
            borderRadius: '9999px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            bgcolor: m3Tokens.outline,
          },
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
          filteredContainers.map((item) => {
            const isRunning = item.state === 'running'
            const isPending = actionPendingId === item.id

            return (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: m3Tokens.surfaceContainerLow,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  transition: 'border-color 0.2s ease, background-color 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(208, 188, 255, 0.3)',
                    bgcolor: 'rgba(29, 27, 33, 0.95)',
                  },
                }}
              >
                {/* Left info block */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 240 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      bgcolor: m3Tokens.surfaceContainer,
                      border: `1px solid ${m3Tokens.outlineVariant}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <ContainerIcon sx={{ fontSize: 20, color: isRunning ? m3Tokens.primary : m3Tokens.outline }} />
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        bgcolor: isRunning ? '#81c784' : '#e57373',
                        boxShadow: isRunning ? '0 0 6px #81c784' : 'none',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: m3Tokens.onSurface,
                        }}
                      >
                        {item.name || item.short_id}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: m3Tokens.fontCode,
                          fontSize: 11,
                          color: m3Tokens.onSurfaceVariant,
                        }}
                      >
                        {item.short_id}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: m3Tokens.fontCode,
                        fontSize: 11,
                        color: m3Tokens.onSurfaceVariant,
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.image}
                    >
                      {item.image}
                    </Typography>
                  </Box>
                </Box>

                {/* Ports & Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  {item.ports && item.ports.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.ports.slice(0, 2).map((p, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: '6px',
                            bgcolor: m3Tokens.surfaceContainer,
                            border: `1px solid ${m3Tokens.outlineVariant}`,
                            fontFamily: m3Tokens.fontCode,
                            fontSize: 10,
                            color: m3Tokens.onSurfaceVariant,
                          }}
                        >
                          {p.public_port ? `${p.public_port}:${p.private_port}` : `${p.private_port}/${p.type}`}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        fontFamily: m3Tokens.fontCode,
                        fontSize: 10,
                        color: m3Tokens.outline,
                      }}
                    >
                      no ports
                    </Typography>
                  )}

                  <Chip
                    size="small"
                    label={item.state}
                    sx={{
                      height: 22,
                      fontSize: 10,
                      fontFamily: m3Tokens.fontCode,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      bgcolor: isRunning ? 'rgba(129, 199, 132, 0.12)' : 'rgba(202, 196, 208, 0.08)',
                      color: isRunning ? '#81c784' : m3Tokens.onSurfaceVariant,
                      border: `1px solid ${isRunning ? 'rgba(129, 199, 132, 0.3)' : m3Tokens.outlineVariant}`,
                    }}
                  />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isPending ? (
                      <CircularProgress size={16} sx={{ color: m3Tokens.primary, mx: 1 }} />
                    ) : (
                      <>
                        {isRunning ? (
                          <Tooltip title="Stop container">
                            <IconButton
                              size="small"
                              onClick={() => handleAction(item.id, 'stop')}
                              sx={{
                                color: '#e57373',
                                p: 0.6,
                                bgcolor: 'rgba(229, 115, 115, 0.08)',
                                '&:hover': { bgcolor: 'rgba(229, 115, 115, 0.2)' },
                              }}
                            >
                              <StopIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Start container">
                            <IconButton
                              size="small"
                              onClick={() => handleAction(item.id, 'start')}
                              sx={{
                                color: '#81c784',
                                p: 0.6,
                                bgcolor: 'rgba(129, 199, 132, 0.08)',
                                '&:hover': { bgcolor: 'rgba(129, 199, 132, 0.2)' },
                              }}
                            >
                              <PlayArrowIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Restart container">
                          <IconButton
                            size="small"
                            onClick={() => handleAction(item.id, 'restart')}
                            sx={{
                              color: m3Tokens.onSurfaceVariant,
                              p: 0.6,
                              bgcolor: m3Tokens.surfaceContainer,
                              border: `1px solid ${m3Tokens.outlineVariant}`,
                              '&:hover': { color: m3Tokens.primary, borderColor: m3Tokens.primary },
                            }}
                          >
                            <RestartIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            )
          })
        )}
      </Box>
    </Card>
  )
}

export default WorkloadAllocations
