import { useEffect, useState } from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import {
  Apps as AppsIcon,
  Dns as DnsIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'
import { apiFetch, checkHeartbeat } from '../../api/client'
import type { CPUInfoResponse, RAMInfoResponse } from '../../api/types'
import { formatRamUsage } from '../../utils/formatters'
import { MetricProgressBar } from './shared'
import { SidebarNavItem } from './SidebarNavItem'

interface SidebarProps {
  activeNav: number
  onSelectNav: (index: number) => void
  cpuData?: CPUInfoResponse | null
  ramData?: RAMInfoResponse | null
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
  const [isConnected, setIsConnected] = useState(true)

  // Heartbeat monitoring
  useEffect(() => {
    let isMounted = true
    const check = async () => {
      const ok = await checkHeartbeat()
      if (isMounted) setIsConnected(ok)
    }

    check()
    const timer = setInterval(check, 10000)
    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [])

  // Telemetry fallback if not provided externally
  useEffect(() => {
    if (externalCpuData !== undefined && externalRamData !== undefined) return

    let isMounted = true
    const fetchTelemetry = async () => {
      try {
        const [cpu, ram] = await Promise.all([
          apiFetch<CPUInfoResponse>('/api/cpu'),
          apiFetch<RAMInfoResponse>('/api/ram'),
        ])
        if (isMounted) {
          setInternalCpuData(cpu)
          setInternalRamData(ram)
          setHasError(false)
        }
      } catch {
        if (isMounted) setHasError(true)
      }
    }

    fetchTelemetry()
    const timer = setInterval(fetchTelemetry, 5000)
    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [externalCpuData, externalRamData])

  const cpuData = externalCpuData !== undefined ? externalCpuData : internalCpuData
  const ramData = externalRamData !== undefined ? externalRamData : internalRamData

  const cpuValue = cpuData
    ? `${cpuData.usage_percent.toFixed(1)}%`
    : hasError
      ? 'ERR'
      : '--%'
  const cpuProgress = cpuData ? Math.min(100, Math.max(0, cpuData.usage_percent)) : 0

  const ramValue = ramData
    ? formatRamUsage(ramData.used, ramData.total)
    : hasError
      ? 'ERR'
      : '-- / --'
  const ramProgress = ramData ? Math.min(100, Math.max(0, ramData.used_percent)) : 0

  const statusText = hasError ? 'ERROR' : cpuData && ramData ? 'HEALTHY' : 'SYNCING'
  const statusColor = hasError ? m3Tokens.error : m3Tokens.primary

  const generalNavItems = [
    {
      id: 0,
      label: 'Dashboard',
      icon: <LayersIcon sx={{ fontSize: 13, color: activeNav === 0 ? m3Tokens.primary : m3Tokens.outline }} />,
    },
    {
      id: 1,
      label: 'Projects',
      icon: <AppsIcon sx={{ fontSize: 13, color: activeNav === 1 ? m3Tokens.primary : m3Tokens.outline }} />,
    },
    {
      id: 2,
      icon: <StorageIcon sx={{ fontSize: 13, color: activeNav === 2 ? m3Tokens.primary : m3Tokens.outline }} />,
    },
  ]

  const managementNavItems = [
    {
      id: 3,
      label: 'Servers',
      icon: <DnsIcon sx={{ fontSize: 13, color: activeNav === 3 ? m3Tokens.primary : m3Tokens.outline }} />,
    },
    {
      id: 4,
      label: 'Settings',
      icon: <SettingsIcon sx={{ fontSize: 13, color: activeNav === 4 ? m3Tokens.primary : m3Tokens.outline }} />,
    },
  ]

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
          <Tooltip title={isConnected ? 'Connected' : 'Disconnected'} arrow>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: isConnected ? m3Tokens.primary : m3Tokens.error,
                boxShadow: `0 0 8px ${isConnected ? m3Tokens.primary : m3Tokens.error}`,
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
          {/* General Group */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: m3Tokens.outline,
                px: 1,
              }}
            >
              General
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: 0.5 }}>
              {generalNavItems.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  isActive={activeNav === item.id}
                  onClick={() => onSelectNav(item.id)}
                />
              ))}
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

          {/* Management Group */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: m3Tokens.outline,
                px: 1,
              }}
            >
              Management
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: 0.5 }}>
              {managementNavItems.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  isActive={activeNav === item.id}
                  onClick={() => onSelectNav(item.id)}
                />
              ))}
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
            <MetricProgressBar
              progress={cpuProgress}
              height={6}
              trackColor={m3Tokens.surfaceContainer}
            />
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
            <MetricProgressBar
              progress={ramProgress}
              height={6}
              opacity={0.8}
              trackColor={m3Tokens.surfaceContainer}
            />
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
