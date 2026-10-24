import { Button } from '@mui/material'
import { Inventory2Outlined as ContainerIcon } from '@mui/icons-material'
import { EmptyState } from '@/shared'

export interface ContainerEmptyStateProps {
  hasContainers: boolean
  envName: string
  searchQuery: string
  onReset: () => void
}

export function ContainerEmptyState({
  hasContainers,
  envName,
  searchQuery,
  onReset,
}: ContainerEmptyStateProps) {
  return (
    <EmptyState
      icon={<ContainerIcon sx={{ fontSize: 32 }} />}
      title={!hasContainers ? 'No containers deployed' : 'No matching containers'}
      description={
        !hasContainers
          ? `No active containers were found in environment "${envName}". Deploy a container or check your Docker engine.`
          : `No containers matched your filter "${searchQuery}".`
      }
      action={
        <Button
          variant="outlined"
          size="small"
          onClick={onReset}
          sx={{ textTransform: 'none' }}
        >
          Reset Filters
        </Button>
      }
    />
  )
}
