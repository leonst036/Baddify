import { Box, Button, Typography } from '@mui/material'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { m3Tokens } from '../../../theme/m3Tokens'

interface ProjectsHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onNewProject?: () => void
}

export function ProjectsHeader({
  searchQuery,
  onSearchChange,
  onNewProject,
}: ProjectsHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1.5,
        borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
        flexWrap: 'wrap',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: 28,
            fontWeight: 600,
            color: m3Tokens.onSurface,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Projects
        </Typography>
        <Typography
          component="p"
          sx={{
            fontFamily: m3Tokens.fontCode,
            fontSize: 12,
            color: m3Tokens.onSurfaceVariant,
            m: 0,
          }}
        >
          Manage application projects, environments and deployments
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Search input */}
        <Box
          sx={{
            height: 38,
            px: 1.75,
            bgcolor: m3Tokens.surfaceContainer,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            transition: 'border-color 0.2s',
            '&:focus-within': {
              borderColor: m3Tokens.primary,
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: m3Tokens.onSurfaceVariant, opacity: 0.8 }} />
          <Box
            component="input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter projects..."
            sx={{
              border: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              color: m3Tokens.onSurface,
              fontFamily: m3Tokens.fontSans,
              fontSize: 13,
              width: 140,
              '&::placeholder': {
                color: m3Tokens.onSurfaceVariant,
                opacity: 0.6,
              },
            }}
          />
        </Box>

        {/* New Project Action */}
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={onNewProject}
          sx={{
            height: 38,
            px: 2,
            borderRadius: '8px',
            bgcolor: m3Tokens.primary,
            color: m3Tokens.onPrimary,
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: m3Tokens.primary,
              opacity: 0.95,
              boxShadow: `0 0 12px ${m3Tokens.primary}`,
            },
          }}
        >
          New Project
        </Button>
      </Box>
    </Box>
  )
}

export default ProjectsHeader
