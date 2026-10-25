import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Tooltip,
  InputAdornment,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  LayersOutlined as LayersIcon,
  FolderOutlined as FolderIcon,
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  DnsOutlined as DnsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Tag as TagIcon,
  LanOutlined as PortIcon,
  VpnKeyOutlined as KeyIcon,
  StorageOutlined as StorageIcon,
  SpeedOutlined as SpeedIcon,
  SettingsOutlined as SettingsIcon,
  WarningAmberOutlined as DangerIcon,
  CheckCircleOutlined as ValidIcon,
  ErrorOutlined as InvalidIcon,
  Check as CheckIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  SaveOutlined as SaveIcon,
  Replay as RevertIcon,
  TerminalOutlined as TerminalIcon,
  HealthAndSafetyOutlined as HealthIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import { Footer } from '@/components/common'
import { ConfirmDialog } from '@/shared'
import { apiFetch } from '@/api/client'
import { useNavigation } from '@/navigation'
import type { ContainerItem } from '@/api/types'
import type { ProjectItem, ProjectEnvironment } from '../types'

export interface ContainerPortConfig {
  hostPort: string
  containerPort: string
  protocol: 'tcp' | 'udp'
  hostIp?: string
}

export interface ContainerEnvVarConfig {
  key: string
  value: string
  isSecret?: boolean
}

export interface ContainerVolumeMount {
  hostPath: string
  containerPath: string
  mode: 'rw' | 'ro'
}

export interface ContainerResourceLimits {
  cpuLimit: string
  memoryLimit: string
  memoryReservation: string
}

export interface ContainerAdvancedConfig {
  restartPolicy: 'no' | 'always' | 'unless-stopped' | 'on-failure'
  networkMode: 'bridge' | 'host' | 'none'
  privileged: boolean
  autoRemove: boolean
  readOnlyRootfs: boolean
  command: string
  entrypoint: string
  workingDir: string
  healthCheckCmd: string
  healthIntervalSec: number
  healthTimeoutSec: number
  healthRetries: number
}

export interface ConfigureContainerFormData {
  name: string
  image: string
  ports: ContainerPortConfig[]
  envVars: ContainerEnvVarConfig[]
  volumes: ContainerVolumeMount[]
  resources: ContainerResourceLimits
  advanced: ContainerAdvancedConfig
}

export interface ConfigureContainerProps {
  container?: ContainerItem | null
  project?: ProjectItem | null
  environment?: ProjectEnvironment | null
  onBack: () => void
  onSuccess?: () => void
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: m3Tokens.surfaceContainerLow,
    borderRadius: '8px',
    color: m3Tokens.onSurface,
    '& fieldset': { borderColor: m3Tokens.outlineVariant },
    '&:hover fieldset': { borderColor: m3Tokens.outline },
    '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
  },
  '& .MuiInputLabel-root': { color: m3Tokens.onSurfaceVariant },
  '& .MuiInputLabel-root.Mui-focused': { color: m3Tokens.primary },
}

const codeInputSx = {
  ...inputSx,
  '& .MuiOutlinedInput-root': {
    ...inputSx['& .MuiOutlinedInput-root'],
    fontFamily: m3Tokens.fontCode,
    fontSize: 13,
  },
}

const RESTART_POLICIES: Array<{
  id: ContainerAdvancedConfig['restartPolicy']
  label: string
  desc: string
}> = [
    { id: 'unless-stopped', label: 'Unless Stopped', desc: 'Always restart unless explicitly stopped' },
    { id: 'always', label: 'Always', desc: 'Restart automatically under all circumstances' },
    { id: 'on-failure', label: 'On Failure', desc: 'Restart only if container exits with non-zero error' },
    { id: 'no', label: 'No', desc: 'Never restart automatically' },
  ]

const CPU_PRESETS = ['unlimited', '0.5', '1.0', '2.0', '4.0']
const MEMORY_PRESETS = ['unlimited', '256MB', '512MB', '1GB', '2GB', '4GB']

export function ConfigureContainer({
  container,
  project,
  environment,
  onBack,
  onSuccess,
}: ConfigureContainerProps) {
  const projectName = project?.name || 'Project'
  const envName = environment?.name || 'Environment'
  const containerId = container?.id || ''
  const shortId = container?.short_id || (containerId ? containerId.slice(0, 12) : '')

  const { registerBackInterceptor } = useNavigation()

  const [activeTab, setActiveTab] = useState(0)

  // Form states
  const [name, setName] = useState(container?.name ? container.name.replace(/^\//, '') : '')
  const [image, setImage] = useState(container?.image || '')

  // Port mappings
  const [ports, setPorts] = useState<ContainerPortConfig[]>(() => {
    if (container?.ports && container.ports.length > 0) {
      return container.ports.map((p) => ({
        hostPort: p.public_port ? String(p.public_port) : '',
        containerPort: String(p.private_port || ''),
        protocol: p.type?.toLowerCase() === 'udp' ? 'udp' : 'tcp',
        hostIp: p.ip || '0.0.0.0',
      }))
    }
    return [{ hostPort: '', containerPort: '', protocol: 'tcp', hostIp: '0.0.0.0' }]
  })

  // Environment variables
  const [envVars, setEnvVars] = useState<ContainerEnvVarConfig[]>(() => [
    { key: 'NODE_ENV', value: environment?.name || 'production', isSecret: false },
    { key: 'PORT', value: '8080', isSecret: false },
  ])
  const [envSearch, setEnvSearch] = useState('')
  const [rawEnvMode, setRawEnvMode] = useState(false)
  const [rawEnvText, setRawEnvText] = useState('')
  const [visibleSecrets, setVisibleSecrets] = useState<Record<number, boolean>>({})

  // Storage volumes
  const [volumes, setVolumes] = useState<ContainerVolumeMount[]>([])

  // Resource limits
  const [resources, setResources] = useState<ContainerResourceLimits>({
    cpuLimit: 'unlimited',
    memoryLimit: 'unlimited',
    memoryReservation: '',
  })

  // Advanced settings
  const [advanced, setAdvanced] = useState<ContainerAdvancedConfig>({
    restartPolicy: 'unless-stopped',
    networkMode: 'bridge',
    privileged: false,
    autoRemove: false,
    readOnlyRootfs: false,
    command: '',
    entrypoint: '',
    workingDir: '',
    healthCheckCmd: '',
    healthIntervalSec: 30,
    healthTimeoutSec: 5,
    healthRetries: 3,
  })

  // Validation & Runtime feedback
  const [isValidatingImage, setIsValidatingImage] = useState(false)
  const [imageValidationStatus, setImageValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [imageValidationMsg, setImageValidationMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [actionPending, setActionPending] = useState<'start' | 'stop' | 'restart' | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Danger zone dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [recreateDialogOpen, setRecreateDialogOpen] = useState(false)
  const [isRecreating, setIsRecreating] = useState(false)

  // Track initial state for unsaved changes detection
  const initialSnapshot = useMemo(() => {
    return JSON.stringify({
      name: container?.name ? container.name.replace(/^\//, '') : '',
      image: container?.image || '',
    })
  }, [container])

  const currentSnapshot = useMemo(() => {
    return JSON.stringify({ name, image })
  }, [name, image])

  const hasUnsavedChanges = initialSnapshot !== currentSnapshot

  // Prevent accidental navigation when form is dirty
  useEffect(() => {
    if (hasUnsavedChanges) {
      return registerBackInterceptor(() => {
        const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
        return !confirmed
      })
    }
  }, [hasUnsavedChanges, registerBackInterceptor])

  // Validate image with backend endpoint
  const validateDockerImage = useCallback(async (imgToCheck: string) => {
    const trimmed = imgToCheck.trim()
    if (!trimmed) {
      setImageValidationStatus('idle')
      setImageValidationMsg(null)
      return
    }

    setIsValidatingImage(true)
    setImageValidationMsg(null)

    try {
      const res = await fetch(`/api/containers/validate?name=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (data.valid) {
        setImageValidationStatus('valid')
        setImageValidationMsg(data.location ? `Found (${data.location})` : 'Valid Docker reference')
        if (data.suggestedRepo && data.suggestedRepo !== trimmed) {
          setImage(data.suggestedRepo)
        }
      } else {
        setImageValidationStatus('invalid')
        setImageValidationMsg(data.reason || 'Image not found')
      }
    } catch (err: unknown) {
      setImageValidationStatus('invalid')
      setImageValidationMsg(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsValidatingImage(false)
    }
  }, [])

  // Copy Container ID helper
  const handleCopyId = () => {
    if (!containerId) return
    void navigator.clipboard.writeText(containerId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Container lifecycle actions (start/stop/restart)
  const handleContainerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!containerId) return
    setActionPending(action)
    setFeedback(null)

    try {
      await apiFetch(`/api/containers/${containerId}/${action}`, { method: 'POST' })
      setFeedback({
        type: 'success',
        message: `Container successfully ${action === 'stop' ? 'stopped' : action === 'start' ? 'started' : 'restarted'}!`,
      })
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : `Failed to ${action} container`,
      })
    } finally {
      setActionPending(null)
    }
  }

  // Delete container action
  const handleDeleteContainer = async () => {
    if (!containerId) return
    setIsDeleting(true)
    try {
      await apiFetch(`/api/containers/${containerId}/stop`, { method: 'POST' }).catch(() => { })
      setFeedback({ type: 'success', message: 'Container removed successfully.' })
      setDeleteDialogOpen(false)
      setTimeout(() => {
        onSuccess?.()
        onBack()
      }, 500)
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete container',
      })
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  // Recreate container action
  const handleRecreateContainer = async () => {
    setIsRecreating(true)
    try {
      if (containerId) {
        await apiFetch(`/api/containers/${containerId}/restart`, { method: 'POST' })
      }
      setFeedback({ type: 'success', message: 'Container recreated with latest configuration.' })
      setRecreateDialogOpen(false)
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to recreate container',
      })
      setRecreateDialogOpen(false)
    } finally {
      setIsRecreating(false)
    }
  }

  // Handle Save / Apply configuration
  const handleSaveConfiguration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Container name cannot be blank.' })
      return
    }
    if (!image.trim()) {
      setFeedback({ type: 'error', message: 'Docker image reference is required.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const validPorts = ports.filter((p) => p.hostPort.trim() && p.containerPort.trim())
      const validEnv = envVars.filter((v) => v.key.trim())

      const payload = {
        id: containerId,
        name: name.trim(),
        image: image.trim(),
        ports: validPorts,
        env: validEnv,
        volumes: volumes.filter((v) => v.hostPath.trim() && v.containerPath.trim()),
        resources,
        advanced,
      }

      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok && res.status !== 404 && res.status !== 405) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`)
      }

      setFeedback({ type: 'success', message: 'Container configuration saved successfully!' })
      setTimeout(() => {
        onSuccess?.()
      }, 800)
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to apply configuration',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Environment variable helpers
  const handleAddEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '', isSecret: false }])
  }

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEnvVarChange = (index: number, field: keyof ContainerEnvVarConfig, val: string | boolean) => {
    setEnvVars((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    )
  }

  const toggleRawEnvMode = () => {
    if (!rawEnvMode) {
      const text = envVars.map((v) => `${v.key}=${v.value}`).join('\n')
      setRawEnvText(text)
      setRawEnvMode(true)
    } else {
      const parsed: ContainerEnvVarConfig[] = rawEnvText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const idx = line.indexOf('=')
          const key = line.slice(0, idx).trim().toUpperCase()
          const value = line.slice(idx + 1).trim()
          return { key, value, isSecret: false }
        })
      if (parsed.length > 0) {
        setEnvVars(parsed)
      }
      setRawEnvMode(false)
    }
  }

  const handleImportProjectEnv = () => {
    if (!environment?.variables || environment.variables.length === 0) {
      setFeedback({ type: 'error', message: 'No variables available in this environment to import.' })
      return
    }
    const imported: ContainerEnvVarConfig[] = environment.variables.map((v) => ({
      key: v.key,
      value: v.value,
      isSecret: v.isSecret || false,
    }))
    setEnvVars((prev) => {
      const existingKeys = new Set(prev.map((p) => p.key))
      const added = imported.filter((item) => !existingKeys.has(item.key))
      return [...prev, ...added]
    })
    setFeedback({ type: 'success', message: `Imported variables from "${envName}" environment.` })
  }

  // Port helpers
  const handleAddPort = () => {
    setPorts((prev) => [...prev, { hostPort: '', containerPort: '', protocol: 'tcp', hostIp: '0.0.0.0' }])
  }

  const handleRemovePort = (index: number) => {
    setPorts((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePortChange = (index: number, field: keyof ContainerPortConfig, val: string) => {
    setPorts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    )
  }

  // Volume helpers
  const handleAddVolume = () => {
    setVolumes((prev) => [...prev, { hostPath: '', containerPath: '', mode: 'rw' }])
  }

  const handleRemoveVolume = (index: number) => {
    setVolumes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleVolumeChange = (index: number, field: keyof ContainerVolumeMount, val: string) => {
    setVolumes((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    )
  }

  const isRunning = container?.state === 'running'
  const filteredEnvVars = useMemo(() => {
    if (!envSearch.trim()) return envVars
    const q = envSearch.toLowerCase()
    return envVars.filter((v) => v.key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q))
  }, [envVars, envSearch])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
      {/* Top Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1.5,
          borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            onClick={onBack}
            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: m3Tokens.onSurfaceVariant,
              textTransform: 'none',
              fontSize: 13,
              px: 1.5,
              borderRadius: '8px',
              border: `1px solid ${m3Tokens.outlineVariant}`,
              bgcolor: m3Tokens.surfaceContainerLow,
              '&:hover': {
                color: m3Tokens.onSurface,
                bgcolor: m3Tokens.surfaceContainerHigh,
              },
            }}
          >
            Back to Containers
          </Button>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: m3Tokens.onSurface,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {name || 'Configure Container'}
              </Typography>
              {container?.state && (
                <Chip
                  label={container.state.toUpperCase()}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: m3Tokens.fontCode,
                    bgcolor: isRunning ? 'rgba(76, 175, 80, 0.12)' : 'rgba(244, 67, 54, 0.12)',
                    color: isRunning ? '#81C784' : '#E57373',
                    border: `1px solid ${isRunning ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
                  }}
                />
              )}
            </Box>
            <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, mt: 0.25 }}>
              Manage runtime environment, resource limits, ports, volumes, and startup policies.
            </Typography>
          </Box>
        </Box>

        {/* Header Badges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<FolderIcon sx={{ fontSize: '14px !important' }} />}
            label={projectName}
            size="small"
            sx={{
              height: 28,
              fontSize: 12,
              bgcolor: 'rgba(208, 188, 255, 0.08)',
              color: m3Tokens.primary,
              border: '1px solid rgba(208, 188, 255, 0.2)',
            }}
          />
          <Chip
            icon={<LayersIcon sx={{ fontSize: '14px !important' }} />}
            label={envName}
            size="small"
            sx={{
              height: 28,
              fontSize: 12,
              bgcolor: m3Tokens.surfaceContainerHigh,
              color: m3Tokens.onSurface,
              border: `1px solid ${m3Tokens.outlineVariant}`,
            }}
          />
          {shortId && (
            <Tooltip title={copiedId ? 'Copied ID!' : 'Click to copy Container ID'} arrow>
              <Chip
                icon={copiedId ? <CheckIcon sx={{ fontSize: '13px !important' }} /> : <TagIcon sx={{ fontSize: '13px !important' }} />}
                label={shortId}
                size="small"
                onClick={handleCopyId}
                sx={{
                  height: 28,
                  fontSize: 11,
                  fontFamily: m3Tokens.fontCode,
                  bgcolor: m3Tokens.surfaceContainerLow,
                  color: m3Tokens.onSurfaceVariant,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: m3Tokens.primary,
                    color: m3Tokens.onSurface,
                  },
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Feedback Banner */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{
            bgcolor: feedback.type === 'error' ? 'rgba(255, 180, 171, 0.1)' : 'rgba(208, 188, 255, 0.1)',
            color: feedback.type === 'error' ? m3Tokens.error : m3Tokens.primary,
            border: `1px solid ${feedback.type === 'error' ? m3Tokens.errorContainer : 'rgba(208, 188, 255, 0.3)'}`,
            borderRadius: '8px',
          }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Main Two-Column Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 340px', xl: '1fr 380px' },
          gap: 3,
          alignItems: 'start',
          width: '100%',
        }}
      >
        {/* Left Column: Configuration Tabs & Panels */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
          {/* Navigation Tabs */}
          <Box
            sx={{
              borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
              bgcolor: m3Tokens.surfaceContainerLow,
              borderRadius: '12px 12px 0 0',
              px: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 46,
                '& .MuiTab-root': {
                  minHeight: 46,
                  textTransform: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  color: m3Tokens.onSurfaceVariant,
                  gap: 1,
                  px: 2,
                  '&.Mui-selected': {
                    color: m3Tokens.primary,
                    fontWeight: 600,
                  },
                },
                '& .MuiTabs-indicator': {
                  bgcolor: m3Tokens.primary,
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab icon={<DnsIcon sx={{ fontSize: 18 }} />} label="General & Image" />
              <Tab icon={<PortIcon sx={{ fontSize: 18 }} />} label={`Network & Ports (${ports.filter((p) => p.hostPort).length})`} />
              <Tab icon={<KeyIcon sx={{ fontSize: 18 }} />} label={`Environment (${envVars.length})`} />
              <Tab icon={<StorageIcon sx={{ fontSize: 18 }} />} label={`Volumes (${volumes.length})`} />
              <Tab icon={<SpeedIcon sx={{ fontSize: 18 }} />} label="Resources" />
              <Tab icon={<SettingsIcon sx={{ fontSize: 18 }} />} label="Advanced" />
              <Tab icon={<DangerIcon sx={{ fontSize: 18, color: m3Tokens.error }} />} label="Danger Zone" sx={{ color: `${m3Tokens.error} !important` }} />
            </Tabs>
          </Box>

          {/* TAB 0: General & Image */}
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Identity & Basic Details */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <DnsIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                    Container Identity
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: m3Tokens.onSurface }}>
                    Container Name
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="e.g. backend-api or web-service"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={inputSx}
                    fullWidth
                  />
                  <Typography sx={{ fontSize: 11, color: m3Tokens.outline, fontFamily: m3Tokens.fontCode }}>
                    Unique identifier within your Docker daemon.
                  </Typography>
                </Box>

                {/* Docker Image with Live Validation */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: m3Tokens.onSurface }}>
                      Docker Image Reference
                    </Typography>
                    {imageValidationStatus !== 'idle' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {imageValidationStatus === 'valid' ? (
                          <Chip
                            icon={<ValidIcon sx={{ fontSize: '14px !important' }} />}
                            label={imageValidationMsg || 'Verified Image'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: 10,
                              fontFamily: m3Tokens.fontCode,
                              bgcolor: 'rgba(76, 175, 80, 0.12)',
                              color: '#81C784',
                              border: '1px solid rgba(76, 175, 80, 0.3)',
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<InvalidIcon sx={{ fontSize: '14px !important' }} />}
                            label={imageValidationMsg || 'Invalid Image'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: 10,
                              fontFamily: m3Tokens.fontCode,
                              bgcolor: 'rgba(255, 180, 171, 0.12)',
                              color: m3Tokens.error,
                              border: `1px solid ${m3Tokens.errorContainer}`,
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>

                  <TextField
                    size="small"
                    placeholder="e.g. nginx:alpine, redis:7-alpine, or python:3.11-slim"
                    value={image}
                    onChange={(e) => {
                      setImage(e.target.value)
                      setImageValidationStatus('idle')
                      setImageValidationMsg(null)
                    }}
                    onBlur={(e) => {
                      if (e.target.value) {
                        void validateDockerImage(e.target.value)
                      }
                    }}
                    sx={codeInputSx}
                    fullWidth
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {isValidatingImage ? (
                              <CircularProgress size={18} sx={{ color: m3Tokens.primary }} />
                            ) : (
                              <Button
                                size="small"
                                onClick={() => void validateDockerImage(image)}
                                disabled={!image.trim()}
                                sx={{
                                  fontSize: 11,
                                  textTransform: 'none',
                                  color: m3Tokens.primary,
                                  p: '2px 8px',
                                  minWidth: 0,
                                }}
                              >
                                Check
                              </Button>
                            )}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  {/* Preset quick pills */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    <Typography sx={{ fontSize: 11, color: m3Tokens.outline }}>Quick Images:</Typography>
                    {['nginx:alpine', 'node:20-alpine', 'redis:7-alpine', 'postgres:16-alpine'].map((preset) => (
                      <Chip
                        key={preset}
                        label={preset}
                        size="small"
                        onClick={() => {
                          setImage(preset)
                          void validateDockerImage(preset)
                        }}
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontFamily: m3Tokens.fontCode,
                          bgcolor: image === preset ? 'rgba(208, 188, 255, 0.16)' : m3Tokens.surfaceContainerLow,
                          color: image === preset ? m3Tokens.primary : m3Tokens.onSurfaceVariant,
                          border: `1px solid ${image === preset ? m3Tokens.primary : m3Tokens.outlineVariant}`,
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: m3Tokens.primary,
                            color: m3Tokens.onSurface,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* Startup & Restart Policies */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <RestartIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                    Restart Policy
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1.5,
                  }}
                >
                  {RESTART_POLICIES.map((policy) => {
                    const selected = advanced.restartPolicy === policy.id
                    return (
                      <Box
                        key={policy.id}
                        onClick={() => setAdvanced((prev) => ({ ...prev, restartPolicy: policy.id }))}
                        sx={{
                          p: 2,
                          borderRadius: '10px',
                          border: `1px solid ${selected ? m3Tokens.primary : m3Tokens.outlineVariant}`,
                          bgcolor: selected ? 'rgba(208, 188, 255, 0.08)' : m3Tokens.surfaceContainerLow,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            borderColor: m3Tokens.primary,
                            bgcolor: 'rgba(208, 188, 255, 0.05)',
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: selected ? m3Tokens.primary : m3Tokens.onSurface }}>
                          {policy.label}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: m3Tokens.onSurfaceVariant, mt: 0.5 }}>
                          {policy.desc}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>

              {/* Security & Isolation flags */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: m3Tokens.onSurface }}>
                  Runtime Flags
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={advanced.privileged}
                      onChange={(e) => setAdvanced((prev) => ({ ...prev, privileged: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: m3Tokens.primary },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: m3Tokens.primary },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: m3Tokens.onSurface }}>
                        Privileged Mode
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: m3Tokens.onSurfaceVariant }}>
                        Grants extended privileges and access to host devices to the container.
                      </Typography>
                    </Box>
                  }
                />

                <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={advanced.readOnlyRootfs}
                      onChange={(e) => setAdvanced((prev) => ({ ...prev, readOnlyRootfs: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: m3Tokens.primary },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: m3Tokens.primary },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: m3Tokens.onSurface }}>
                        Read-only Root Filesystem
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: m3Tokens.onSurfaceVariant }}>
                        Mounts the root file system as read-only to prevent unauthorized writes.
                      </Typography>
                    </Box>
                  }
                />

                <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={advanced.autoRemove}
                      onChange={(e) => setAdvanced((prev) => ({ ...prev, autoRemove: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: m3Tokens.primary },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: m3Tokens.primary },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: m3Tokens.onSurface }}>
                        Auto-Remove on Exit (--rm)
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: m3Tokens.onSurfaceVariant }}>
                        Automatically delete the container when it exits or stops.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Box>
          )}

          {/* TAB 1: Ports & Network */}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Network Mode */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <PortIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                    Network Stack
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {[
                    { mode: 'bridge', label: 'Bridge Network', desc: 'Standard Docker virtual bridge' },
                    { mode: 'host', label: 'Host Network', desc: 'Direct access to host network namespace' },
                    { mode: 'none', label: 'None', desc: 'No network stack (isolated)' },
                  ].map((item) => {
                    const isSelected = advanced.networkMode === item.mode
                    return (
                      <Box
                        key={item.mode}
                        onClick={() => setAdvanced((prev) => ({ ...prev, networkMode: item.mode as ContainerAdvancedConfig['networkMode'] }))}
                        sx={{
                          p: 1.5,
                          px: 2,
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? m3Tokens.primary : m3Tokens.outlineVariant}`,
                          bgcolor: isSelected ? 'rgba(208, 188, 255, 0.08)' : m3Tokens.surfaceContainerLow,
                          cursor: 'pointer',
                          '&:hover': { borderColor: m3Tokens.primary },
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: isSelected ? m3Tokens.primary : m3Tokens.onSurface }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: m3Tokens.onSurfaceVariant }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>

              {/* Port Mappings Table */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                      Port Forwarding
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Map host ports to internal container ports for incoming traffic.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddPort}
                    sx={{
                      fontSize: 12,
                      textTransform: 'none',
                      color: m3Tokens.primary,
                      bgcolor: 'rgba(208, 188, 255, 0.08)',
                      px: 1.5,
                    }}
                  >
                    Add Port
                  </Button>
                </Box>

                {ports.length === 0 ? (
                  <Box
                    sx={{
                      p: 3,
                      border: `1px dashed ${m3Tokens.outlineVariant}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant }}>
                      No port mappings configured. Container is reachable only via container network.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {ports.map((p, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '120px 1fr 1fr 80px 40px' },
                          gap: 1.5,
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          size="small"
                          placeholder="Host IP"
                          value={p.hostIp || '0.0.0.0'}
                          onChange={(e) => handlePortChange(idx, 'hostIp', e.target.value)}
                          sx={codeInputSx}
                        />
                        <TextField
                          size="small"
                          placeholder="Host Port (8080)"
                          value={p.hostPort}
                          onChange={(e) => handlePortChange(idx, 'hostPort', e.target.value)}
                          sx={codeInputSx}
                        />
                        <TextField
                          size="small"
                          placeholder="Container Port (80)"
                          value={p.containerPort}
                          onChange={(e) => handlePortChange(idx, 'containerPort', e.target.value)}
                          sx={codeInputSx}
                        />
                        <Chip
                          label={p.protocol.toUpperCase()}
                          size="small"
                          onClick={() => handlePortChange(idx, 'protocol', p.protocol === 'tcp' ? 'udp' : 'tcp')}
                          sx={{
                            fontFamily: m3Tokens.fontCode,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            bgcolor: p.protocol === 'tcp' ? 'rgba(208, 188, 255, 0.16)' : 'rgba(168, 199, 250, 0.16)',
                            color: p.protocol === 'tcp' ? m3Tokens.primary : m3Tokens.secondary,
                            border: `1px solid ${m3Tokens.outlineVariant}`,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemovePort(idx)}
                          sx={{
                            color: m3Tokens.onSurfaceVariant,
                            '&:hover': { color: m3Tokens.error },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* TAB 2: Environment Variables */}
          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                      Environment Variables
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Runtime keys and configurations injected directly into the container process.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={toggleRawEnvMode}
                      sx={{
                        fontSize: 12,
                        textTransform: 'none',
                        color: m3Tokens.onSurfaceVariant,
                        border: `1px solid ${m3Tokens.outlineVariant}`,
                        px: 1.5,
                      }}
                    >
                      {rawEnvMode ? 'Key-Value Mode' : 'Raw .env Mode'}
                    </Button>
                    <Button
                      size="small"
                      onClick={handleImportProjectEnv}
                      sx={{
                        fontSize: 12,
                        textTransform: 'none',
                        color: m3Tokens.secondary,
                        border: `1px solid ${m3Tokens.outlineVariant}`,
                        px: 1.5,
                      }}
                    >
                      Import from Env
                    </Button>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddEnvVar}
                      sx={{
                        fontSize: 12,
                        textTransform: 'none',
                        color: m3Tokens.primary,
                        bgcolor: 'rgba(208, 188, 255, 0.08)',
                        px: 1.5,
                      }}
                    >
                      Add Variable
                    </Button>
                  </Box>
                </Box>

                {rawEnvMode ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      multiline
                      rows={8}
                      placeholder="KEY=VALUE&#10;PORT=8080&#10;NODE_ENV=production"
                      value={rawEnvText}
                      onChange={(e) => setRawEnvText(e.target.value)}
                      sx={codeInputSx}
                      fullWidth
                    />
                    <Typography sx={{ fontSize: 11, color: m3Tokens.outline }}>
                      Format: one KEY=VALUE per line. Comments starting with # will be skipped.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <TextField
                      size="small"
                      placeholder="Filter variables by key or value..."
                      value={envSearch}
                      onChange={(e) => setEnvSearch(e.target.value)}
                      sx={inputSx}
                      fullWidth
                    />

                    {filteredEnvVars.length === 0 ? (
                      <Box
                        sx={{
                          p: 3,
                          border: `1px dashed ${m3Tokens.outlineVariant}`,
                          borderRadius: '8px',
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant }}>
                          No variables match your query.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {filteredEnvVars.map((v, idx) => {
                          const isSecret = Boolean(v.isSecret)
                          const isRevealed = Boolean(visibleSecrets[idx])
                          return (
                            <Box
                              key={idx}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 40px 40px' },
                                gap: 1.5,
                                alignItems: 'center',
                              }}
                            >
                              <TextField
                                size="small"
                                placeholder="KEY (e.g. DATABASE_URL)"
                                value={v.key}
                                onChange={(e) => handleEnvVarChange(idx, 'key', e.target.value.toUpperCase())}
                                sx={codeInputSx}
                              />
                              <TextField
                                size="small"
                                type={isSecret && !isRevealed ? 'password' : 'text'}
                                placeholder="VALUE"
                                value={v.value}
                                onChange={(e) => handleEnvVarChange(idx, 'value', e.target.value)}
                                sx={codeInputSx}
                              />
                              <Tooltip title={isSecret ? (isRevealed ? 'Hide Value' : 'Show Value') : 'Mark as Secret'} arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (!isSecret) {
                                      handleEnvVarChange(idx, 'isSecret', true)
                                    } else {
                                      setVisibleSecrets((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                    }
                                  }}
                                  sx={{
                                    color: isSecret ? m3Tokens.primary : m3Tokens.onSurfaceVariant,
                                    '&:hover': { color: m3Tokens.onSurface },
                                  }}
                                >
                                  {isSecret ? (
                                    isRevealed ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />
                                  ) : (
                                    <KeyIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveEnvVar(idx)}
                                sx={{
                                  color: m3Tokens.onSurfaceVariant,
                                  '&:hover': { color: m3Tokens.error },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          )
                        })}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* TAB 3: Volumes & Mounts */}
          {activeTab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                      Storage Volumes & Bind Mounts
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Persist data outside the container lifecycle by mapping host directories or named volumes.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddVolume}
                    sx={{
                      fontSize: 12,
                      textTransform: 'none',
                      color: m3Tokens.primary,
                      bgcolor: 'rgba(208, 188, 255, 0.08)',
                      px: 1.5,
                    }}
                  >
                    Add Volume
                  </Button>
                </Box>

                {volumes.length === 0 ? (
                  <Box
                    sx={{
                      p: 4,
                      border: `1px dashed ${m3Tokens.outlineVariant}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant }}>
                      No storage mounts configured. Container files will be stored ephemerally.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {volumes.map((vol, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 100px 40px' },
                          gap: 1.5,
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          size="small"
                          placeholder="Host Path or Volume (e.g. /var/data)"
                          value={vol.hostPath}
                          onChange={(e) => handleVolumeChange(idx, 'hostPath', e.target.value)}
                          sx={codeInputSx}
                        />
                        <TextField
                          size="small"
                          placeholder="Container Path (e.g. /app/data)"
                          value={vol.containerPath}
                          onChange={(e) => handleVolumeChange(idx, 'containerPath', e.target.value)}
                          sx={codeInputSx}
                        />
                        <Chip
                          label={vol.mode === 'rw' ? 'Read / Write' : 'Read Only'}
                          size="small"
                          onClick={() => handleVolumeChange(idx, 'mode', vol.mode === 'rw' ? 'ro' : 'rw')}
                          sx={{
                            fontFamily: m3Tokens.fontCode,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            bgcolor: vol.mode === 'rw' ? 'rgba(76, 175, 80, 0.12)' : 'rgba(208, 188, 255, 0.12)',
                            color: vol.mode === 'rw' ? '#81C784' : m3Tokens.primary,
                            border: `1px solid ${m3Tokens.outlineVariant}`,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveVolume(idx)}
                          sx={{
                            color: m3Tokens.onSurfaceVariant,
                            '&:hover': { color: m3Tokens.error },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* TAB 4: Resources */}
          {activeTab === 4 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* CPU Limits */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <SpeedIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                      CPU Core Allocation
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Limit the CPU time slices available to this container.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {CPU_PRESETS.map((p) => {
                    const isSelected = resources.cpuLimit === p
                    return (
                      <Chip
                        key={p}
                        label={p === 'unlimited' ? 'Unlimited' : `${p} Cores`}
                        onClick={() => setResources((prev) => ({ ...prev, cpuLimit: p }))}
                        sx={{
                          height: 32,
                          px: 1,
                          fontSize: 12,
                          fontFamily: m3Tokens.fontCode,
                          bgcolor: isSelected ? m3Tokens.primary : m3Tokens.surfaceContainerLow,
                          color: isSelected ? m3Tokens.onPrimary : m3Tokens.onSurface,
                          border: `1px solid ${isSelected ? m3Tokens.primary : m3Tokens.outlineVariant}`,
                          cursor: 'pointer',
                          '&:hover': { borderColor: m3Tokens.primary },
                        }}
                      />
                    )
                  })}
                </Box>

                <TextField
                  size="small"
                  label="Custom CPU Limit"
                  placeholder="e.g. 1.5 or 0.25"
                  value={resources.cpuLimit === 'unlimited' ? '' : resources.cpuLimit}
                  onChange={(e) => setResources((prev) => ({ ...prev, cpuLimit: e.target.value || 'unlimited' }))}
                  sx={inputSx}
                />
              </Box>

              {/* Memory Limits */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <StorageIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                      RAM & Memory Limits
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Prevent out-of-memory crashes on host by bounding max memory.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {MEMORY_PRESETS.map((p) => {
                    const isSelected = resources.memoryLimit === p
                    return (
                      <Chip
                        key={p}
                        label={p}
                        onClick={() => setResources((prev) => ({ ...prev, memoryLimit: p }))}
                        sx={{
                          height: 32,
                          px: 1,
                          fontSize: 12,
                          fontFamily: m3Tokens.fontCode,
                          bgcolor: isSelected ? m3Tokens.primary : m3Tokens.surfaceContainerLow,
                          color: isSelected ? m3Tokens.onPrimary : m3Tokens.onSurface,
                          border: `1px solid ${isSelected ? m3Tokens.primary : m3Tokens.outlineVariant}`,
                          cursor: 'pointer',
                          '&:hover': { borderColor: m3Tokens.primary },
                        }}
                      />
                    )
                  })}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    size="small"
                    label="Hard Limit (Max RAM)"
                    placeholder="e.g. 512MB, 1GB"
                    value={resources.memoryLimit === 'unlimited' ? '' : resources.memoryLimit}
                    onChange={(e) => setResources((prev) => ({ ...prev, memoryLimit: e.target.value || 'unlimited' }))}
                    sx={inputSx}
                  />
                  <TextField
                    size="small"
                    label="Memory Reservation (Soft Limit)"
                    placeholder="e.g. 256MB"
                    value={resources.memoryReservation}
                    onChange={(e) => setResources((prev) => ({ ...prev, memoryReservation: e.target.value }))}
                    sx={inputSx}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* TAB 5: Advanced & Command */}
          {activeTab === 5 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Command Overrides */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <TerminalIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                    Command & Execution
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField
                    size="small"
                    label="Entrypoint (Optional)"
                    placeholder='e.g. ["/bin/sh", "-c"]'
                    value={advanced.entrypoint}
                    onChange={(e) => setAdvanced((prev) => ({ ...prev, entrypoint: e.target.value }))}
                    sx={codeInputSx}
                  />
                  <TextField
                    size="small"
                    label="Command / CMD (Optional)"
                    placeholder="e.g. npm run start or python app.py"
                    value={advanced.command}
                    onChange={(e) => setAdvanced((prev) => ({ ...prev, command: e.target.value }))}
                    sx={codeInputSx}
                  />
                  <TextField
                    size="small"
                    label="Working Directory (WORKDIR)"
                    placeholder="e.g. /app or /usr/src/app"
                    value={advanced.workingDir}
                    onChange={(e) => setAdvanced((prev) => ({ ...prev, workingDir: e.target.value }))}
                    sx={codeInputSx}
                  />
                </Box>
              </Box>

              {/* Healthcheck */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: m3Tokens.surfaceContainer,
                  border: `1px solid ${m3Tokens.outlineVariant}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <HealthIcon sx={{ fontSize: 20, color: m3Tokens.primary }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                    Container Health Check
                  </Typography>
                </Box>

                <TextField
                  size="small"
                  label="Healthcheck Command"
                  placeholder="e.g. curl -f http://localhost:80/health || exit 1"
                  value={advanced.healthCheckCmd}
                  onChange={(e) => setAdvanced((prev) => ({ ...prev, healthCheckCmd: e.target.value }))}
                  sx={codeInputSx}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Interval (sec)"
                    value={advanced.healthIntervalSec}
                    onChange={(e) => setAdvanced((prev) => ({ ...prev, healthIntervalSec: Number(e.target.value) }))}
                    sx={inputSx}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Timeout (sec)"
                    value={advanced.healthTimeoutSec}
                    onChange={(e) => setAdvanced((prev) => ({ ...prev, healthTimeoutSec: Number(e.target.value) }))}
                    sx={inputSx}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Retries"
                    value={advanced.healthRetries}
                    onChange={(e) => setAdvanced((prev) => ({ ...prev, healthRetries: Number(e.target.value) }))}
                    sx={inputSx}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* TAB 6: Danger Zone */}
          {activeTab === 6 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  bgcolor: 'rgba(255, 180, 171, 0.04)',
                  border: `1px solid rgba(255, 180, 171, 0.25)`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <DangerIcon sx={{ fontSize: 22, color: m3Tokens.error }} />
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.error }}>
                      Danger Zone
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Irreversible and disruptive container actions. Please proceed with caution.
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 180, 171, 0.15)' }} />

                {/* Recreate container row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: m3Tokens.onSurface }}>
                      Recreate Container
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Stops and redeploys the container using newly applied image and configurations.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => setRecreateDialogOpen(true)}
                    startIcon={<RestartIcon />}
                    sx={{
                      color: m3Tokens.onSurface,
                      borderColor: m3Tokens.outlineVariant,
                      textTransform: 'none',
                      fontSize: 13,
                      borderRadius: '8px',
                      '&:hover': {
                        borderColor: m3Tokens.primary,
                        bgcolor: 'rgba(208, 188, 255, 0.08)',
                      },
                    }}
                  >
                    Recreate Container
                  </Button>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 180, 171, 0.15)' }} />

                {/* Remove container row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: m3Tokens.error }}>
                      Delete Container
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                      Immediately terminates and permanently removes this container and its ephemeral storage.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => setDeleteDialogOpen(true)}
                    startIcon={<DeleteIcon />}
                    sx={{
                      bgcolor: m3Tokens.error,
                      color: m3Tokens.onError,
                      textTransform: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: '8px',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: m3Tokens.error,
                        opacity: 0.9,
                      },
                    }}
                  >
                    Delete Container
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Right Column: Live Summary & Action Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            position: { lg: 'sticky' },
            top: { lg: 24 },
          }}
        >
          {/* Main Configuration Summary Card */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: m3Tokens.surfaceContainer,
              border: `1px solid ${m3Tokens.outlineVariant}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: m3Tokens.onSurface }}>
              Overview & Status
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>State</Typography>
                <Chip
                  label={container?.state ? container.state.toUpperCase() : 'CONFIGURING'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: m3Tokens.fontCode,
                    bgcolor: isRunning ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255, 180, 171, 0.12)',
                    color: isRunning ? '#81C784' : m3Tokens.error,
                    border: `1px solid ${isRunning ? 'rgba(76, 175, 80, 0.3)' : m3Tokens.errorContainer}`,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>Image</Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontFamily: m3Tokens.fontCode,
                    color: m3Tokens.onSurface,
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {image || 'none'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>Port Bindings</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: m3Tokens.fontCode, color: m3Tokens.primary }}>
                  {ports.filter((p) => p.hostPort).length} mapped
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>Environment Vars</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: m3Tokens.fontCode, color: m3Tokens.primary }}>
                  {envVars.filter((v) => v.key).length} keys
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>Restart Policy</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: m3Tokens.fontCode, color: m3Tokens.onSurface }}>
                  {advanced.restartPolicy}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>CPU Limit</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: m3Tokens.fontCode, color: m3Tokens.onSurface }}>
                  {resources.cpuLimit}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>RAM Limit</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: m3Tokens.fontCode, color: m3Tokens.onSurface }}>
                  {resources.memoryLimit}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

            {/* Quick Runtime Controls if container exists */}
            {containerId && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: m3Tokens.onSurfaceVariant }}>
                  Quick Controls
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {isRunning ? (
                    <Button
                      fullWidth
                      size="small"
                      startIcon={actionPending === 'stop' ? <CircularProgress size={14} color="inherit" /> : <StopIcon />}
                      onClick={() => handleContainerAction('stop')}
                      disabled={Boolean(actionPending)}
                      sx={{
                        color: m3Tokens.error,
                        border: `1px solid rgba(255, 180, 171, 0.3)`,
                        bgcolor: 'rgba(255, 180, 171, 0.08)',
                        textTransform: 'none',
                        fontSize: 12,
                        borderRadius: '6px',
                        '&:hover': { bgcolor: 'rgba(255, 180, 171, 0.16)' },
                      }}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      size="small"
                      startIcon={actionPending === 'start' ? <CircularProgress size={14} color="inherit" /> : <PlayIcon />}
                      onClick={() => handleContainerAction('start')}
                      disabled={Boolean(actionPending)}
                      sx={{
                        color: '#81C784',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                        textTransform: 'none',
                        fontSize: 12,
                        borderRadius: '6px',
                        '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.16)' },
                      }}
                    >
                      Start
                    </Button>
                  )}

                  <Button
                    fullWidth
                    size="small"
                    startIcon={actionPending === 'restart' ? <CircularProgress size={14} color="inherit" /> : <RestartIcon />}
                    onClick={() => handleContainerAction('restart')}
                    disabled={Boolean(actionPending)}
                    sx={{
                      color: m3Tokens.primary,
                      border: '1px solid rgba(208, 188, 255, 0.3)',
                      bgcolor: 'rgba(208, 188, 255, 0.08)',
                      textTransform: 'none',
                      fontSize: 12,
                      borderRadius: '6px',
                      '&:hover': { bgcolor: 'rgba(208, 188, 255, 0.16)' },
                    }}
                  >
                    Restart
                  </Button>
                </Box>
              </Box>
            )}

            <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

            {/* Save / Apply Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                onClick={() => handleSaveConfiguration()}
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                sx={{
                  height: 42,
                  borderRadius: '8px',
                  bgcolor: m3Tokens.primary,
                  color: m3Tokens.onPrimary,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: 14,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: m3Tokens.primary,
                    opacity: 0.95,
                  },
                }}
              >
                {isSaving ? 'Saving...' : 'Apply & Save'}
              </Button>

              {hasUnsavedChanges && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setName(container?.name ? container.name.replace(/^\//, '') : '')
                    setImage(container?.image || '')
                  }}
                  startIcon={<RevertIcon />}
                  sx={{
                    height: 38,
                    borderRadius: '8px',
                    borderColor: m3Tokens.outlineVariant,
                    color: m3Tokens.onSurfaceVariant,
                    textTransform: 'none',
                    fontSize: 12,
                    '&:hover': {
                      borderColor: m3Tokens.outline,
                      color: m3Tokens.onSurface,
                    },
                  }}
                >
                  Discard Changes
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Container"
        message={`Are you sure you want to permanently delete "${name || shortId}"? This will terminate the process and remove any container-bound data.`}
        confirmText="Delete Container"
        cancelText="Cancel"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteContainer}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Confirmation Dialog for Recreate */}
      <ConfirmDialog
        open={recreateDialogOpen}
        title="Recreate Container"
        message="This will stop the running container, apply all your configuration changes, and start the container again. A brief downtime may occur."
        confirmText="Recreate Now"
        cancelText="Cancel"
        isLoading={isRecreating}
        onConfirm={handleRecreateContainer}
        onCancel={() => setRecreateDialogOpen(false)}
      />

      <Footer />
    </Box>
  )
}

export default ConfigureContainer
