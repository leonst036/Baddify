import { Box, Card, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'

export function WorkloadAllocations() {
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
      {/* Header Divider */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '4px',
              bgcolor: m3Tokens.primary,
            }}
          />
          <Typography
            sx={{
              fontSize: 13,
              color: m3Tokens.onSurface,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Workload Allocations
          </Typography>
        </Box>
        <Box
          sx={{
            height: 20,
            width: 96,
            bgcolor: m3Tokens.surfaceContainerHigh,
            borderRadius: 9999,
          }}
        />
      </Box>

      {/* Panel Body: Architectural Wireframe Slots */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Service Item Skeleton Frame 1 */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: m3Tokens.surfaceContainerLow,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: m3Tokens.primary,
                  borderRadius: '4px',
                  opacity: 0.8,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box
                sx={{
                  height: 14,
                  width: 144,
                  bgcolor: m3Tokens.surfaceContainerHigh,
                  borderRadius: '4px',
                }}
              />
              <Box
                sx={{
                  height: 10,
                  width: 208,
                  bgcolor: m3Tokens.surfaceContainer,
                  borderRadius: '4px',
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                height: 24,
                width: 64,
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                border: `1px solid ${m3Tokens.outlineVariant}`,
              }}
            />
            <Box
              sx={{
                height: 32,
                width: 80,
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                border: `1px solid ${m3Tokens.outlineVariant}`,
              }}
            />
          </Box>
        </Box>

        {/* Service Item Skeleton Frame 2 */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: m3Tokens.surfaceContainerLow,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: m3Tokens.primaryFixedDim,
                  borderRadius: '4px',
                  opacity: 0.8,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box
                sx={{
                  height: 14,
                  width: 176,
                  bgcolor: m3Tokens.surfaceContainerHigh,
                  borderRadius: '4px',
                }}
              />
              <Box
                sx={{
                  height: 10,
                  width: 192,
                  bgcolor: m3Tokens.surfaceContainer,
                  borderRadius: '4px',
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                height: 24,
                width: 64,
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                border: `1px solid ${m3Tokens.outlineVariant}`,
              }}
            />
            <Box
              sx={{
                height: 32,
                width: 80,
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                border: `1px solid ${m3Tokens.outlineVariant}`,
              }}
            />
          </Box>
        </Box>

        {/* Service Item Skeleton Frame 3 */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: m3Tokens.surfaceContainerLow,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: m3Tokens.tertiaryContainer,
                  borderRadius: '4px',
                  opacity: 0.8,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box
                sx={{
                  height: 14,
                  width: 128,
                  bgcolor: m3Tokens.surfaceContainerHigh,
                  borderRadius: '4px',
                }}
              />
              <Box
                sx={{
                  height: 10,
                  width: 240,
                  bgcolor: m3Tokens.surfaceContainer,
                  borderRadius: '4px',
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                height: 24,
                width: 64,
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                border: `1px solid ${m3Tokens.outlineVariant}`,
              }}
            />
            <Box
              sx={{
                height: 32,
                width: 80,
                bgcolor: m3Tokens.surfaceContainer,
                borderRadius: 9999,
                border: `1px solid ${m3Tokens.outlineVariant}`,
              }}
            />
          </Box>
        </Box>
      </Box>
    </Card>
  )
}

export default WorkloadAllocations
