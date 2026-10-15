import { useState } from 'react'
import {
    Box,
    Button,
    Typography,
    TextField,
    InputAdornment,
    Divider,
    Chip,
    IconButton,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    FolderOutlined as FolderIcon,
    DescriptionOutlined as DescriptionIcon,
    Add as AddIcon,
    Code as CodeIcon,
    DeleteOutlined as DeleteIcon,
    VpnKeyOutlined as KeyIcon,
} from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'
import { Footer } from '../footer/footer'
import { getAuthHeaders } from '../../api/client'

interface NewProjectsProps {
    onBack?: () => void
}

interface EnvVar {
    key: string
    value: string
}

export function NewProjects({ onBack }: NewProjectsProps) {
    const [projectName, setProjectName] = useState('')
    const [projectDescription, setProjectDescription] = useState('')
    const [environment] = useState('production')
    const [envVars, setEnvVars] = useState<EnvVar[]>([
        { key: 'PORT', value: '8080' },
        { key: 'NODE_ENV', value: 'production' },
    ])

    const handleAddEnv = () => {
        setEnvVars((prev) => [...prev, { key: '', value: '' }])
    }

    const handleUpdateEnv = (index: number, field: 'key' | 'value', val: string) => {
        setEnvVars((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
        )
    }

    const handleRemoveEnv = (index: number) => {
        setEnvVars((prev) => prev.filter((_, i) => i !== index))
    }

    const createProject = async () => {
        if (!projectName.trim()) {
            alert('Please enter a project name')
            return
        }

        try {
            const params = new URLSearchParams({
                project_name: projectName.trim(),
                project_description: projectDescription.trim(),
            })
            const res = await fetch(`/api/projects/new?${params.toString()}`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            })
            const text = await res.text()
            if (res.ok) {
                alert(text || 'Project created successfully')
            } else {
                alert(`Error: ${text || res.statusText}`)
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Network error'
            alert(`Error: ${errorMsg}`)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createProject()
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, width: '100%' }}>
            {/* Top action / navigation header */}
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
                    {onBack && (
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
                            Back to Projects
                        </Button>
                    )}
                    <Box>
                        <Typography
                            component="h1"
                            onClick={createProject}
                            sx={{
                                fontSize: 26,
                                fontWeight: 600,
                                color: m3Tokens.onSurface,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2,
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                        >
                            Initialize New Project
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, mt: 0.25 }}>
                            Set up workspace configuration, environment variables, and network endpoints.
                        </Typography>
                    </Box>
                </Box>

                <Chip
                    label="Draft Configuration"
                    size="small"
                    sx={{
                        bgcolor: m3Tokens.surfaceContainerHigh,
                        color: m3Tokens.primary,
                        border: `1px solid ${m3Tokens.outlineVariant}`,
                        fontFamily: m3Tokens.fontCode,
                        fontSize: 11,
                        fontWeight: 600,
                    }}
                />
            </Box>

            {/* Responsive Full-Width 2-Column Grid */}
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 360px', xl: '1fr 400px' },
                    gap: 3,
                    alignItems: 'start',
                    width: '100%',
                }}
            >
                {/* Left Primary Column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Section 1: General Info */}
                    <Box
                        sx={{
                            bgcolor: m3Tokens.surfaceContainer,
                            border: `1px solid ${m3Tokens.outlineVariant}`,
                            borderRadius: '16px',
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <FolderIcon sx={{ color: m3Tokens.primary, fontSize: 22 }} />
                            <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                                General Information
                            </Typography>
                        </Box>

                        <TextField
                            label="Project Name"
                            placeholder="e.g. telemetry-api"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            required
                            fullWidth
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CodeIcon sx={{ color: m3Tokens.outline, fontSize: 18 }} />
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
                                '& .MuiFormHelperText-root': {
                                    color: m3Tokens.primary,
                                    fontFamily: m3Tokens.fontCode,
                                    fontSize: 11,
                                },
                            }}
                        />

                        <TextField
                            label="Description (Optional)"
                            placeholder="Describe the purpose, architecture, or services contained in this project..."
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                            <DescriptionIcon sx={{ color: m3Tokens.outline, fontSize: 18 }} />
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
                    </Box>

                    {/* Section 3: Environment Variables */}
                    <Box
                        sx={{
                            bgcolor: m3Tokens.surfaceContainer,
                            border: `1px solid ${m3Tokens.outlineVariant}`,
                            borderRadius: '16px',
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <KeyIcon sx={{ color: m3Tokens.primary, fontSize: 22 }} />
                                <Box>
                                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                                        Environment Variables
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                                        Configured secrets and values injected at runtime
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                size="small"
                                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                                onClick={handleAddEnv}
                                sx={{
                                    color: m3Tokens.primary,
                                    textTransform: 'none',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: 'rgba(208, 188, 255, 0.08)' },
                                }}
                            >
                                Add Variable
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {envVars.map((item, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 40px',
                                        gap: 1.5,
                                        alignItems: 'center',
                                    }}
                                >
                                    <TextField
                                        placeholder="KEY"
                                        value={item.key}
                                        onChange={(e) => handleUpdateEnv(idx, 'key', e.target.value)}
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: m3Tokens.surfaceContainerLow,
                                                borderRadius: '6px',
                                                fontFamily: m3Tokens.fontCode,
                                                fontSize: 12,
                                                '& fieldset': { borderColor: m3Tokens.outlineVariant },
                                            },
                                        }}
                                    />
                                    <TextField
                                        placeholder="VALUE"
                                        value={item.value}
                                        onChange={(e) => handleUpdateEnv(idx, 'value', e.target.value)}
                                        size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: m3Tokens.surfaceContainerLow,
                                                borderRadius: '6px',
                                                fontFamily: m3Tokens.fontCode,
                                                fontSize: 12,
                                                '& fieldset': { borderColor: m3Tokens.outlineVariant },
                                            },
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveEnv(idx)}
                                        sx={{
                                            color: m3Tokens.outline,
                                            '&:hover': { color: m3Tokens.error, bgcolor: 'rgba(255, 180, 171, 0.08)' },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Right Sticky Column: Architecture Blueprint & Actions */}
                <Box
                    sx={{
                        position: { lg: 'sticky' },
                        top: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                    }}
                >
                    {/* Blueprint Card */}
                    <Box
                        sx={{
                            bgcolor: m3Tokens.surfaceContainer,
                            border: `1px solid ${m3Tokens.outlineVariant}`,
                            borderRadius: '16px',
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                            boxShadow: m3Tokens.cardShadow,
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: m3Tokens.outline,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    fontWeight: 600,
                                }}
                            >
                                Project Blueprint
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: m3Tokens.onSurface,
                                    mt: 0.5,
                                    wordBreak: 'break-all',
                                }}
                            >
                                {projectName.trim() || 'untitled-project'}
                            </Typography>

                        </Box>

                        <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

                        {/* Feature Specs */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <Typography sx={{ color: m3Tokens.outline, fontSize: 12 }}>Environment</Typography>
                                <Typography sx={{ color: m3Tokens.onSurface, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>
                                    {environment}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <Typography sx={{ color: m3Tokens.outline, fontSize: 12 }}>Variables</Typography>
                                <Typography sx={{ color: m3Tokens.onSurface, fontSize: 12, fontWeight: 500, fontFamily: m3Tokens.fontCode }}>
                                    {envVars.length} configured
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

                        {/* Primary Actions */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                                disabled={!projectName.trim()}
                                sx={{
                                    height: 44,
                                    borderRadius: '8px',
                                    bgcolor: m3Tokens.primary,
                                    color: m3Tokens.onPrimary,
                                    textTransform: 'none',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: m3Tokens.primary,
                                        opacity: 0.95,
                                        boxShadow: `0 0 16px ${m3Tokens.primary}`,
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: m3Tokens.surfaceContainerHighest,
                                        color: m3Tokens.outline,
                                    },
                                }}
                            >
                                Create Project
                            </Button>

                            {onBack && (
                                <Button
                                    type="button"
                                    onClick={onBack}
                                    sx={{
                                        height: 38,
                                        color: m3Tokens.onSurfaceVariant,
                                        textTransform: 'none',
                                        fontSize: 13,
                                        borderRadius: '8px',
                                        '&:hover': {
                                            color: m3Tokens.onSurface,
                                            bgcolor: m3Tokens.surfaceContainerHigh,
                                        },
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Footer />
        </Box>
    )
}

export default NewProjects
