import { useState, useMemo, useCallback, useEffect } from 'react'
import {
    Box,
    Button,
    Typography,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    FolderOutlined as FolderIcon,
    LayersOutlined as LayersIcon,
    Inventory2Outlined as ContainerIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    RestartAlt as RestartIcon,
    Tag as TagIcon,
    LanOutlined as PortIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../../theme/m3Tokens'
import { Footer } from '../../footer/footer'
import { apiFetch } from '../../../api/client'
import type { ContainerItem } from '../../../api/types'
import type { ProjectItem } from './ProjectsView'
import type { ProjectEnvironment } from './EnviromentsView'

export interface ContainerViewProps {
    project?: ProjectItem | null
    environment?: ProjectEnvironment | null
    onBack?: () => void
}

export function ContainerView({
    project,
    environment,
    onBack,
}: ContainerViewProps) {
    const projectName = project?.name || 'Project'
    const envName = environment?.name || 'Environment'

    const [containers, setContainers] = useState<ContainerItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all')
    const [actionPendingId, setActionPendingId] = useState<string | null>(null)

    const fetchContainers = useCallback(async (isManual = false) => {
        if (isManual) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const data = await apiFetch<ContainerItem[]>('/api/containers')
            setContainers(Array.isArray(data) ? data : [])
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch containers'
            setError(msg)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        void fetchContainers(false)
    }, [fetchContainers])

    const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
        setActionPendingId(id)
        try {
            await apiFetch(`/api/containers/${id}/${action}`, { method: 'POST' })
            await fetchContainers(true)
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

        const q = searchQuery.trim().toLowerCase()
        if (!q) return list

        return list.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.image.toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q) ||
                (c.short_id && c.short_id.toLowerCase().includes(q))
        )
    }, [containers, searchQuery, statusFilter])

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
            {/* Navigation & Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    pb: 1.5,
                    borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {onBack && (
                        <Button
                            onClick={onBack}
                            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                color: m3Tokens.onSurfaceVariant,
                                textTransform: 'none',
                                fontSize: 13,
                                px: 1.5,
                                py: 0.75,
                                borderRadius: '8px',
                                border: `1px solid ${m3Tokens.outlineVariant}`,
                                bgcolor: m3Tokens.surfaceContainerLow,
                                '&:hover': {
                                    color: m3Tokens.onSurface,
                                    bgcolor: m3Tokens.surfaceContainerHigh,
                                },
                            }}
                        >
                            Back to Environments
                        </Button>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
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
                                Containers
                            </Typography>

                            {/* Project Badge */}
                            <Box
                                sx={{
                                    px: 1.25,
                                    py: 0.35,
                                    borderRadius: '12px',
                                    bgcolor: 'rgba(208, 188, 255, 0.08)',
                                    border: '1px solid rgba(208, 188, 255, 0.25)',
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
                                {projectName}
                            </Box>

                            {/* Environment Badge */}
                            <Box
                                sx={{
                                    px: 1.25,
                                    py: 0.35,
                                    borderRadius: '12px',
                                    bgcolor: m3Tokens.surfaceContainerHigh,
                                    border: `1px solid ${m3Tokens.outlineVariant}`,
                                    fontSize: 12,
                                    fontFamily: m3Tokens.fontCode,
                                    color: m3Tokens.onSurface,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    textTransform: 'capitalize',
                                }}
                            >
                                <LayersIcon sx={{ fontSize: 14, color: m3Tokens.primary }} />
                                {envName}
                            </Box>

                            {/* Container count */}
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
                                {containers.length} total
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
                            Active containers and workloads running for this environment
                        </Typography>
                    </Box>
                </Box>

                {/* Right Actions: Filter & Refresh */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
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
                            placeholder="Filter containers..."
                            sx={{
                                border: 'none',
                                outline: 'none',
                                bgcolor: 'transparent',
                                color: m3Tokens.onSurface,
                                fontSize: 13,
                                fontFamily: m3Tokens.fontSans,
                                width: { xs: 120, sm: 180 },
                                '&::placeholder': {
                                    color: m3Tokens.onSurfaceVariant,
                                    opacity: 0.7,
                                },
                            }}
                        />
                    </Box>

                    {/* Status Filter Tabs */}
                    <Box
                        sx={{
                            display: 'flex',
                            bgcolor: m3Tokens.surfaceContainerLow,
                            p: 0.5,
                            borderRadius: '8px',
                            border: `1px solid ${m3Tokens.outlineVariant}`,
                        }}
                    >
                        {(['all', 'running', 'stopped'] as const).map((s) => (
                            <Button
                                key={s}
                                size="small"
                                onClick={() => setStatusFilter(s)}
                                sx={{
                                    fontSize: 11,
                                    fontFamily: m3Tokens.fontCode,
                                    textTransform: 'uppercase',
                                    px: 1.25,
                                    py: 0.25,
                                    minWidth: 'auto',
                                    borderRadius: '6px',
                                    color: statusFilter === s ? m3Tokens.onPrimary : m3Tokens.onSurfaceVariant,
                                    bgcolor: statusFilter === s ? m3Tokens.primary : 'transparent',
                                    '&:hover': {
                                        bgcolor: statusFilter === s ? m3Tokens.primary : 'rgba(255,255,255,0.04)',
                                    },
                                }}
                            >
                                {s} {s === 'running' ? `(${runningCount})` : s === 'stopped' ? `(${stoppedCount})` : ''}
                            </Button>
                        ))}
                    </Box>

                    {/* Refresh Button */}
                    <Tooltip title="Refresh containers" arrow>
                        <IconButton
                            onClick={() => fetchContainers(true)}
                            disabled={isRefreshing}
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '6px',
                                bgcolor: m3Tokens.surfaceContainer,
                                border: `1px solid ${m3Tokens.outlineVariant}`,
                                color: m3Tokens.onSurfaceVariant,
                                '&:hover': {
                                    color: m3Tokens.onSurface,
                                    borderColor: m3Tokens.primary,
                                },
                            }}
                        >
                            <RefreshIcon
                                sx={{
                                    fontSize: 18,
                                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' },
                                    },
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => fetchContainers(true)}>
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

            {/* Containers List / Grid */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={36} sx={{ color: m3Tokens.primary }} />
                </Box>
            ) : filteredContainers.length === 0 ? (
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
                        <ContainerIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 600, color: m3Tokens.onSurface }}>
                        {containers.length === 0 ? 'No containers deployed' : 'No matching containers'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, maxWidth: 420 }}>
                        {containers.length === 0
                            ? `No active containers were found in environment "${envName}". Deploy a container or check your Docker engine.`
                            : `No containers matched your filter "${searchQuery}".`}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            setSearchQuery('')
                            setStatusFilter('all')
                            fetchContainers(true)
                        }}
                        sx={{
                            mt: 1,
                            borderColor: m3Tokens.outlineVariant,
                            color: m3Tokens.primary,
                            textTransform: 'none',
                        }}
                    >
                        Reset Filters
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredContainers.map((container) => {
                        const isRunning = container.state === 'running'
                        const isPending = actionPendingId === container.id

                        return (
                            <Box
                                key={container.id}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '14px',
                                    bgcolor: m3Tokens.surfaceContainer,
                                    border: `1px solid ${m3Tokens.outlineVariant}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 2,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: isRunning ? 'rgba(208, 188, 255, 0.4)' : m3Tokens.outline,
                                        bgcolor: m3Tokens.surfaceContainerHigh,
                                    },
                                }}
                            >
                                {/* Left Container Info */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 260 }}>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '10px',
                                            bgcolor: m3Tokens.surfaceContainerLow,
                                            border: `1px solid ${m3Tokens.outlineVariant}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <ContainerIcon
                                            sx={{
                                                fontSize: 24,
                                                color: isRunning ? m3Tokens.primary : m3Tokens.outline,
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                width: 9,
                                                height: 9,
                                                borderRadius: '50%',
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                bgcolor: isRunning ? '#4CAF50' : '#F44336',
                                                boxShadow: isRunning ? '0 0 6px #4CAF50' : 'none',
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 15,
                                                    fontWeight: 600,
                                                    color: m3Tokens.onSurface,
                                                    fontFamily: m3Tokens.fontCode,
                                                }}
                                            >
                                                {container.name.replace(/^\//, '')}
                                            </Typography>
                                            <Chip
                                                label={container.short_id || container.id.slice(0, 10)}
                                                size="small"
                                                icon={<TagIcon sx={{ fontSize: '12px !important' }} />}
                                                sx={{
                                                    height: 20,
                                                    fontSize: 11,
                                                    fontFamily: m3Tokens.fontCode,
                                                    bgcolor: m3Tokens.surfaceContainerLow,
                                                    color: m3Tokens.onSurfaceVariant,
                                                    border: `1px solid ${m3Tokens.outlineVariant}`,
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                                color: m3Tokens.onSurfaceVariant,
                                                fontFamily: m3Tokens.fontCode,
                                                mt: 0.25,
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {container.image}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Middle Metadata: Status & Ports */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={container.state.toUpperCase()}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            fontFamily: m3Tokens.fontCode,
                                            bgcolor: isRunning ? 'rgba(76, 175, 80, 0.12)' : 'rgba(244, 67, 54, 0.12)',
                                            color: isRunning ? '#81C784' : '#E57373',
                                            border: `1px solid ${isRunning ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
                                        }}
                                    />

                                    {container.status && (
                                        <Typography
                                            sx={{
                                                fontSize: 11,
                                                fontFamily: m3Tokens.fontCode,
                                                color: m3Tokens.onSurfaceVariant,
                                            }}
                                        >
                                            {container.status}
                                        </Typography>
                                    )}

                                    {Array.isArray(container.ports) && container.ports.length > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                            {container.ports.map((p, idx) => (
                                                <Chip
                                                    key={idx}
                                                    icon={<PortIcon sx={{ fontSize: '12px !important' }} />}
                                                    label={p.public_port ? `${p.public_port}:${p.private_port}` : `${p.private_port}`}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: 10,
                                                        fontFamily: m3Tokens.fontCode,
                                                        bgcolor: m3Tokens.surfaceContainerLow,
                                                        color: m3Tokens.primary,
                                                        border: `1px solid ${m3Tokens.outlineVariant}`,
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>

                                {/* Right Actions: Start / Stop / Restart */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isPending ? (
                                        <CircularProgress size={22} sx={{ color: m3Tokens.primary, mx: 1 }} />
                                    ) : (
                                        <>
                                            {isRunning ? (
                                                <Tooltip title="Stop container" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleAction(container.id, 'stop')}
                                                        sx={{
                                                            color: m3Tokens.error,
                                                            bgcolor: 'rgba(255, 180, 171, 0.08)',
                                                            border: '1px solid rgba(255, 180, 171, 0.2)',
                                                            borderRadius: '6px',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255, 180, 171, 0.16)',
                                                            },
                                                        }}
                                                    >
                                                        <StopIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Start container" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleAction(container.id, 'start')}
                                                        sx={{
                                                            color: '#81C784',
                                                            bgcolor: 'rgba(76, 175, 80, 0.08)',
                                                            border: '1px solid rgba(76, 175, 80, 0.2)',
                                                            borderRadius: '6px',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(76, 175, 80, 0.16)',
                                                            },
                                                        }}
                                                    >
                                                        <PlayIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            <Tooltip title="Restart container" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAction(container.id, 'restart')}
                                                    sx={{
                                                        color: m3Tokens.primary,
                                                        bgcolor: 'rgba(208, 188, 255, 0.08)',
                                                        border: '1px solid rgba(208, 188, 255, 0.2)',
                                                        borderRadius: '6px',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(208, 188, 255, 0.16)',
                                                        },
                                                    }}
                                                >
                                                    <RestartIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
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

export default ContainerView
