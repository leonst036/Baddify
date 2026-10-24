import { Box, Button, Typography } from '@mui/material'
import {
  FolderOpenOutlined as FolderEmptyIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface ProjectEmptyStateProps {
  hasProjects: boolean
  searchQuery: string
  onClearFilter: () => void
  onCreateProject: () => void
}

export function ProjectEmptyState({
  hasProjects,
  searchQuery,
  onClearFilter,
  onCreateProject,
}: ProjectEmptyStateProps) {
  if (hasProjects) {
    return (
      <Box
        sx={{
          py: 6,
          px: 3,
          borderRadius: '14px',
          bgcolor: m3Tokens.surfaceContainer,
          border: `1px solid ${m3Tokens.outlineVariant}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
          No matching projects found
        </Typography>
        <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant }}>
          No projects match your filter "{searchQuery}".
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onClearFilter}
          sx={{
            mt: 1,
            borderColor: m3Tokens.outlineVariant,
            color: m3Tokens.primary,
            textTransform: 'none',
            '&:hover': {
              borderColor: m3Tokens.primary,
            },
          }}
        >
          Clear Filter
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        py: 8,
        px: 4,
        borderRadius: '16px',
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px dashed ${m3Tokens.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        my: 'auto',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          bgcolor: 'rgba(208, 188, 255, 0.08)',
          border: `1px solid ${m3Tokens.outlineVariant}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: m3Tokens.primary,
          mb: 1,
        }}
      >
        <FolderEmptyIcon sx={{ fontSize: 32 }} />
      </Box>
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 600,
          color: m3Tokens.onSurface,
          letterSpacing: '-0.01em',
        }}
      >
        No projects in MongoDB yet
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          color: m3Tokens.onSurfaceVariant,
          maxWidth: 420,
          lineHeight: 1.5,
        }}
      >
        Projects allow you to group deployments, environment variables, and resources together.
        Create your first project to get started.
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateProject}
        sx={{
          mt: 1,
          px: 3,
          py: 1,
          borderRadius: '8px',
          bgcolor: m3Tokens.primary,
          color: m3Tokens.onPrimary,
          fontWeight: 600,
          textTransform: 'none',
          fontSize: 13,
          boxShadow: 'none',
          '&:hover': {
            bgcolor: m3Tokens.primary,
            opacity: 0.95,
            boxShadow: `0 0 16px ${m3Tokens.primary}`,
          },
        }}
      >
        Create Project
      </Button>
    </Box>
  )
}
