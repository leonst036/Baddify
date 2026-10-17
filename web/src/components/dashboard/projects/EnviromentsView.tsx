import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Divider,
  Alert,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  VpnKeyOutlined as KeyIcon,
  AccountTreeOutlined as BranchIcon,
  RocketLaunchOutlined as RocketIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  Close as CloseIcon,
  DeleteOutlined as DeleteIcon,
  TerminalOutlined as TerminalIcon,
  FolderOutlined as FolderIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../../theme/m3Tokens'
import { Footer } from '../../footer/footer'
import type { ProjectItem } from './ProjectsView'

export type EnvironmentType = 'production' | 'staging' | 'development' | 'preview'
export type EnvironmentStatus = 'healthy' | 'deploying' | 'stopped' | 'failed'

export interface EnvVariable {
  key: string
  value: string
  isSecret?: boolean
}

export interface ProjectEnvironment {
  id: string
  name: string
  type: EnvironmentType
  status: EnvironmentStatus
  branch: string
  lastCommitHash: string
  lastCommitMessage: string
  updatedAt: string
  variables: EnvVariable[]
  description: string
}

interface EnviromentsViewProps {
  project?: ProjectItem | null
  onBack?: () => void
}

// Generate default environments for a project
function getDefaultEnvironments(projectName: string): ProjectEnvironment[] {
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'app'

  return [
    {
      id: 'env-prod',
      name: 'demo',
      type: 'production',
      status: 'healthy',
      branch: 'main',
      lastCommitHash: '7b2a9e1',
      lastCommitMessage: 'release: stable production deployment',
      updatedAt: '15m ago',
      variables: [
        { key: 'NODE_ENV', value: 'production', isSecret: false },
        { key: 'PORT', value: '8080', isSecret: false },
        { key: 'DATABASE_URL', value: `mongodb+srv://${safeName}-prod.baddify.internal:27017`, isSecret: true },
        { key: 'JWT_SECRET', value: 'prod_jwt_super_secret_key_99182', isSecret: true },
      ],
      description: 'Production environment'
    }
  ]
}

export function EnviromentsView({ project, onBack }: EnviromentsViewProps) {
  const currentProjectName = project?.name || 'Default Project'

  const [environments, setEnvironments] = useState<ProjectEnvironment[]>(() =>
    getDefaultEnvironments(currentProjectName)
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // Variables modal state
  const [activeEnvForVars, setActiveEnvForVars] = useState<ProjectEnvironment | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarValue, setNewVarValue] = useState('')
  const [newVarIsSecret, setNewVarIsSecret] = useState(false)

  // Create environment dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newEnvName, setNewEnvName] = useState('')
  const [newEnvType, setNewEnvType] = useState<EnvironmentType>('development')
  const [newEnvBranch, setNewEnvBranch] = useState('main')

  // Redeployment feedback
  const [redeployingId, setRedeployingId] = useState<string | null>(null)

  // Filter environments by search query
  const filteredEnvironments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return environments
    return environments.filter(
      (env) =>
        env.name.toLowerCase().includes(q) ||
        env.branch.toLowerCase().includes(q) ||
        env.type.toLowerCase().includes(q)
    )
  }, [environments, searchQuery])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback(`${label} copied to clipboard!`)
    setTimeout(() => setCopyFeedback(null), 3000)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  const handleRedeploy = (envId: string) => {
    setRedeployingId(envId)
    setEnvironments((prev) =>
      prev.map((e) => (e.id === envId ? { ...e, status: 'deploying' } : e))
    )

    setTimeout(() => {
      setEnvironments((prev) =>
        prev.map((e) =>
          e.id === envId
            ? {
              ...e,
              status: 'healthy',
              updatedAt: 'Just now',
              lastCommitHash: Math.random().toString(16).substring(2, 9),
            }
            : e
        )
      )
      setRedeployingId(null)
    }, 1800)
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
      prev.map((e) =>
        e.id === activeEnvForVars.id ? { ...e, variables: updatedVars } : e
      )
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
      prev.map((e) =>
        e.id === activeEnvForVars.id ? { ...e, variables: updatedVars } : e
      )
    )
    setActiveEnvForVars((prev) => (prev ? { ...prev, variables: updatedVars } : null))
  }

  // Create new environment
  const handleCreateEnvironment = () => {
    if (!newEnvName.trim()) return

    const safeEnvName = newEnvName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

    const newEnv: ProjectEnvironment = {
      id: `env-${Date.now()}`,
      name: safeEnvName,
      type: newEnvType,
      status: 'healthy',
      branch: newEnvBranch.trim() || 'main',
      lastCommitHash: Math.random().toString(16).substring(2, 9),
      lastCommitMessage: 'initial environment setup',
      updatedAt: 'Just now',
      variables: [
        { key: 'NODE_ENV', value: safeEnvName, isSecret: false },
        { key: 'PORT', value: '8080', isSecret: false },
      ],
      description: 'Production environment'
    }

    setEnvironments((prev) => [...prev, newEnv])
    setIsCreateOpen(false)
    setNewEnvName('')
    setNewEnvBranch('main')
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

  const getTypeChipColor = (type: EnvironmentType) => {
    switch (type) {
      case 'production':
        return {
          bg: 'rgba(208, 188, 255, 0.15)',
          color: m3Tokens.primary,
          border: 'rgba(208, 188, 255, 0.3)',
        }
      case 'staging':
        return {
          bg: 'rgba(255, 180, 171, 0.12)',
          color: '#ffb4ab',
          border: 'rgba(255, 180, 171, 0.25)',
        }
      case 'preview':
        return {
          bg: 'rgba(168, 199, 250, 0.12)',
          color: m3Tokens.secondary,
          border: 'rgba(168, 199, 250, 0.25)',
        }
      default:
        return {
          bg: 'rgba(202, 196, 208, 0.08)',
          color: m3Tokens.onSurfaceVariant,
          border: m3Tokens.outlineVariant,
        }
    }
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
              Configure deployment branches
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
            onClick={() => setIsCreateOpen(true)}
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

      {/* Environments Grid */}
      {filteredEnvironments.length === 0 ? (
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
              ? `No environments match "${searchQuery}". Clear your search or create a new one.`
              : 'Create an environment to deploy and manage services for this project.'}
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
              Clear Filter
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateOpen(true)}
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
          {filteredEnvironments.map((env) => {
            const isRedeploying = redeployingId === env.id
            const typeStyle = getTypeChipColor(env.type)

            return (
              <Box
                key={env.id}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: m3Tokens.primary,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                    bgcolor: m3Tokens.surfaceContainerHigh,
                  },
                }}
              >
                {/* Header: Environment name, type chip, and status pill */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        bgcolor: typeStyle.bg,
                        border: `1px solid ${typeStyle.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: typeStyle.color,
                        flexShrink: 0,
                      }}
                    >
                      <RocketIcon sx={{ fontSize: 20 }} />
                    </Box>

                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: m3Tokens.onSurface,
                            letterSpacing: '-0.01em',
                            textTransform: 'capitalize',
                          }}
                        >
                          {env.name}
                        </Typography>

                        <Chip
                          label={env.type}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            fontWeight: 600,
                            fontFamily: m3Tokens.fontCode,
                            textTransform: 'uppercase',
                            bgcolor: typeStyle.bg,
                            color: typeStyle.color,
                            border: `1px solid ${typeStyle.border}`,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Status Indicator Pill */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.2,
                      py: 0.4,
                      borderRadius: '12px',
                      bgcolor:
                        env.status === 'healthy'
                          ? 'rgba(74, 222, 128, 0.1)'
                          : env.status === 'deploying'
                            ? 'rgba(168, 199, 250, 0.15)'
                            : 'rgba(202, 196, 208, 0.08)',
                      border: `1px solid ${env.status === 'healthy'
                        ? 'rgba(74, 222, 128, 0.3)'
                        : env.status === 'deploying'
                          ? 'rgba(168, 199, 250, 0.3)'
                          : m3Tokens.outlineVariant
                        }`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor:
                          env.status === 'healthy'
                            ? '#4ade80'
                            : env.status === 'deploying'
                              ? m3Tokens.secondary
                              : m3Tokens.outline,
                        boxShadow:
                          env.status === 'healthy'
                            ? '0 0 8px #4ade80'
                            : env.status === 'deploying'
                              ? `0 0 8px ${m3Tokens.secondary}`
                              : 'none',
                        animation:
                          env.status === 'deploying' ? 'pulse 1.2s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { opacity: 0.4 },
                          '50%': { opacity: 1 },
                          '100%': { opacity: 0.4 },
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontFamily: m3Tokens.fontCode,
                        fontWeight: 600,
                        color:
                          env.status === 'healthy'
                            ? '#4ade80'
                            : env.status === 'deploying'
                              ? m3Tokens.secondary
                              : m3Tokens.outline,
                        textTransform: 'capitalize',
                      }}
                    >
                      {env.status}
                    </Typography>
                  </Box>
                </Box>

                {/* Domain & URL preview bar */}
                <Box
                  sx={{
                    bgcolor: m3Tokens.surfaceContainerLow,
                    border: `1px solid ${m3Tokens.outlineVariant}`,
                    borderRadius: '8px',
                    p: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
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
                      {env.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Deployment Metadata: Branch, Commit, Last Deployed */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 1.5,
                    fontSize: 12,
                  }}
                >
                  {/* Branch info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <BranchIcon sx={{ fontSize: 15, color: m3Tokens.outline }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, color: m3Tokens.outline }}>Branch</Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontFamily: m3Tokens.fontCode,
                          color: m3Tokens.onSurface,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {env.branch}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Last commit info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <TerminalIcon sx={{ fontSize: 15, color: m3Tokens.outline }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, color: m3Tokens.outline }}>Commit</Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontFamily: m3Tokens.fontCode,
                          color: m3Tokens.onSurface,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {env.lastCommitHash}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(202, 196, 208, 0.08)' }} />

                {/* Bottom Footer Actions: Variables badge & redeploy */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  {/* Variables Button */}
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

                  {/* Redeploy and Delete Action Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Delete environment" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEnvironment(env.id)}
                        sx={{
                          color: m3Tokens.onSurfaceVariant,
                          borderRadius: '6px',
                          '&:hover': { color: m3Tokens.error, bgcolor: 'rgba(255, 180, 171, 0.08)' },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>

                    <Button
                      variant="outlined"
                      size="small"
                      disabled={isRedeploying}
                      onClick={() => handleRedeploy(env.id)}
                      startIcon={
                        isRedeploying ? (
                          <RefreshIcon
                            sx={{
                              fontSize: 14,
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '100%': { transform: 'rotate(360deg)' },
                              },
                            }}
                          />
                        ) : (
                          <RocketIcon sx={{ fontSize: 14 }} />
                        )
                      }
                      sx={{
                        fontSize: 12,
                        textTransform: 'none',
                        borderRadius: '6px',
                        borderColor: m3Tokens.outlineVariant,
                        color: m3Tokens.onSurface,
                        px: 1.5,
                        py: 0.5,
                        '&:hover': {
                          borderColor: m3Tokens.primary,
                          color: m3Tokens.primary,
                          bgcolor: 'rgba(208, 188, 255, 0.04)',
                        },
                      }}
                    >
                      {isRedeploying ? 'Deploying...' : 'Redeploy'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )
          })}
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

      {/* Create Environment Dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidth="sm"
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
            <RocketIcon sx={{ color: m3Tokens.primary, fontSize: 22 }} />
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: m3Tokens.onSurface }}>
              Create Environment
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setIsCreateOpen(false)}
            sx={{ color: m3Tokens.onSurfaceVariant }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
          <TextField
            label="Environment Name"
            placeholder="e.g. qa, preview-pr-12, testing"
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            required
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <RocketIcon sx={{ color: m3Tokens.outline, fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: m3Tokens.surfaceContainerLow,
                borderRadius: '8px',
                '& fieldset': { borderColor: m3Tokens.outlineVariant },
                '&:hover fieldset': { borderColor: m3Tokens.outline },
                '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
              },
              '& .MuiInputLabel-root': { color: m3Tokens.onSurfaceVariant },
              '& .MuiInputLabel-root.Mui-focused': { color: m3Tokens.primary },
            }}
          />

          {/* Environment Type Select Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
              Environment Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(['production', 'staging', 'development', 'preview'] as EnvironmentType[]).map((type) => {
                const selected = newEnvType === type
                const style = getTypeChipColor(type)
                return (
                  <Button
                    key={type}
                    size="small"
                    onClick={() => setNewEnvType(type)}
                    sx={{
                      textTransform: 'capitalize',
                      borderRadius: '8px',
                      fontSize: 12,
                      px: 2,
                      py: 0.75,
                      bgcolor: selected ? style.bg : m3Tokens.surfaceContainerLow,
                      color: selected ? style.color : m3Tokens.onSurfaceVariant,
                      border: `1px solid ${selected ? style.border : m3Tokens.outlineVariant}`,
                      fontWeight: selected ? 600 : 400,
                      '&:hover': {
                        borderColor: style.border,
                        bgcolor: style.bg,
                      },
                    }}
                  >
                    {type}
                  </Button>
                )
              })}
            </Box>
          </Box>

          <TextField
            label="Git Branch"
            placeholder="main, dev, or feature-branch"
            value={newEnvBranch}
            onChange={(e) => setNewEnvBranch(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <BranchIcon sx={{ color: m3Tokens.outline, fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: m3Tokens.surfaceContainerLow,
                borderRadius: '8px',
                '& fieldset': { borderColor: m3Tokens.outlineVariant },
                '&:hover fieldset': { borderColor: m3Tokens.outline },
                '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
              },
              '& .MuiInputLabel-root': { color: m3Tokens.onSurfaceVariant },
              '& .MuiInputLabel-root.Mui-focused': { color: m3Tokens.primary },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${m3Tokens.outlineVariant}`, gap: 1 }}>
          <Button
            onClick={() => setIsCreateOpen(false)}
            sx={{
              color: m3Tokens.onSurfaceVariant,
              textTransform: 'none',
              fontSize: 13,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={!newEnvName.trim()}
            onClick={handleCreateEnvironment}
            sx={{
              bgcolor: m3Tokens.primary,
              color: m3Tokens.onPrimary,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: '8px',
              px: 2.5,
              '&:hover': { bgcolor: m3Tokens.primary, opacity: 0.95 },
            }}
          >
            Create Environment
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  )
}

export default EnviromentsView
