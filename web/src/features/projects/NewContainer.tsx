import React, { useState } from 'react'
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
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  LayersOutlined as LayersIcon,
  FolderOutlined as FolderIcon,
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  DnsOutlined as DnsIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import { Footer } from '@/components/common'
import type { ProjectItem, ProjectEnvironment } from './types'

export interface ContainerPortMapping {
  hostPort: string
  containerPort: string
}

export interface ContainerEnvVar {
  key: string
  value: string
}

export interface NewContainerFormData {
  name: string
  image: string
  ports: ContainerPortMapping[]
  envVars: ContainerEnvVar[]
}

export interface NewContainerProps {
  project?: ProjectItem | null
  environment?: ProjectEnvironment | null
  onBack: () => void
  onSuccess?: () => void
}


const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: m3Tokens.surfaceContainerLow,
    borderRadius: '8px',
    '& fieldset': { borderColor: m3Tokens.outlineVariant },
    '&:hover fieldset': { borderColor: m3Tokens.outline },
    '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
  },
}

export function NewContainer({
  project,
  environment,
  onBack,
  onSuccess,
}: NewContainerProps) {
  const projectName = project?.name || 'Project'
  const envName = environment?.name || 'Environment'

  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [ports, setPorts] = useState<ContainerPortMapping[]>([{ hostPort: '', containerPort: '' }])
  const [envVars, setEnvVars] = useState<ContainerEnvVar[]>([{ key: '', value: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddPort = () => {
    setPorts((prev) => [...prev, { hostPort: '', containerPort: '' }])
  }

  const handleRemovePort = (index: number) => {
    setPorts((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePortChange = (index: number, field: keyof ContainerPortMapping, val: string) => {
    setPorts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    )
  }

  const handleAddEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '' }])
  }

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEnvVarChange = (index: number, field: keyof ContainerEnvVar, val: string) => {
    setEnvVars((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Container name is required.')
      return
    }
    if (!image.trim()) {
      setError('Docker image is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Containers API endpoint
      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          image: image.trim(),
          ports: ports.filter((p) => p.hostPort && p.containerPort),
          env: envVars.filter((v) => v.key.trim()),
        }),
      })

      if (!res.ok && res.status !== 404 && res.status !== 405) {
        throw new Error(`Deployment failed (${res.status})`)
      }

      onSuccess?.()
      onBack()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create container'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
      {/* Header */}
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
              Deploy Container
            </Typography>
            <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, mt: 0.25 }}>
              Launch a new container service into this environment.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
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

      {/* Main Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: 720,
        }}
      >
        {/* Basic Configuration */}
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
              Container Details
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: m3Tokens.onSurface }}>
              Container Name
            </Typography>
            <TextField
              size="small"
              placeholder="e.g. My cool Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={inputSx}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: m3Tokens.onSurface }}>
              Docker Image
            </Typography>
            <TextField
              size="small"
              placeholder="e.g. nginx:alpine or redis:7-alpine"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              sx={inputSx}
            />
          </Box>
        </Box>

        {/* Port Mappings */}
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
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: m3Tokens.onSurface }}>
              Port Mappings
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddPort}
              sx={{
                fontSize: 12,
                textTransform: 'none',
                color: m3Tokens.primary,
              }}
            >
              Add Port
            </Button>
          </Box>

          {ports.map((p, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr auto' },
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              <TextField
                size="small"
                placeholder="Host Port (e.g. 8080)"
                value={p.hostPort}
                onChange={(e) => handlePortChange(idx, 'hostPort', e.target.value)}
                sx={inputSx}
              />
              <TextField
                size="small"
                placeholder="Container Port (e.g. 80)"
                value={p.containerPort}
                onChange={(e) => handlePortChange(idx, 'containerPort', e.target.value)}
                sx={inputSx}
              />
              <IconButton
                size="small"
                disabled={ports.length <= 1}
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

        {/* Environment Variables */}
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
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: m3Tokens.onSurface }}>
              Environment Variables
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddEnvVar}
              sx={{
                fontSize: 12,
                textTransform: 'none',
                color: m3Tokens.primary,
              }}
            >
              Add Variable
            </Button>
          </Box>

          {envVars.map((v, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr auto' },
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              <TextField
                size="small"
                placeholder="KEY (e.g. PORT)"
                value={v.key}
                onChange={(e) => handleEnvVarChange(idx, 'key', e.target.value.toUpperCase())}
                sx={inputSx}
              />
              <TextField
                size="small"
                placeholder="VALUE (e.g. 8080)"
                value={v.value}
                onChange={(e) => handleEnvVarChange(idx, 'value', e.target.value)}
                sx={inputSx}
              />
              <IconButton
                size="small"
                disabled={envVars.length <= 1}
                onClick={() => handleRemoveEnvVar(idx)}
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

        <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

        {/* Submit Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{
              height: 42,
              px: 3,
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
            {isSubmitting ? 'Deploying...' : 'Deploy Container'}
          </Button>

          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              height: 42,
              px: 3,
              borderRadius: '8px',
              borderColor: m3Tokens.outlineVariant,
              color: m3Tokens.onSurface,
              textTransform: 'none',
              fontSize: 14,
              '&:hover': {
                borderColor: m3Tokens.outline,
                bgcolor: m3Tokens.surfaceContainerHigh,
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}

export default NewContainer
