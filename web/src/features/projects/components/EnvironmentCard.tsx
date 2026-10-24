import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  LayersOutlined as LayersIcon,
  ArrowForward as ArrowForwardIcon,
  VpnKeyOutlined as KeyIcon,
  DeleteOutlined as DeleteIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import type { ProjectEnvironment } from '../EnviromentsView'

export interface EnvironmentCardProps {
  environment: ProjectEnvironment
  onSelect: (env: ProjectEnvironment) => void
  onOpenVariables: (env: ProjectEnvironment) => void
  onDelete: (envId: string) => void
}

export function EnvironmentCard({
  environment,
  onSelect,
  onOpenVariables,
  onDelete,
}: EnvironmentCardProps) {
  return (
    <Box
      onClick={() => onSelect(environment)}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 2,
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: m3Tokens.primary,
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
          bgcolor: m3Tokens.surfaceContainerHigh,
          '& .env-card-arrow': {
            transform: 'translateX(4px)',
            color: m3Tokens.primary,
          },
          '& .env-card-icon': {
            bgcolor: 'rgba(208, 188, 255, 0.16)',
            borderColor: 'rgba(208, 188, 255, 0.35)',
          },
        },
      }}
    >
      {/* Card Header: Icon, Name & Forward Arrow */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            className="env-card-icon"
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              border: `1px solid ${m3Tokens.outlineVariant}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: m3Tokens.surfaceContainerLow,
              transition: 'all 0.2s ease',
            }}
          >
            <LayersIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: m3Tokens.onSurface,
                letterSpacing: '-0.01em',
                textTransform: 'capitalize',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {environment.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: m3Tokens.onSurfaceVariant,
                fontFamily: m3Tokens.fontCode,
              }}
            >
              Updated {environment.updatedAt}
            </Typography>
          </Box>
        </Box>

        <ArrowForwardIcon
          className="env-card-arrow"
          sx={{
            fontSize: 18,
            color: m3Tokens.onSurfaceVariant,
            opacity: 0.7,
            transition: 'all 0.2s ease',
            mt: 0.5,
            flexShrink: 0,
          }}
        />
      </Box>

      {/* Card Footer: Variables button & Delete action */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pt: 1,
          borderTop: `1px solid ${m3Tokens.outlineVariant}`,
        }}
      >
        <Button
          size="small"
          startIcon={<KeyIcon sx={{ fontSize: 15 }} />}
          onClick={(e) => {
            e.stopPropagation()
            onOpenVariables(environment)
          }}
          sx={{
            fontSize: 12,
            fontFamily: m3Tokens.fontCode,
            textTransform: 'none',
            color: m3Tokens.primary,
            bgcolor: 'rgba(208, 188, 255, 0.06)',
            border: '1px solid rgba(208, 188, 255, 0.2)',
            borderRadius: '6px',
            px: 1.25,
            py: 0.5,
            '&:hover': {
              bgcolor: 'rgba(208, 188, 255, 0.12)',
              borderColor: m3Tokens.primary,
            },
          }}
        >
          {environment.variables.length} Variables
        </Button>

        <Tooltip title="Delete environment" arrow>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(environment.id)
            }}
            sx={{
              color: m3Tokens.onSurfaceVariant,
              borderRadius: '6px',
              '&:hover': {
                color: m3Tokens.error,
                bgcolor: 'rgba(255, 180, 171, 0.08)',
              },
            }}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
