import { Box, Chip, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import {
  Inventory2 as ContainerIcon,
  PlayArrow as PlayArrowIcon,
  RestartAlt as RestartIcon,
  Stop as StopIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'
import type { ContainerItem } from '../../api/types'

interface WorkloadRowProps {
  item: ContainerItem
  isPending: boolean
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void
}

export function WorkloadRow({ item, isPending, onAction }: WorkloadRowProps) {
  const isRunning = item.state === 'running'

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '12px',
        bgcolor: m3Tokens.surfaceContainerLow,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(208, 188, 255, 0.3)',
          bgcolor: 'rgba(29, 27, 33, 0.95)',
        },
      }}
    >
      {/* Left info block */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 240 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            bgcolor: m3Tokens.surfaceContainer,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <ContainerIcon sx={{ fontSize: 20, color: isRunning ? m3Tokens.primary : m3Tokens.outline }} />
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              position: 'absolute',
              bottom: -2,
              right: -2,
              bgcolor: isRunning ? '#81c784' : '#e57373',
              boxShadow: isRunning ? '0 0 6px #81c784' : 'none',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: m3Tokens.onSurface,
              }}
            >
              {item.name || item.short_id}
            </Typography>
            <Typography
              sx={{
                fontFamily: m3Tokens.fontCode,
                fontSize: 11,
                color: m3Tokens.onSurfaceVariant,
              }}
            >
              {item.short_id}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 11,
              color: m3Tokens.onSurfaceVariant,
              maxWidth: 280,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={item.image}
          >
            {item.image}
          </Typography>
        </Box>
      </Box>

      {/* Ports & Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {item.ports && item.ports.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {item.ports.slice(0, 2).map((p, idx) => (
              <Box
                key={idx}
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: '6px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  fontFamily: m3Tokens.fontCode,
                  fontSize: 10,
                  color: m3Tokens.onSurfaceVariant,
                }}
              >
                {p.public_port ? `${p.public_port}:${p.private_port}` : `${p.private_port}/${p.type}`}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            sx={{
              fontFamily: m3Tokens.fontCode,
              fontSize: 10,
              color: m3Tokens.outline,
            }}
          >
            no ports
          </Typography>
        )}

        <Chip
          size="small"
          label={item.state}
          sx={{
            height: 22,
            fontSize: 10,
            fontFamily: m3Tokens.fontCode,
            textTransform: 'uppercase',
            fontWeight: 600,
            bgcolor: isRunning ? 'rgba(129, 199, 132, 0.12)' : 'rgba(202, 196, 208, 0.08)',
            color: isRunning ? '#81c784' : m3Tokens.onSurfaceVariant,
            border: `1px solid ${isRunning ? 'rgba(129, 199, 132, 0.3)' : m3Tokens.outlineVariant}`,
          }}
        />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPending ? (
            <CircularProgress size={16} sx={{ color: m3Tokens.primary, mx: 1 }} />
          ) : (
            <>
              {isRunning ? (
                <Tooltip title="Stop container">
                  <IconButton
                    size="small"
                    onClick={() => onAction(item.id, 'stop')}
                    sx={{
                      color: '#e57373',
                      p: 0.6,
                      bgcolor: 'rgba(229, 115, 115, 0.08)',
                      '&:hover': { bgcolor: 'rgba(229, 115, 115, 0.2)' },
                    }}
                  >
                    <StopIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Start container">
                  <IconButton
                    size="small"
                    onClick={() => onAction(item.id, 'start')}
                    sx={{
                      color: '#81c784',
                      p: 0.6,
                      bgcolor: 'rgba(129, 199, 132, 0.08)',
                      '&:hover': { bgcolor: 'rgba(129, 199, 132, 0.2)' },
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Restart container">
                <IconButton
                  size="small"
                  onClick={() => onAction(item.id, 'restart')}
                  sx={{
                    color: m3Tokens.onSurfaceVariant,
                    p: 0.6,
                    bgcolor: m3Tokens.surfaceContainer,
                    border: `1px solid ${m3Tokens.outlineVariant}`,
                    '&:hover': { color: m3Tokens.primary, borderColor: m3Tokens.primary },
                  }}
                >
                  <RestartIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default WorkloadRow
