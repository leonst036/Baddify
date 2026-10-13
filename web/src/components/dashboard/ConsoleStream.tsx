import { Box, Card, Typography } from '@mui/material'
import { Terminal as TerminalIcon } from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'

export function ConsoleStream() {
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
          py: 1.5,
          borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'rgba(33, 31, 38, 0.6)',
          fontFamily: m3Tokens.fontCode,
          fontSize: 11,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon sx={{ fontSize: 14, color: m3Tokens.primary }} />
          <Typography
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 11,
              color: m3Tokens.onSurfaceVariant,
              letterSpacing: '0.08em',
            }}
          >
            RUNTIME CONSOLE STREAM
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: m3Tokens.outlineVariant,
            }}
          />
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: m3Tokens.outlineVariant,
            }}
          />
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: m3Tokens.outlineVariant,
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          p: 3,
          fontFamily: m3Tokens.fontCode,
          fontSize: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          color: m3Tokens.onSurfaceVariant,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              color: m3Tokens.outline,
            }}
          >
            00:00:01
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              color: m3Tokens.primary,
              fontWeight: 500,
            }}
          >
            [daemon]
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
            }}
          >
            Container runtime synced with kernel space.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              color: m3Tokens.outline,
            }}
          >
            00:00:04
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              color: m3Tokens.primary,
              fontWeight: 500,
            }}
          >
            [ingress]
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
            }}
          >
            Listening for edge traffic on 0.0.0.0:443 (HTTP/3 enabled).
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              color: m3Tokens.outline,
            }}
          >
            00:00:09
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              color: m3Tokens.onSurface,
              fontWeight: 500,
            }}
          >
            [cluster]
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
            }}
          >
            Telemetry stream ready. Watching 12 pods.
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}

export default ConsoleStream
