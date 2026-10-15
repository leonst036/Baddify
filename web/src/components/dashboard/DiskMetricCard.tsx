import { Box, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'
import { DashboardCard, MetricProgressBar } from './shared'

export interface DiskMetricCardProps {
  title: string
  status: string
  statusColor?: string
  readRate: string
  writeRate: string
  readProgress: number
  writeProgress: number
}

export function DiskMetricCard({
  title,
  status,
  statusColor,
  readRate,
  writeRate,
  readProgress,
  writeProgress,
}: DiskMetricCardProps) {
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
          <Box sx={{ mt: 1 }}>
            <MetricProgressBar progress={readProgress} height={5} color={m3Tokens.secondary} />
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
          <Box sx={{ mt: 1 }}>
            <MetricProgressBar progress={writeProgress} height={5} color={m3Tokens.primary} />
          </Box>
        </Box>
      </Box>
    </DashboardCard>
  )
}

export default DiskMetricCard
