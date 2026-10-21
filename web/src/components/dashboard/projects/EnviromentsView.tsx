import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  VpnKeyOutlined as KeyIcon,
  LayersOutlined as LayersIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  Close as CloseIcon,
  DeleteOutlined as DeleteIcon,
  FolderOutlined as FolderIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../../theme/m3Tokens'
import { Footer } from '../../footer/footer'
import { getAuthHeaders } from '../../../api/client'
import type { ProjectItem } from './ProjectsView'
import { CreateEnvironmentPage } from './CreateEnviroment'
import type { NewEnvironmentData } from './CreateEnviroment'

export interface EnvVariable {
  key: string
  value: string
  isSecret?: boolean
}

export interface ProjectEnvironment {
  id: string
  uuid?: string
  name: string
  updatedAt: string
  variables: EnvVariable[]
  description: string
}

interface EnviromentsViewProps {
  project?: ProjectItem | null
  onBack?: () => void
}

export function EnviromentsView({ project, onBack }: EnviromentsViewProps) {
  const currentProjectName = project?.name || 'Default Project'
  const projectId = project?.uuid || project?.id || project?.name

  const [environments, setEnvironments] = useState<ProjectEnvironment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const fetchEnvironments = useCallback(async (isManualRefresh = false) => {
    if (!projectId) {
      setEnvironments([])
      setIsLoading(false)
      return
    }

    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/environments`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`Failed to load environments (${res.status})`)
      }

      const data = await res.json()
      const normalized: ProjectEnvironment[] = (Array.isArray(data) ? data : []).map(
        (e: Partial<ProjectEnvironment>) => ({
          id: e.id || e.uuid || `env-${Math.random().toString(36).substring(2, 9)}`,
          name: e.name || 'unnamed',
          updatedAt: e.updatedAt || 'Recently',
          variables: Array.isArray(e.variables) ? e.variables : [],
          description: e.description || '',
        })
      )
      setEnvironments(normalized)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch environments'
      setError(msg)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [projectId])

  useEffect(() => {
    void fetchEnvironments(false)
  }, [fetchEnvironments])

  // Variables modal state
  const [activeEnvForVars, setActiveEnvForVars] = useState<ProjectEnvironment | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarValue, setNewVarValue] = useState('')
  const [newVarIsSecret, setNewVarIsSecret] = useState(false)

  // Create environment page state
  const [isCreating, setIsCreating] = useState(false)

  // Filter environments by search query
  const filteredEnvironments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return environments
    return environments.filter((env) => env.name.toLowerCase().includes(q))
  }, [environments, searchQuery])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback(`${label} copied to clipboard!`)
    setTimeout(() => setCopyFeedback(null), 3000)
  }

  const handleRefresh = () => {
    void fetchEnvironments(true)
  }

  // Toggle variable secret visibility
  const toggleRevealSecret = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Add variable to current environment
  const handleAddVariable = () => {
    if (!activeEnvForVars || !newVarKey.trim()) return

    const trimmedKey = newVarKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    const trimmedVal = newVarValue.trim()

    const updatedVars = [
      ...activeEnvForVars.variables.filter((v) => v.key !== trimmedKey),
      { key: trimmedKey, value: trimmedVal, isSecret: newVarIsSecret },
    ]

    setEnvironments((prev) =>
      prev.map((e) => (e.id === activeEnvForVars.id ? { ...e, variables: updatedVars } : e))
    )

    setActiveEnvForVars((prev) => (prev ? { ...prev, variables: updatedVars } : null))
    setNewVarKey('')
    setNewVarValue('')
    setNewVarIsSecret(false)
  }

  // Delete variable from current environment
  const handleDeleteVariable = (keyToDelete: string) => {
    if (!activeEnvForVars) return
    const updatedVars = activeEnvForVars.variables.filter((v) => v.key !== keyToDelete)

    setEnvironments((prev) =>
      prev.map((e) => (e.id === activeEnvForVars.id ? { ...e, variables: updatedVars } : e))
    )
    setActiveEnvForVars((prev) => (prev ? { ...prev, variables: updatedVars } : null))
  }

  // Create new environment
  const handleCreateEnvironment = (data: NewEnvironmentData) => {
    const newEnv: ProjectEnvironment = {
      id: `env-${Date.now()}`,
      name: data.name,
      updatedAt: 'Just now',
      variables: data.variables,
      description: data.description,
    }

    setEnvironments((prev) => [...prev, newEnv])
    setIsCreating(false)
  }

  // Delete environment
  const handleDeleteEnvironment = (envId: string) => {
    if (confirm('Are you sure you want to delete this environment?')) {
      setEnvironments((prev) => prev.filter((e) => e.id !== envId))
      if (activeEnvForVars?.id === envId) {
        setActiveEnvForVars(null)
      }
    }
  }

  if (isCreating) {
    return (
      <CreateEnvironmentPage
        projectName={currentProjectName}
        existingNames={environments.map((e) => e.name)}
        onBack={() => setIsCreating(false)}
        onCreate={handleCreateEnvironment}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
      {/* Top Header Row with Navigation, Breadcrumbs and Actions */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {onBack && (
            <IconButton
              onClick={onBack}
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                border: `1px solid ${m3Tokens.outlineVariant}`,
                bgcolor: m3Tokens.surfaceContainer,
                color: m3Tokens.onSurface,
                '&:hover': {
                  bgcolor: m3Tokens.surfaceContainerHigh,
                  borderColor: m3Tokens.primary,
                  color: m3Tokens.primary,
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: 26,
                  fontWeight: 600,
                  color: m3Tokens.onSurface,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Environments
              </Typography>

              {/* Project Badge */}
              <Box
                sx={{
                  px: 1.25,
                  py: 0.35,
                  borderRadius: '12px',
                  bgcolor: 'rgba(208, 188, 255, 0.08)',
                  border: `1px solid rgba(208, 188, 255, 0.25)`,
                  fontSize: 12,
                  fontFamily: m3Tokens.fontCode,
                  color: m3Tokens.primary,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                <FolderIcon sx={{ fontSize: 14 }} />
                {currentProjectName}
              </Box>

              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: '12px',
                  bgcolor: m3Tokens.surfaceContainerHigh,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  fontSize: 12,
                  fontFamily: m3Tokens.fontCode,
                  color: m3Tokens.onSurfaceVariant,
                  fontWeight: 600,
                }}
              >
                {environments.length} total
              </Box>
            </Box>

            <Typography
              component="p"
              sx={{
                fontFamily: m3Tokens.fontCode,
                fontSize: 12,
                color: m3Tokens.onSurfaceVariant,
                m: 0,
              }}
            >
              Manage environment settings and variables
            </Typography>
          </Box>
        </Box>

        {/* Right Action Header Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Search Bar */}
          <Box
            sx={{
              height: 38,
              px: 1.5,
              bgcolor: m3Tokens.surfaceContainer,
              border: `1px solid ${m3Tokens.outlineVariant}`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Filter environments..."
              sx={{
                border: 'none',
                outline: 'none',
                bgcolor: 'transparent',
                color: m3Tokens.onSurface,
                fontSize: 13,
                fontFamily: m3Tokens.fontSans,
                width: 170,
                '&::placeholder': {
                  color: m3Tokens.onSurfaceVariant,
                  opacity: 0.6,
                },
              }}
            />
          </Box>

          {/* Refresh Button */}
          <IconButton
            onClick={handleRefresh}
            title="Refresh environments"
            sx={{
              width: 38,
              height: 38,
              borderRadius: '6px',
              border: `1px solid ${m3Tokens.outlineVariant}`,
              bgcolor: m3Tokens.surfaceContainer,
              color: m3Tokens.onSurfaceVariant,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: m3Tokens.primary,
                color: m3Tokens.primary,
                bgcolor: m3Tokens.surfaceContainerHigh,
              },
            }}
          >
            <RefreshIcon
              sx={{
                fontSize: 18,
                animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
                '@keyframes spin': {
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </IconButton>

          {/* New Environment Action Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={() => setIsCreating(true)}
            sx={{
              height: 38,
              px: 2,
              borderRadius: '6px',
              bgcolor: m3Tokens.primary,
              color: m3Tokens.onPrimary,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: 13,
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: m3Tokens.primary,
                opacity: 0.95,
                boxShadow: `0 0 16px ${m3Tokens.primary}`,
              },
            }}
          >
            New Environment
          </Button>
        </Box>
      </Box>

      {/* Toast Feedback Alert */}
      {copyFeedback && (
        <Alert
          severity="success"
          sx={{
            bgcolor: 'rgba(208, 188, 255, 0.1)',
            color: m3Tokens.primary,
            border: `1px solid rgba(208, 188, 255, 0.3)`,
            borderRadius: '8px',
            py: 0.5,
          }}
        >
          {copyFeedback}
        </Alert>
      )}

      {/* Error Feedback Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            bgcolor: 'rgba(255, 180, 171, 0.1)',
            color: '#FFB4AB',
            border: '1px solid rgba(255, 180, 171, 0.3)',
            borderRadius: '8px',
            py: 0.5,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Environments Grid */}
      {isLoading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(auto-fill, minmax(380px, 1fr))',
            },
            gap: 2.5,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: m3Tokens.surfaceContainer,
                border: `1px solid ${m3Tokens.outlineVariant}`,
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={30} sx={{ color: m3Tokens.primary }} />
            </Box>
          ))}
        </Box>
      ) : filteredEnvironments.length === 0 ? (
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
              onClick={() => setSearchQuery('')}
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
              onClick={() => setIsCreating(true)}
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
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(auto-fill, minmax(380px, 1fr))',
            },
            gap: 2.5,
          }}
        >
          {filteredEnvironments.map((env) => (
            <Box
              key={env.id}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: m3Tokens.surfaceContainer,
                border: `1px solid ${m3Tokens.outlineVariant}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 2,
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: m3Tokens.primary,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                  bgcolor: m3Tokens.surfaceContainerHigh,
                },
              }}
            >
              {/* Card Header: Icon & Name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
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
                    {env.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: m3Tokens.onSurfaceVariant,
                      fontFamily: m3Tokens.fontCode,
                    }}
                  >
                    Updated {env.updatedAt}
                  </Typography>
                </Box>
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
                  onClick={() => setActiveEnvForVars(env)}
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
                  {env.variables.length} Variables
                </Button>

                <Tooltip title="Delete environment" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteEnvironment(env.id)}
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
          ))}
        </Box>
      )}

      {/* Environment Variables Modal */}
      <Dialog
        open={Boolean(activeEnvForVars)}
        onClose={() => setActiveEnvForVars(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: m3Tokens.surfaceContainer,
              border: `1px solid ${m3Tokens.outlineVariant}`,
              borderRadius: '16px',
              color: m3Tokens.onSurface,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <KeyIcon sx={{ color: m3Tokens.primary, fontSize: 22 }} />
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: m3Tokens.onSurface }}>
                Environment Variables
              </Typography>
              <Typography sx={{ fontSize: 12, color: m3Tokens.outline, fontFamily: m3Tokens.fontCode }}>
                {activeEnvForVars?.name.toUpperCase()} environment
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setActiveEnvForVars(null)}
            sx={{ color: m3Tokens.onSurfaceVariant }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
          {/* Add New Variable inline form */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: m3Tokens.surfaceContainerLow,
              border: `1px solid ${m3Tokens.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: m3Tokens.onSurface }}>
              Add Variable
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' },
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              <TextField
                size="small"
                placeholder="KEY (e.g. API_SECRET)"
                value={newVarKey}
                onChange={(e) => setNewVarKey(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: m3Tokens.surfaceContainer,
                    fontSize: 12,
                    fontFamily: m3Tokens.fontCode,
                    '& fieldset': { borderColor: m3Tokens.outlineVariant },
                    '&:hover fieldset': { borderColor: m3Tokens.outline },
                    '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
                  },
                }}
              />

              <TextField
                size="small"
                placeholder="VALUE"
                type={newVarIsSecret ? 'password' : 'text'}
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: m3Tokens.surfaceContainer,
                    fontSize: 12,
                    fontFamily: m3Tokens.fontCode,
                    '& fieldset': { borderColor: m3Tokens.outlineVariant },
                    '&:hover fieldset': { borderColor: m3Tokens.outline },
                    '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
                  },
                }}
              />

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                disabled={!newVarKey.trim()}
                onClick={handleAddVariable}
                sx={{
                  height: 38,
                  bgcolor: m3Tokens.primary,
                  color: m3Tokens.onPrimary,
                  textTransform: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  '&:hover': { bgcolor: m3Tokens.primary, opacity: 0.9 },
                }}
              >
                Add
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setNewVarIsSecret((prev) => !prev)}
                sx={{
                  fontSize: 11,
                  fontFamily: m3Tokens.fontCode,
                  color: newVarIsSecret ? m3Tokens.primary : m3Tokens.outline,
                  textTransform: 'none',
                }}
              >
                {newVarIsSecret ? '🔒 Secret Enabled' : '🔓 Plaintext'}
              </Button>
            </Box>
          </Box>

          {/* List of current variables */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: m3Tokens.onSurfaceVariant }}>
              Configured Variables ({activeEnvForVars?.variables.length || 0})
            </Typography>

            {activeEnvForVars?.variables.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: m3Tokens.outline, py: 2 }}>
                No environment variables configured yet.
              </Typography>
            ) : (
              activeEnvForVars?.variables.map((v) => {
                const isRevealed = revealedKeys[v.key]

                return (
                  <Box
                    key={v.key}
                    sx={{
                      p: 1.25,
                      px: 2,
                      borderRadius: '8px',
                      bgcolor: m3Tokens.surfaceContainerLow,
                      border: `1px solid ${m3Tokens.outlineVariant}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontFamily: m3Tokens.fontCode,
                          fontWeight: 600,
                          color: m3Tokens.primary,
                          minWidth: 140,
                        }}
                      >
                        {v.key}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          fontFamily: m3Tokens.fontCode,
                          color: m3Tokens.onSurface,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {v.isSecret && !isRevealed ? '••••••••••••••••' : v.value || '""'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      {v.isSecret && (
                        <Tooltip title={isRevealed ? 'Hide value' : 'Show secret'} arrow>
                          <IconButton
                            size="small"
                            onClick={() => toggleRevealSecret(v.key)}
                            sx={{ color: m3Tokens.onSurfaceVariant }}
                          >
                            {isRevealed ? (
                              <VisibilityOffIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Copy value" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(v.value, v.key)}
                          sx={{ color: m3Tokens.onSurfaceVariant }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete variable" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteVariable(v.key)}
                          sx={{
                            color: m3Tokens.onSurfaceVariant,
                            '&:hover': { color: m3Tokens.error },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${m3Tokens.outlineVariant}` }}>
          <Button
            onClick={() => setActiveEnvForVars(null)}
            sx={{
              color: m3Tokens.onSurfaceVariant,
              textTransform: 'none',
              fontSize: 13,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  )
}

export default EnviromentsView