import { Button } from '@mui/material'
import { Add as AddIcon, LayersOutlined as LayersIcon } from '@mui/icons-material'
import { EmptyState } from '@/shared'

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
  if (searchQuery) {
    return (
      <EmptyState
        title="No environments found"
        description={`No environments match "${searchQuery}".`}
        dashed={false}
        action={
          <Button
            variant="outlined"
            size="small"
            onClick={onClearSearch}
            sx={{ textTransform: 'none' }}
          >
            Clear Search
          </Button>
        }
      />
    )
  }

  return (
    <EmptyState
      icon={<LayersIcon sx={{ fontSize: 32 }} />}
      title="No environments found"
      description="Create an environment to configure settings for this project."
      action={
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onCreateEnvironment}
          sx={{ textTransform: 'none' }}
        >
          Create Environment
        </Button>
      }
    />
  )
}
