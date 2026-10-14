import { useEffect, useState } from 'react'
import { Box, Card, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'

interface MetricItemProps {
  title: string
  status: string
  statusColor?: string
  value: string
  progress: number
  progressOpacity?: number
}

interface CPUInfoResponse {
  logical_cores: number
  physical_cores: number
  overall_percent: number[]
  usage_percent: number
}

function getCookieToken(): string | null {
  const cookieRow = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
  if (!cookieRow) return null
  const token = cookieRow.split('=')[1]
  return token ? decodeURIComponent(token) : null
}

function MetricCard({
  title,
  status,
  statusColor,
  value,
  progress,
  progressOpacity = 1,
}: MetricItemProps) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: `${m3Tokens.cardRadius}px`,
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        boxShadow: m3Tokens.cardShadow,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 128,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: m3Tokens.onSurfaceVariant,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontFamily: m3Tokens.fontCode,
            fontSize: 11,
            color: statusColor || m3Tokens.onSurfaceVariant,
            fontWeight: 500,
          }}
        >
          {status}
        </Typography>
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: 28,
            color: m3Tokens.onSurface,
            lineHeight: 1,
            fontWeight: 600,
          }}
        >
          {value}
        </Typography>
        <Box
          sx={{
            mt: 1.5,
            height: 6,
            width: '100%',
            bgcolor: m3Tokens.surfaceContainerHigh,
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: m3Tokens.primary,
              opacity: progressOpacity,
              width: `${progress}%`,
              borderRadius: 9999,
              transition: 'width 0.4s ease',
            }}
          />
        </Box>
      </Box>
    </Card>
  )
}

export function MetricsGrid() {
  const [cpuData, setCpuData] = useState<CPUInfoResponse | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchCpuMetrics = async () => {
      try {
        const token = getCookieToken()
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await fetch('/api/cpu', {
          headers,
          credentials: 'include',
        })

        if (!res.ok) {
          throw new Error('Failed to fetch CPU metrics')
        }

        const data: CPUInfoResponse = await res.json()
        if (isMounted) {
          setCpuData(data)
          setHasError(false)
        }
      } catch {
        if (isMounted) {
          setHasError(true)
        }
      }
    }

    fetchCpuMetrics()
    const interval = setInterval(fetchCpuMetrics, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const cpuStatus = hasError && !cpuData
    ? 'ERROR'
    : cpuData
      ? `${cpuData.logical_cores} CORES`
      : 'LOADING...'

  const cpuStatusColor = hasError && !cpuData ? m3Tokens.error : undefined

  const cpuValue = cpuData
    ? `${cpuData.usage_percent.toFixed(1)}%`
    : hasError
      ? 'N/A'
      : '--%'

  const cpuProgress = cpuData
    ? Math.min(100, Math.max(0, cpuData.usage_percent))
    : 0

  return (
    <Box
      component="section"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: 'repeat(4, 1fr)',
        },
        gap: 2,
      }}
    >
      <MetricCard
        title="ACTIVE INSTANCES"
        status="READY"
        statusColor={m3Tokens.primary}
        value="12 / 12"
        progress={100}
      />
      <MetricCard
        title="CPU LOAD"
        status={cpuStatus}
        statusColor={cpuStatusColor}
        value={cpuValue}
        progress={cpuProgress}
      />
      <MetricCard
        title="MEMORY FOOTPRINT"
        status="32 GB ALLOC"
        value="14.2 GB"
        progress={44}
        progressOpacity={0.75}
      />
      <MetricCard
        title="NETWORK I/O"
        status="NORMAL"
        statusColor={m3Tokens.primary}
        value="1.8 Gb/s"
        progress={32}
      />
    </Box>
  )
}

export default MetricsGrid
