import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Button,
  Typography,
  Chip,
  Skeleton,
  Alert,
  Tooltip,
} from '@mui/material'
import {
  FolderOutlined as FolderIcon,
  FolderOpenOutlined as FolderEmptyIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Tag as TagIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../../theme/m3Tokens'
import { Footer } from '../../footer/footer'
import { NewProjects } from '../../projects/NewProjects'
import { ProjectsHeader } from './ProjectsHeader'
import { getAuthHeaders } from '../../../api/client'

export interface ProjectItem {
  id: string
  uuid?: string
  user_uuid?: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

interface ProjectsViewProps {
  isCreating?: boolean
  onToggleCreating?: (creating: boolean) => void
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

export function ProjectsView({
  isCreating: externalIsCreating,
  onToggleCreating,
}: ProjectsViewProps = {}) {
  const [internalIsCreating, setInternalIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCreating = externalIsCreating !== undefined ? externalIsCreating : internalIsCreating
  const setIsCreating = onToggleCreating || setInternalIsCreating

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
    fetchProjects()
  }, [fetchProjects])

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
          fetchProjects(true)
        }}
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
        onRefresh={() => fetchProjects(true)}
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
              onClick={() => fetchProjects(true)}
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

      {/* Empty State: No projects created yet */}
      {!isLoading && !error && projects.length === 0 && (
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
            onClick={() => setIsCreating(true)}
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
      )}

      {/* Empty Filtered State */}
      {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && (
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
            onClick={() => setSearchQuery('')}
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
          {filteredProjects.map((project) => {
            const hasDescription =
              Boolean(project.description) &&
              project.description?.trim().toLowerCase() !== 'no description'

            return (
              <Box
                key={project.id || project.name}
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
                {/* Header row: Icon, Name, Status, Arrow */}
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

                  {/* Forward arrow icon */}
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

                {/* Footer metadata chips*/}
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

                    {/* Project UUID badge */}
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
          })}
        </Box>
      )}

      <Footer />
    </Box>
  )
}

export default ProjectsView
