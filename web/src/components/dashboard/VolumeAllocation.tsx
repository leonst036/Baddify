import { Box, Card, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'

export function VolumeAllocation() {
  return (
    <Card
      sx={{
        borderRadius: `${m3Tokens.cardRadius}px`,
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        boxShadow: m3Tokens.cardShadow,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'rgba(33, 31, 38, 0.6)',
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            color: m3Tokens.onSurface,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          Volume Allocation
        </Typography>
        <Typography
          sx={{
            fontFamily: m3Tokens.fontCode,
            fontSize: 11,
            color: m3Tokens.onSurfaceVariant,
            fontWeight: 500,
          }}
        >
          NVMe
        </Typography>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Volume 1 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: m3Tokens.fontCode,
              fontSize: 11,
              color: m3Tokens.onSurfaceVariant,
            }}
          >
            <span>/dev/nvme0n1p1</span>
            <span>412 / 1000 GB</span>
          </Box>
          <Box
            sx={{
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
                width: '41%',
                borderRadius: 9999,
                transition: 'width 0.4s ease',
              }}
            />
          </Box>
        </Box>

        {/* Volume 2 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: m3Tokens.fontCode,
              fontSize: 11,
              color: m3Tokens.onSurfaceVariant,
            }}
          >
            <span>/dev/nvme0n1p2 (Backups)</span>
            <span>128 / 500 GB</span>
          </Box>
          <Box
            sx={{
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
                opacity: 0.75,
                width: '25%',
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

export default VolumeAllocation
