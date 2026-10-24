import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { m3Tokens } from '@/theme/m3Tokens'
import { Footer } from '@/components/common'
import { getAuthHeaders } from '@/api/client'
import { CreateEnvironmentPage } from './CreateEnviroment'
import type { NewEnvironmentData } from './CreateEnviroment'
import { ContainerView } from '../Containers/ContainerView'
import { EnvironmentHeader } from '../components/EnvironmentHeader'
import { EnvironmentCard } from '../components/EnvironmentCard'
import { EnvironmentVariablesDialog } from '../components/EnvironmentVariablesDialog'
import { EnvironmentEmptyState } from '../components/EnvironmentEmptyState'
import type { EnvVariable, ProjectEnvironment, ProjectItem } from '../types'
import { ConfirmDialog } from '@/shared'

import { useNavigation } from '@/navigation'

export type { EnvVariable, ProjectEnvironment }

export interface EnviromentsViewProps {
  project?: ProjectItem | null
  onBack?: () => void
  selectedEnvironment?: ProjectEnvironment | null
  onSelectEnvironment?: (env: ProjectEnvironment | null) => void
  isCreating?: boolean
  onToggleCreating?: (creating: boolean) => void
  isCreatingContainer?: boolean
  onToggleCreatingContainer?: (creating: boolean) => void
}

export function EnviromentsView({
  project,
  onBack,
  selectedEnvironment: externalSelectedEnvironment,
  onSelectEnvironment,
  isCreating: externalIsCreating,
  onToggleCreating,
  isCreatingContainer,
  onToggleCreatingContainer,
}: EnviromentsViewProps) {
  const currentProjectName = project?.name || 'Default Project'
  const projectId = project?.uuid || project?.id || project?.name

  const { registerBackInterceptor } = useNavigation()

  const [environments, setEnvironments] = useState<ProjectEnvironment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // Variables modal state
  const [activeEnvForVars, setActiveEnvForVars] = useState<ProjectEnvironment | null>(null)
  // Create environment page state
  const [internalIsCreating, setInternalIsCreating] = useState(false)
  // Selected environment for ContainerView
  const [internalSelectedEnvironment, setInternalSelectedEnvironment] = useState<ProjectEnvironment | null>(null)
  // Delete confirmation dialog state
  const [envIdToDelete, setEnvIdToDelete] = useState<string | null>(null)

  const isCreating = externalIsCreating !== undefined ? externalIsCreating : internalIsCreating
  const setIsCreating = onToggleCreating || setInternalIsCreating

  const selectedEnvironment =
    externalSelectedEnvironment !== undefined ? externalSelectedEnvironment : internalSelectedEnvironment
  const setSelectedEnvironment = onSelectEnvironment || setInternalSelectedEnvironment

  useEffect(() => {
    if (activeEnvForVars) {
      return registerBackInterceptor(() => {
        setActiveEnvForVars(null)
        return true
      })
    }
  }, [activeEnvForVars, registerBackInterceptor])

  useEffect(() => {
    if (envIdToDelete) {
      return registerBackInterceptor(() => {
        setEnvIdToDelete(null)
        return true
      })
    }
  }, [envIdToDelete, registerBackInterceptor])

  const fetchEnvironments = useCallback(async (isManualRefresh = false) => {
    if (!projectId) {
      setEnvironments([])
      setIsLoading(false)
      return
    }

    if (isManualRefresh) {
      setIsRefreshing(true)
    }
    try {
      setError(null)
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
    let isMounted = true

    async function loadInitial() {
      if (!projectId) {
        setIsLoading(false)
        return
      }

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
        if (isMounted) {
          setEnvironments(normalized)
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch environments'
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
  }, [projectId])

  // Filter environments by search query
  const filteredEnvironments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return environments
    return environments.filter((env) => env.name.toLowerCase().includes(q))
  }, [environments, searchQuery])

  const handleCopyFeedback = (msg: string) => {
    setCopyFeedback(msg)
    setTimeout(() => setCopyFeedback(null), 3000)
  }

  // Update variables for an environment
  const handleUpdateVariables = (envId: string, updatedVars: EnvVariable[]) => {
    setEnvironments((prev) =>
      prev.map((e) => (e.id === envId ? { ...e, variables: updatedVars } : e))
    )
    setActiveEnvForVars((prev) => (prev ? { ...prev, variables: updatedVars } : null))
  }

  // Create new environment
  const handleCreateEnvironment = async (data: NewEnvironmentData) => {
    if (!projectId) return

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/environments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          variables: data.variables,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `Failed to create environment (${res.status})`)
      }

      const created = await res.json()
      const newEnv: ProjectEnvironment = {
        id: created.id || created.uuid || `env-${Date.now()}`,
        uuid: created.uuid,
        name: created.name || data.name,
        updatedAt: 'Just now',
        variables: created.variables || data.variables,
        description: created.description || data.description,
      }

      setEnvironments((prev) => [...prev, newEnv])
      setIsCreating(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create environment'
      setError(msg)
      setIsCreating(false)
    }
  }

  // Delete environment
  const handleDeleteEnvironment = (envId: string) => {
    setEnvIdToDelete(envId)
  }

  const confirmDeleteEnvironment = () => {
    if (!envIdToDelete) return
    setEnvironments((prev) => prev.filter((e) => e.id !== envIdToDelete))
    if (activeEnvForVars?.id === envIdToDelete) {
      setActiveEnvForVars(null)
    }
    setEnvIdToDelete(null)
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

  if (selectedEnvironment) {
    return (
      <ContainerView
        project={project}
        environment={selectedEnvironment}
        onBack={() => setSelectedEnvironment(null)}
        isCreating={isCreatingContainer}
        onToggleCreating={onToggleCreatingContainer}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
      <EnvironmentHeader
        projectName={currentProjectName}
        environmentsCount={environments.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRefreshing={isRefreshing}
        onRefresh={() => void fetchEnvironments(true)}
        onNewEnvironment={() => setIsCreating(true)}
        onBack={onBack}
      />

      {/* Toast Feedback Alert */}
      {copyFeedback && (
        <Alert
          severity="success"
          sx={{
            bgcolor: 'rgba(208, 188, 255, 0.1)',
            color: m3Tokens.primary,
            border: '1px solid rgba(208, 188, 255, 0.3)',
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
        <EnvironmentEmptyState
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onCreateEnvironment={() => setIsCreating(true)}
        />
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
            <EnvironmentCard
              key={env.id}
              environment={env}
              onSelect={setSelectedEnvironment}
              onOpenVariables={setActiveEnvForVars}
              onDelete={handleDeleteEnvironment}
            />
          ))}
        </Box>
      )}

      {/* Environment Variables Modal Dialog */}
      <EnvironmentVariablesDialog
        open={Boolean(activeEnvForVars)}
        environment={activeEnvForVars}
        onClose={() => setActiveEnvForVars(null)}
        onUpdateVariables={handleUpdateVariables}
        onCopyFeedback={handleCopyFeedback}
      />

      {/* Delete Environment Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(envIdToDelete)}
        title="Delete Environment"
        message="Are you sure you want to delete this environment? This action cannot be undone."
        confirmText="Delete"
        isDestructive
        onConfirm={confirmDeleteEnvironment}
        onCancel={() => setEnvIdToDelete(null)}
      />

      <Footer />
    </Box>
  )
}

export default EnviromentsView