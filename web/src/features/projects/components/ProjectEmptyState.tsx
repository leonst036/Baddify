import { Button } from '@mui/material'
import {
  FolderOpenOutlined as FolderEmptyIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { EmptyState } from '@/shared'

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
      <EmptyState
        title="No matching projects found"
        description={`No projects match your filter "${searchQuery}".`}
        dashed={false}
        action={
          <Button
            variant="outlined"
            size="small"
            onClick={onClearFilter}
            sx={{ textTransform: 'none' }}
          >
            Clear Filter
          </Button>
        }
      />
    )
  }

  return (
    <EmptyState
      icon={<FolderEmptyIcon sx={{ fontSize: 32 }} />}
      title="No projects in MongoDB yet"
      description="Projects allow you to group deployments, environment variables, and resources together. Create your first project to get started."
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateProject}
          sx={{ textTransform: 'none', px: 3, py: 1 }}
        >
          Create Project
        </Button>
      }
    />
  )
}
