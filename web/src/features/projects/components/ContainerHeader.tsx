import {
    Box,
    Button,
    Typography,
    IconButton,
    Tooltip,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    FolderOutlined as FolderIcon,
    LayersOutlined as LayersIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import { ContainerFilterBar } from './ContainerFilterBar'

export interface ContainerHeaderProps {
    projectName: string
    envName: string
    totalCount: number
    runningCount: number
    stoppedCount: number
    searchQuery: string
    onSearchChange: (value: string) => void
    statusFilter: 'all' | 'running' | 'stopped'
    onStatusFilterChange: (status: 'all' | 'running' | 'stopped') => void
    isRefreshing: boolean
    onRefresh: () => void
    onBack?: () => void
    onNewContainer?: () => void
}

export function ContainerHeader({
    projectName,
    envName,
    totalCount,
    runningCount,
    stoppedCount,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    isRefreshing,
    onRefresh,
    onBack,
    onNewContainer,
}: ContainerHeaderProps) {
    return (
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
                            {totalCount} total
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
                <ContainerFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    statusFilter={statusFilter}
                    onStatusFilterChange={onStatusFilterChange}
                    runningCount={runningCount}
                    stoppedCount={stoppedCount}
                />

                {/* New Container Button */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                    onClick={onNewContainer || (() => { })}
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
                    New Container
                </Button>

                {/* Refresh Button */}
                <Tooltip title="Refresh containers" arrow>
                    <IconButton
                        onClick={onRefresh}
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
    )
}
