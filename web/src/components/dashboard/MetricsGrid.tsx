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

interface RAMInfoResponse {
  total: number
  used: number
  available: number
  free: number
  used_percent: number
}

interface DiskIOResponse {
  read_bytes_per_sec: number
  write_bytes_per_sec: number
  total_read_bytes: number
  total_write_bytes: number
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`
  }
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

function formatRate(bytesPerSec?: number): string {
  if (bytesPerSec === undefined || bytesPerSec === null || isNaN(bytesPerSec)) return '-- B/s'
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
  const kb = bytesPerSec / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB/s`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB/s`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB/s`
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

interface DiskMetricCardProps {
  title: string
  status: string
  statusColor?: string
  readRate: string
  writeRate: string
  readProgress: number
  writeProgress: number
}

function DiskMetricCard({
  title,
  status,
  statusColor,
  readRate,
  writeRate,
  readProgress,
  writeProgress,
}: DiskMetricCardProps) {
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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          alignItems: 'flex-end',
        }}
      >
        {/* Read Half */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: m3Tokens.onSurfaceVariant,
              letterSpacing: '0.05em',
              mb: 0.5,
            }}
          >
            READ
          </Typography>
          <Typography
            sx={{
              fontSize: 18,
              color: m3Tokens.onSurface,
              lineHeight: 1.1,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {readRate}
          </Typography>
          <Box
            sx={{
              mt: 1,
              height: 5,
              width: '100%',
              bgcolor: m3Tokens.surfaceContainerHigh,
              borderRadius: 9999,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                bgcolor: m3Tokens.secondary,
                width: `${readProgress}%`,
                borderRadius: 9999,
                transition: 'width 0.4s ease',
              }}
            />
          </Box>
        </Box>

        {/* Write Half */}
        <Box sx={{ minWidth: 0, borderLeft: `1px solid ${m3Tokens.outlineVariant}`, pl: 2 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: m3Tokens.onSurfaceVariant,
              letterSpacing: '0.05em',
              mb: 0.5,
            }}
          >
            WRITE
          </Typography>
          <Typography
            sx={{
              fontSize: 18,
              color: m3Tokens.onSurface,
              lineHeight: 1.1,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {writeRate}
          </Typography>
          <Box
            sx={{
              mt: 1,
              height: 5,
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
                width: `${writeProgress}%`,
                borderRadius: 9999,
                transition: 'width 0.4s ease',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Card>
  )
}

export function MetricsGrid() {
  const [cpuData, setCpuData] = useState<CPUInfoResponse | null>(null)
  const [ramData, setRamData] = useState<RAMInfoResponse | null>(null)
  const [diskData, setDiskData] = useState<DiskIOResponse | null>(null)
  const [hasCpuError, setHasCpuError] = useState(false)
  const [hasRamError, setHasRamError] = useState(false)
  const [hasDiskError, setHasDiskError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchMetrics = async () => {
      const token = getCookieToken()
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const fetchCpu = async () => {
        try {
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
            setHasCpuError(false)
          }
        } catch {
          if (isMounted) {
            setHasCpuError(true)
          }
        }
      }

      const fetchRam = async () => {
        try {
          const res = await fetch('/api/ram', {
            headers,
            credentials: 'include',
          })
          if (!res.ok) {
            throw new Error('Failed to fetch RAM metrics')
          }
          const data: RAMInfoResponse = await res.json()
          if (isMounted) {
            setRamData(data)
            setHasRamError(false)
          }
        } catch {
          if (isMounted) {
            setHasRamError(true)
          }
        }
      }

      const fetchDisk = async () => {
        try {
          const res = await fetch('/api/disk-io', {
            headers,
            credentials: 'include',
          })
          if (!res.ok) {
            throw new Error('Failed to fetch Disk metrics')
          }
          const data: DiskIOResponse = await res.json()
          if (isMounted) {
            setDiskData(data)
            setHasDiskError(false)
          }
        } catch {
          if (isMounted) {
            setHasDiskError(true)
          }
        }
      }

      await Promise.all([fetchCpu(), fetchRam(), fetchDisk()])
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const cpuStatus = hasCpuError && !cpuData
    ? 'ERROR'
    : cpuData
      ? `${cpuData.logical_cores} CORES`
      : 'LOADING...'

  const cpuStatusColor = hasCpuError && !cpuData ? m3Tokens.error : undefined

  const cpuValue = cpuData
    ? `${cpuData.usage_percent.toFixed(1)}%`
    : hasCpuError
      ? 'N/A'
      : '--%'

  const cpuProgress = cpuData
    ? Math.min(100, Math.max(0, cpuData.usage_percent))
    : 0

  const ramStatus = hasRamError && !ramData
    ? 'ERROR'
    : ramData
      ? `${formatBytes(ramData.total)} ALLOC`
      : 'LOADING...'

  const ramStatusColor = hasRamError && !ramData ? m3Tokens.error : undefined

  const ramValue = ramData
    ? formatBytes(ramData.used)
    : hasRamError
      ? 'N/A'
      : '-- GB'

  const ramProgress = ramData
    ? Math.min(100, Math.max(0, ramData.used_percent))
    : 0

  const diskStatus = hasDiskError && !diskData
    ? 'ERROR'
    : diskData
      ? 'ONLINE'
      : 'LOADING...'

  const diskStatusColor = hasDiskError && !diskData
    ? m3Tokens.error
    : diskData
      ? m3Tokens.primary
      : undefined

  const calcRateProgress = (rate?: number) => {
    if (!rate || rate <= 0) return 0
    return Math.min(100, Math.max(8, (rate / (25 * 1024 * 1024)) * 100))
  }

  const readRate = diskData ? formatRate(diskData.read_bytes_per_sec) : hasDiskError ? 'N/A' : '-- B/s'
  const writeRate = diskData ? formatRate(diskData.write_bytes_per_sec) : hasDiskError ? 'N/A' : '-- B/s'
  const readProgress = calcRateProgress(diskData?.read_bytes_per_sec)
  const writeProgress = calcRateProgress(diskData?.write_bytes_per_sec)

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
        status={ramStatus}
        statusColor={ramStatusColor}
        value={ramValue}
        progress={ramProgress}
        progressOpacity={0.75}
      />
      <DiskMetricCard
        title="DISK I/O"
        status={diskStatus}
        statusColor={diskStatusColor}
        readRate={readRate}
        writeRate={writeRate}
        readProgress={readProgress}
        writeProgress={writeProgress}
      />
    </Box>
  )
}

export default MetricsGrid
