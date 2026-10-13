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
        status="8 CORES"
        value="24.6%"
        progress={24.6}
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
