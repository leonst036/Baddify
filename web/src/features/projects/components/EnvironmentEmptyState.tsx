import { Box, Button, Typography } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface EnvironmentEmptyStateProps {
  searchQuery: string
  onClearSearch: () => void
  onCreateEnvironment: () => void
}

export function EnvironmentEmptyState({
  searchQuery,
  onClearSearch,
  onCreateEnvironment,
}: EnvironmentEmptyStateProps) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        borderRadius: '14px',
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px dashed ${m3Tokens.outlineVariant}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
        No environments found
      </Typography>
      <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, maxWidth: 360 }}>
        {searchQuery
          ? `No environments match "${searchQuery}".`
          : 'Create an environment to configure settings for this project.'}
      </Typography>
      {searchQuery ? (
        <Button
          variant="outlined"
          size="small"
          onClick={onClearSearch}
          sx={{
            mt: 1,
            borderColor: m3Tokens.outlineVariant,
            color: m3Tokens.primary,
            textTransform: 'none',
          }}
        >
          Clear Search
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onCreateEnvironment}
          sx={{
            mt: 1,
            bgcolor: m3Tokens.primary,
            color: m3Tokens.onPrimary,
            textTransform: 'none',
          }}
        >
          Create Environment
        </Button>
      )}
    </Box>
  )
}
