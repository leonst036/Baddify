import { Box } from '@mui/material'
import { m3Tokens } from '../../../theme/m3Tokens'
import { formatBytes, formatRate } from '../../../utils/formatters'
import { useTelemetry, type TelemetryState } from '../../../hooks/useTelemetry'
import { MetricCard } from './MetricCard'
import { DiskMetricCard } from './DiskMetricCard'

interface MetricsGridProps {
  telemetry?: TelemetryState
}

export function MetricsGrid({ telemetry: externalTelemetry }: MetricsGridProps = {}) {
  const localTelemetry = useTelemetry()
  const {
    cpuData,
    ramData,
    diskData,
    instancesData,
    hasCpuError,
    hasRamError,
    hasDiskError,
    hasInstancesError,
  } = externalTelemetry || localTelemetry

  const instancesStatus = hasInstancesError && !instancesData
    ? 'ERROR'
    : instancesData
      ? instancesData.total === 0
        ? 'NO INSTANCES'
        : instancesData.running === instancesData.total
          ? 'READY'
          : `${instancesData.stopped} STOPPED`
      : 'LOADING...'

  const instancesStatusColor = hasInstancesError && !instancesData
    ? m3Tokens.error
    : instancesData && instancesData.stopped > 0
      ? m3Tokens.secondary
      : m3Tokens.primary

  const instancesValue = instancesData
    ? `${instancesData.running} / ${instancesData.total}`
    : hasInstancesError
      ? 'N/A'
      : '-- / --'

  const instancesProgress = instancesData && instancesData.total > 0
    ? Math.min(100, Math.max(0, (instancesData.running / instancesData.total) * 100))
    : 0

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
  const cpuProgress = cpuData ? Math.min(100, Math.max(0, cpuData.usage_percent)) : 0

  const ramStatus = hasRamError && !ramData
    ? 'ERROR'
    : ramData
      ? `${formatBytes(ramData.total)} ALLOC`
      : 'LOADING...'

  const ramStatusColor = hasRamError && !ramData ? m3Tokens.error : undefined
  const ramValue = ramData ? formatBytes(ramData.used) : hasRamError ? 'N/A' : '-- GB'
  const ramProgress = ramData ? Math.min(100, Math.max(0, ramData.used_percent)) : 0

  const diskStatus = hasDiskError && !diskData ? 'ERROR' : diskData ? 'ONLINE' : 'LOADING...'
  const diskStatusColor = hasDiskError && !diskData ? m3Tokens.error : diskData ? m3Tokens.primary : undefined

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
        status={instancesStatus}
        statusColor={instancesStatusColor}
        value={instancesValue}
        progress={instancesProgress}
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
