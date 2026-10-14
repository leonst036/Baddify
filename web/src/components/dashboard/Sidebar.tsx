import { useEffect, useState } from 'react'
import { Box, Typography, Tooltip } from '@mui/material'
import {
  Layers as LayersIcon,
  Apps as AppsIcon,
  Storage as StorageIcon,
  Dns as DnsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'

interface CPUInfoResponse {
  logical_cores: number
  physical_cores: number
  overall_percent: number[]
  usage_percent: number
}

interface RAMInfoResponse {
  total: number
  used: number
  available: number
  free: number
  used_percent: number
}

interface SidebarProps {
  activeNav: number
  onSelectNav: (index: number) => void
  cpuData?: CPUInfoResponse | null
  ramData?: RAMInfoResponse | null
}

function getCookieToken(): string | null {
  const cookieRow = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
  if (!cookieRow) return null
  const token = cookieRow.split('=')[1]
  return token ? decodeURIComponent(token) : null
}

function formatRamUsage(usedBytes: number, totalBytes: number): string {
  if (!totalBytes || totalBytes <= 0) return '-- / --'
  const usedGb = usedBytes / (1024 * 1024 * 1024)
  const totalGb = totalBytes / (1024 * 1024 * 1024)
  if (totalGb >= 1) {
    const totalStr = totalGb.toFixed(1).replace(/\.0$/, '')
    return `${usedGb.toFixed(1)} / ${totalStr} GB`
  }
  const usedMb = (usedBytes / (1024 * 1024)).toFixed(0)
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(0)
  return `${usedMb} / ${totalMb} MB`
}

export function Sidebar({
  activeNav,
  onSelectNav,
  cpuData: externalCpuData,
  ramData: externalRamData,
}: SidebarProps) {
  const [internalCpuData, setInternalCpuData] = useState<CPUInfoResponse | null>(null)
  const [internalRamData, setInternalRamData] = useState<RAMInfoResponse | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (externalCpuData !== undefined && externalRamData !== undefined) {
      return
    }

    let isMounted = true

    const fetchTelemetry = async () => {
      const token = getCookieToken()
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      try {
        const [cpuRes, ramRes] = await Promise.all([
          fetch('/api/cpu', { headers, credentials: 'include' }),
          fetch('/api/ram', { headers, credentials: 'include' }),
        ])

        if (!cpuRes.ok || !ramRes.ok) {
          throw new Error('Failed to fetch telemetry')
        }

        const [cpu, ram] = await Promise.all([
          cpuRes.json() as Promise<CPUInfoResponse>,
          ramRes.json() as Promise<RAMInfoResponse>,
        ])

        if (isMounted) {
          setInternalCpuData(cpu)
          setInternalRamData(ram)
          setHasError(false)
        }
      } catch {
        if (isMounted) {
          setHasError(true)
        }
      }
    }

    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [externalCpuData, externalRamData])

  const cpuData = externalCpuData !== undefined ? externalCpuData : internalCpuData
  const ramData = externalRamData !== undefined ? externalRamData : internalRamData

  const cpuValue = cpuData
    ? `${cpuData.usage_percent.toFixed(1)}%`
    : hasError
      ? 'ERR'
      : '--%'
  const cpuProgress = cpuData
    ? Math.min(100, Math.max(0, cpuData.usage_percent))
    : 0

  const ramValue = ramData
    ? formatRamUsage(ramData.used, ramData.total)
    : hasError
      ? 'ERR'
      : '-- / --'
  const ramProgress = ramData
    ? Math.min(100, Math.max(0, ramData.used_percent))
    : 0

  const statusText = hasError
    ? 'ERROR'
    : cpuData && ramData
      ? 'HEALTHY'
      : 'SYNCING'
  const statusColor = hasError ? m3Tokens.error : m3Tokens.primary
  return (
    <Box
      component="aside"
      sx={{
        width: 256,
        flexShrink: 0,
        height: '100%',
        bgcolor: m3Tokens.surfaceContainerLow,
        borderRight: `1px solid ${m3Tokens.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 40,
      }}
    >
      {/* Top Header & Navigation Section */}
      <Box>
        {/* Header Branding Frame */}
        <Box
          sx={{
            height: 64,
            px: 2,
            borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Geometric Engine Indicator */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: m3Tokens.surfaceContainer,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${m3Tokens.outlineVariant}`,
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '4px',
                  bgcolor: m3Tokens.primary,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                component="span"
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  color: m3Tokens.onSurface,
                }}
              >
                Baddify
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: m3Tokens.fontCode,
                  fontSize: 11,
                  color: m3Tokens.onSurfaceVariant,
                  lineHeight: 1.2,
                  mt: 0.2,
                }}
              >
                localhost
              </Typography>
            </Box>
          </Box>

          {/* Pulsing Connected Indicator */}
          <Tooltip title="Connected" arrow>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: m3Tokens.primary,
                boxShadow: `0 0 8px ${m3Tokens.primary}`,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.4, transform: 'scale(0.85)' },
                },
              }}
            />
          </Tooltip>
        </Box>

        {/* Structural Content Slots */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Structural Group A */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              sx={{
                height: 12,
                width: 64,
                bgcolor: 'rgba(54, 52, 58, 0.6)',
                borderRadius: '4px',
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: 0.5 }}>
              {/* Nav item 0 (Active) */}
              <Box
                onClick={() => onSelectNav(0)}
                sx={{
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: activeNav === 0 ? m3Tokens.surfaceContainer : 'transparent',
                  border: `1px solid ${activeNav === 0 ? m3Tokens.outlineVariant : 'transparent'
                    }`,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  gap: 1.25,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor:
                      activeNav === 0
                        ? m3Tokens.surfaceContainer
                        : 'rgba(33, 31, 38, 0.6)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    bgcolor: activeNav === 0 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LayersIcon sx={{ fontSize: 13, color: activeNav === 0 ? m3Tokens.primary : m3Tokens.outline }} />
                </Box>
                <Box
                  sx={{
                    height: 10,
                    width: 96,
                    bgcolor: activeNav === 0 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    borderRadius: '4px',
                  }}
                />
              </Box>

              {/* Nav item 1 */}
              <Box
                onClick={() => onSelectNav(1)}
                sx={{
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: activeNav === 1 ? m3Tokens.surfaceContainer : 'transparent',
                  border: `1px solid ${activeNav === 1 ? m3Tokens.outlineVariant : 'transparent'
                    }`,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  gap: 1.25,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(33, 31, 38, 0.6)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    bgcolor: activeNav === 1 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppsIcon sx={{ fontSize: 13, color: activeNav === 1 ? m3Tokens.primary : m3Tokens.outline }} />
                </Box>
                <Box
                  sx={{
                    height: 10,
                    width: 80,
                    bgcolor: activeNav === 1 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    borderRadius: '4px',
                  }}
                />
              </Box>

              {/* Nav item 2 */}
              <Box
                onClick={() => onSelectNav(2)}
                sx={{
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: activeNav === 2 ? m3Tokens.surfaceContainer : 'transparent',
                  border: `1px solid ${activeNav === 2 ? m3Tokens.outlineVariant : 'transparent'
                    }`,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  gap: 1.25,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(33, 31, 38, 0.6)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    bgcolor: activeNav === 2 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StorageIcon sx={{ fontSize: 13, color: activeNav === 2 ? m3Tokens.primary : m3Tokens.outline }} />
                </Box>
                <Box
                  sx={{
                    height: 10,
                    width: 112,
                    bgcolor: activeNav === 2 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    borderRadius: '4px',
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Structural Divider */}
          <Box
            sx={{
              height: '1px',
              width: '100%',
              bgcolor: m3Tokens.outlineVariant,
            }}
          />

          {/* Structural Group B */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              sx={{
                height: 12,
                width: 80,
                bgcolor: 'rgba(54, 52, 58, 0.6)',
                borderRadius: '4px',
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: 0.5 }}>
              {/* Nav item 3 */}
              <Box
                onClick={() => onSelectNav(3)}
                sx={{
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: activeNav === 3 ? m3Tokens.surfaceContainer : 'transparent',
                  border: `1px solid ${activeNav === 3 ? m3Tokens.outlineVariant : 'transparent'
                    }`,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  gap: 1.25,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(33, 31, 38, 0.6)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    bgcolor: activeNav === 3 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DnsIcon sx={{ fontSize: 13, color: activeNav === 3 ? m3Tokens.primary : m3Tokens.outline }} />
                </Box>
                <Box
                  sx={{
                    height: 10,
                    width: 64,
                    bgcolor: activeNav === 3 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    borderRadius: '4px',
                  }}
                />
              </Box>

              {/* Nav item 4 */}
              <Box
                onClick={() => onSelectNav(4)}
                sx={{
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: activeNav === 4 ? m3Tokens.surfaceContainer : 'transparent',
                  border: `1px solid ${activeNav === 4 ? m3Tokens.outlineVariant : 'transparent'
                    }`,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.5,
                  gap: 1.25,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(33, 31, 38, 0.6)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    bgcolor: activeNav === 4 ? m3Tokens.surfaceContainerHigh : m3Tokens.surfaceContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SettingsIcon sx={{ fontSize: 13, color: activeNav === 4 ? m3Tokens.primary : m3Tokens.outline }} />
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontSize: 13,
                    fontWeight: activeNav === 4 ? 600 : 500,
                    color: activeNav === 4 ? m3Tokens.onSurface : m3Tokens.onSurfaceVariant,
                    lineHeight: 1,
                  }}
                >
                  Settings
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Cluster Resource & Node Telemetry Footer Frame */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${m3Tokens.outlineVariant}`,
          bgcolor: 'rgba(15, 13, 19, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: m3Tokens.fontCode,
            fontSize: 11,
            color: m3Tokens.onSurfaceVariant,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 11,
              letterSpacing: '0.08em',
              color: m3Tokens.onSurfaceVariant,
            }}
          >
            SERVER TELEMETRY
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.03em',
              color: statusColor,
            }}
          >
            {statusText}
          </Typography>
        </Box>

        {/* Mini Progress Telemetry Units */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {/* CPU Telemetry */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: m3Tokens.fontCode,
                fontSize: 11,
                color: m3Tokens.onSurfaceVariant,
              }}
            >
              <span>CPU</span>
              <span>{cpuValue}</span>
            </Box>
            <Box
              sx={{
                height: 6,
                width: '100%',
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  bgcolor: m3Tokens.primary,
                  width: `${cpuProgress}%`,
                  borderRadius: 9999,
                  transition: 'width 0.4s ease',
                }}
              />
            </Box>
          </Box>

          {/* RAM Telemetry */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: m3Tokens.fontCode,
                fontSize: 11,
                color: m3Tokens.onSurfaceVariant,
              }}
            >
              <span>RAM</span>
              <span>{ramValue}</span>
            </Box>
            <Box
              sx={{
                height: 6,
                width: '100%',
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  bgcolor: m3Tokens.primary,
                  opacity: 0.8,
                  width: `${ramProgress}%`,
                  borderRadius: 9999,
                  transition: 'width 0.4s ease',
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            pt: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: m3Tokens.onSurfaceVariant,
            fontFamily: m3Tokens.fontCode,
            fontSize: 11,
          }}
        >
          <Typography
            component="span"
            noWrap
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 11,
              color: m3Tokens.onSurfaceVariant,
            }}
          >
            v0.0.1-development
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: statusColor,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default Sidebar
