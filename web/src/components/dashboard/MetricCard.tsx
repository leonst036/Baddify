import { Box, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'
import { DashboardCard, MetricProgressBar } from './shared'

export interface MetricCardProps {
  title: string
  status: string
  statusColor?: string
  value: string
  progress: number
  progressOpacity?: number
}

export function MetricCard({
  title,
  status,
  statusColor,
  value,
  progress,
  progressOpacity = 1,
}: MetricCardProps) {
  return (
    <DashboardCard
      sx={{
        p: 2.5,
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
        <Box sx={{ mt: 1.5 }}>
          <MetricProgressBar progress={progress} opacity={progressOpacity} />
        </Box>
      </Box>
    </DashboardCard>
  )
}

export default MetricCard
