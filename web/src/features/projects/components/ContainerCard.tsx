import {
    Box,
    Typography,
    Chip,
    IconButton,
    CircularProgress,
    Tooltip,
} from '@mui/material'
import {
    Inventory2Outlined as ContainerIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    RestartAlt as RestartIcon,
    Tag as TagIcon,
    LanOutlined as PortIcon,
    SettingsOutlined as SettingsIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import type { ContainerItem } from '@/api/types'

export interface ContainerCardProps {
    container: ContainerItem
    isPending: boolean
    onAction: (id: string, action: 'start' | 'stop' | 'restart') => void
    onConfigure?: (container: ContainerItem) => void
}

export function ContainerCard({
    container,
    isPending,
    onAction,
    onConfigure,
}: ContainerCardProps) {
    const isRunning = container.state === 'running'

    return (
        <Box
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
                                    onClick={() => onAction(container.id, 'stop')}
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
                                    onClick={() => onAction(container.id, 'start')}
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
                                onClick={() => onAction(container.id, 'restart')}
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

                        {onConfigure && (
                            <Tooltip title="Configure container" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => onConfigure(container)}
                                    sx={{
                                        color: m3Tokens.onSurfaceVariant,
                                        bgcolor: m3Tokens.surfaceContainerLow,
                                        border: `1px solid ${m3Tokens.outlineVariant}`,
                                        borderRadius: '6px',
                                        '&:hover': {
                                            color: m3Tokens.primary,
                                            bgcolor: 'rgba(208, 188, 255, 0.08)',
                                            borderColor: m3Tokens.primary,
                                        },
                                    }}
                                >
                                    <SettingsIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </>
                )}
            </Box>
        </Box>
    )
}
