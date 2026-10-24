import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Button,
  Skeleton,
  Alert,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import { Footer } from '@/components/common'
import { NewProjects } from './NewProjects'
import { EnviromentsView } from './enviroments/EnviromentsView'
import { getAuthHeaders } from '@/api/client'
import { ProjectsHeader } from './components/ProjectsHeader'
import { ProjectCard } from './components/ProjectCard'
import { ProjectEmptyState } from './components/ProjectEmptyState'
import type { ProjectItem } from './types'

export type { ProjectItem }

interface ProjectsViewProps {
  isCreating?: boolean
  onToggleCreating?: (creating: boolean) => void
  selectedProject?: ProjectItem | null
  onSelectProject?: (project: ProjectItem | null) => void
}

export function ProjectsView({
  isCreating: externalIsCreating,
  onToggleCreating,
  selectedProject: externalSelectedProject,
  onSelectProject,
}: ProjectsViewProps = {}) {
  const [internalIsCreating, setInternalIsCreating] = useState(false)
  const [internalSelectedProject, setInternalSelectedProject] = useState<ProjectItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCreating = externalIsCreating !== undefined ? externalIsCreating : internalIsCreating
  const setIsCreating = onToggleCreating || setInternalIsCreating

  const selectedProject =
    externalSelectedProject !== undefined ? externalSelectedProject : internalSelectedProject
  const setSelectedProject = onSelectProject || setInternalSelectedProject

  const fetchProjects = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const res = await fetch('/api/projects', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`Failed to load projects (${res.status})`)
      }

      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(msg)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const loadInitial = async () => {
      try {
        const res = await fetch('/api/projects', {
          headers: getAuthHeaders(),
          credentials: 'include',
        })
        if (!res.ok) {
          throw new Error(`Failed to load projects (${res.status})`)
        }
        const data = await res.json()
        if (isMounted) {
          setProjects(Array.isArray(data) ? data : [])
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch projects'
          setError(msg)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitial()
    return () => {
      isMounted = false
    }
  }, [])

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.user_uuid && p.user_uuid.toLowerCase().includes(query)) ||
        (p.uuid && p.uuid.toLowerCase().includes(query))
    )
  }, [projects, searchQuery])

  if (isCreating) {
    return (
      <NewProjects
        onBack={() => {
          setIsCreating(false)
          void fetchProjects(true)
        }}
      />
    )
  }

  if (selectedProject) {
    return (
      <EnviromentsView
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
      <ProjectsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewProject={() => setIsCreating(true)}
        projectCount={isLoading ? undefined : projects.length}
        onRefresh={() => void fetchProjects(true)}
        isRefreshing={isRefreshing}
      />

      {/* Error state */}
      {error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void fetchProjects(true)}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
          sx={{
            bgcolor: 'rgba(255, 180, 171, 0.1)',
            color: m3Tokens.error,
            border: `1px solid ${m3Tokens.errorContainer}`,
            borderRadius: '8px',
          }}
        >
          {error}
        </Alert>
      )}

      {/* Loading Skeleton Grid */}
      {isLoading && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(320px, 1fr))',
            },
            gap: 2.5,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box
              key={i}
              sx={{
                p: 2.5,
                borderRadius: '14px',
                bgcolor: m3Tokens.surfaceContainer,
                border: `1px solid ${m3Tokens.outlineVariant}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton
                  variant="rounded"
                  width={42}
                  height={42}
                  sx={{ borderRadius: '10px', bgcolor: m3Tokens.surfaceContainerHigh }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={24}
                    sx={{ bgcolor: m3Tokens.surfaceContainerHigh }}
                  />
                  <Skeleton
                    variant="text"
                    width="30%"
                    height={16}
                    sx={{ bgcolor: m3Tokens.surfaceContainerHigh }}
                  />
                </Box>
              </Box>
              <Skeleton
                variant="rectangular"
                height={36}
                sx={{ borderRadius: '6px', bgcolor: m3Tokens.surfaceContainerHigh }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={22}
                  sx={{ borderRadius: '12px', bgcolor: m3Tokens.surfaceContainerHigh }}
                />
                <Skeleton
                  variant="text"
                  width={60}
                  height={18}
                  sx={{ bgcolor: m3Tokens.surfaceContainerHigh }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty States */}
      {!isLoading && !error && filteredProjects.length === 0 && (
        <ProjectEmptyState
          hasProjects={projects.length > 0}
          searchQuery={searchQuery}
          onClearFilter={() => setSearchQuery('')}
          onCreateProject={() => setIsCreating(true)}
        />
      )}

      {/* Projects Grid */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(320px, 1fr))',
            },
            gap: 2.5,
          }}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id || project.name}
              project={project}
              onSelect={setSelectedProject}
            />
          ))}
        </Box>
      )}

      <Footer />
    </Box>
  )
}

export default ProjectsView
