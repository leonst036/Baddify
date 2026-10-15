import { Box } from '@mui/material'
import { m3Tokens } from '../../../theme/m3Tokens'

interface MetricProgressBarProps {
  progress: number
  height?: number
  color?: string
  opacity?: number
  trackColor?: string
}

export function MetricProgressBar({
  progress,
  height = 6,
  color = m3Tokens.primary,
  opacity = 1,
  trackColor = m3Tokens.surfaceContainerHigh,
}: MetricProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress))

  return (
    <Box
      sx={{
        height,
        width: '100%',
        bgcolor: trackColor,
        borderRadius: 9999,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: '100%',
          bgcolor: color,
          opacity,
          width: `${clampedProgress}%`,
          borderRadius: 9999,
          transition: 'width 0.4s ease',
        }}
      />
    </Box>
  )
}

export default MetricProgressBar
