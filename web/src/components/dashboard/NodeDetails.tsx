import { Box, Card, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'

export function NodeDetails() {
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
          Node Details
        </Typography>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '4px',
            bgcolor: m3Tokens.outlineVariant,
          }}
        />
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box
          sx={{
            p: 1.75,
            borderRadius: '12px',
            bgcolor: m3Tokens.surfaceContainerLow,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              height: 8,
              width: 64,
              bgcolor: m3Tokens.surfaceContainerHigh,
              borderRadius: '4px',
            }}
          />
          <Box
            sx={{
              height: 12,
              width: 128,
              bgcolor: m3Tokens.surfaceContainer,
              borderRadius: '4px',
            }}
          />
        </Box>

        <Box
          sx={{
            p: 1.75,
            borderRadius: '12px',
            bgcolor: m3Tokens.surfaceContainerLow,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              height: 8,
              width: 80,
              bgcolor: m3Tokens.surfaceContainerHigh,
              borderRadius: '4px',
            }}
          />
          <Box
            sx={{
              height: 12,
              width: 160,
              bgcolor: m3Tokens.surfaceContainer,
              borderRadius: '4px',
            }}
          />
        </Box>

        <Box
          sx={{
            p: 1.75,
            borderRadius: '12px',
            bgcolor: m3Tokens.surfaceContainerLow,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              height: 8,
              width: 96,
              bgcolor: m3Tokens.surfaceContainerHigh,
              borderRadius: '4px',
            }}
          />
          <Box
            sx={{
              height: 12,
              width: 112,
              bgcolor: m3Tokens.surfaceContainer,
              borderRadius: '4px',
            }}
          />
        </Box>
      </Box>
    </Card>
  )
}

export default NodeDetails
