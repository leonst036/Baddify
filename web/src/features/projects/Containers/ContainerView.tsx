import { useState, useMemo, useCallback, useEffect } from 'react'
import {
    Box,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material'
import { m3Tokens } from '@/theme/m3Tokens'
import { Footer } from '@/components/common'
import { apiFetch } from '@/api/client'
import type { ContainerItem } from '@/api/types'
import type { ProjectItem, ProjectEnvironment } from '../types'
import { ContainerHeader } from '../components/ContainerHeader'
import { ContainerCard } from '../components/ContainerCard'
import { ContainerEmptyState } from '../components/ContainerEmptyState'
import { NewContainer } from './NewContainer'

export interface ContainerViewProps {
    project?: ProjectItem | null
    environment?: ProjectEnvironment | null
    onBack?: () => void
    onNewContainer?: () => void
    isCreating?: boolean
    onToggleCreating?: (creating: boolean) => void
}

export function ContainerView({
    project,
    environment,
    onBack,
    onNewContainer,
    isCreating: externalIsCreating,
    onToggleCreating,
}: ContainerViewProps) {
    const projectName = project?.name || 'Project'
    const envName = environment?.name || 'Environment'

    const [isCreatingInternal, setIsCreatingInternal] = useState(false)
    const isCreating = externalIsCreating !== undefined ? externalIsCreating : isCreatingInternal
    const setIsCreating = onToggleCreating || setIsCreatingInternal
    const [containers, setContainers] = useState<ContainerItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all')
    const [actionPendingId, setActionPendingId] = useState<string | null>(null)

    const fetchContainers = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const data = await apiFetch<ContainerItem[]>('/api/containers')
            setContainers(Array.isArray(data) ? data : [])
            setError(null)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch containers'
            setError(msg)
        } finally {
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        async function loadInitial() {
            try {
                const data = await apiFetch<ContainerItem[]>('/api/containers')
                if (isMounted) {
                    setContainers(Array.isArray(data) ? data : [])
                }
            } catch (err: unknown) {
                if (isMounted) {
                    const msg = err instanceof Error ? err.message : 'Failed to fetch containers'
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

    const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
        setActionPendingId(id)
        try {
            await apiFetch(`/api/containers/${id}/${action}`, { method: 'POST' })
            await fetchContainers()
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Container action failed'
            setError(msg)
        } finally {
            setActionPendingId(null)
        }
    }

    const runningCount = containers.filter((c) => c.state === 'running').length
    const stoppedCount = containers.length - runningCount

    const filteredContainers = useMemo(() => {
        let list = containers
        if (statusFilter === 'running') {
            list = list.filter((c) => c.state === 'running')
        } else if (statusFilter === 'stopped') {
            list = list.filter((c) => c.state !== 'running')
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.image.toLowerCase().includes(q) ||
                    (c.short_id && c.short_id.toLowerCase().includes(q)) ||
                    (c.id && c.id.toLowerCase().includes(q))
            )
        }
        return list
    }, [containers, statusFilter, searchQuery])

    if (isCreating) {
        return (
            <NewContainer
                project={project}
                environment={environment}
                onBack={() => {
                    setIsCreating(false)
                    void fetchContainers()
                }}
                onSuccess={() => {
                    setIsCreating(false)
                    void fetchContainers()
                }}
            />
        )
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
            <ContainerHeader
                projectName={projectName}
                envName={envName}
                totalCount={containers.length}
                runningCount={runningCount}
                stoppedCount={stoppedCount}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                isRefreshing={isRefreshing}
                onRefresh={fetchContainers}
                onBack={onBack}
                onNewContainer={onNewContainer || (() => setIsCreating(true))}
            />

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={fetchContainers}>
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

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={36} sx={{ color: m3Tokens.primary }} />
                </Box>
            ) : filteredContainers.length === 0 ? (
                <ContainerEmptyState
                    hasContainers={containers.length > 0}
                    envName={envName}
                    searchQuery={searchQuery}
                    onReset={() => {
                        setSearchQuery('')
                        setStatusFilter('all')
                        void fetchContainers()
                    }}
                />
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredContainers.map((container) => (
                        <ContainerCard
                            key={container.id}
                            container={container}
                            isPending={actionPendingId === container.id}
                            onAction={handleAction}
                        />
                    ))}
                </Box>
            )}

            <Footer />
        </Box>
    )
}

export default ContainerView
