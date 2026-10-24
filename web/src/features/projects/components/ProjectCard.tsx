import {
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  FolderOutlined as FolderIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon,
  Tag as TagIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import type { ProjectItem } from '../ProjectsView'

export interface ProjectCardProps {
  project: ProjectItem
  onSelect: (project: ProjectItem) => void
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Recently'
  }
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const hasDescription =
    Boolean(project.description) &&
    project.description?.trim().toLowerCase() !== 'no description'

  return (
    <Box
      onClick={() => onSelect(project)}
      sx={{
        p: 2.5,
        borderRadius: '14px',
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          borderColor: m3Tokens.primary,
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
          bgcolor: m3Tokens.surfaceContainerHigh,
          '& .project-card-arrow': {
            transform: 'translateX(4px)',
            color: m3Tokens.primary,
          },
          '& .project-card-icon': {
            bgcolor: 'rgba(208, 188, 255, 0.18)',
            borderColor: 'rgba(208, 188, 255, 0.4)',
          },
        },
      }}
    >
      {/* Header row: Icon, Name, Arrow */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            className="project-card-icon"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: 'rgba(208, 188, 255, 0.08)',
              border: '1px solid rgba(208, 188, 255, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: m3Tokens.primary,
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <FolderIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              title={project.name}
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: m3Tokens.onSurface,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {project.name}
            </Typography>
          </Box>
        </Box>

        <ArrowForwardIcon
          className="project-card-arrow"
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

      {/* Description Body */}
      <Typography
        sx={{
          fontSize: 13,
          color: hasDescription ? m3Tokens.onSurfaceVariant : m3Tokens.outline,
          fontStyle: hasDescription ? 'normal' : 'italic',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 38,
        }}
      >
        {hasDescription ? project.description : 'No description provided.'}
      </Typography>

      {/* Divider */}
      <Box
        sx={{
          height: '1px',
          bgcolor: 'rgba(202, 196, 208, 0.08)',
          width: '100%',
        }}
      />

      {/* Footer metadata chips */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          fontSize: 12,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {project.uuid && (
            <Tooltip title={`Project UUID: ${project.uuid}`} arrow>
              <Chip
                icon={<TagIcon sx={{ fontSize: '12px !important' }} />}
                label={project.uuid.slice(0, 8)}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontFamily: m3Tokens.fontCode,
                  bgcolor: 'rgba(208, 188, 255, 0.08)',
                  color: m3Tokens.primary,
                  border: '1px solid rgba(208, 188, 255, 0.2)',
                  '& .MuiChip-icon': {
                    color: m3Tokens.primary,
                  },
                }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Created timestamp */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: m3Tokens.onSurfaceVariant,
            fontSize: 11,
            fontFamily: m3Tokens.fontCode,
            opacity: 0.8,
          }}
        >
          <TimeIcon sx={{ fontSize: 13 }} />
          <Typography component="span" sx={{ fontSize: 11, fontFamily: m3Tokens.fontCode }}>
            {formatDate(project.created_at)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
