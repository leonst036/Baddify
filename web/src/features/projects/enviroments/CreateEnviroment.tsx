import { useMemo, useState } from 'react'
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import {
    ArrowBack as ArrowBackIcon,
    LayersOutlined as LayersIcon,
    DescriptionOutlined as DescriptionIcon,
    VpnKeyOutlined as KeyIcon,
    Add as AddIcon,
    DeleteOutlined as DeleteIcon,
    LockOutlined as LockIcon,
    LockOpenOutlined as LockOpenIcon,
    FolderOutlined as FolderIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import { Footer } from '@/components/common'
import type { EnvVariable } from '../types'

export interface NewEnvironmentData {
    name: string
    description: string
    variables: EnvVariable[]
}

export interface CreateEnvironmentPageProps {
    projectName: string
    existingNames?: string[]
    onBack: () => void
    onCreate: (data: NewEnvironmentData) => void
}

const PRESETS = ['production', 'staging', 'development', 'preview']

const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: m3Tokens.surfaceContainerLow,
        borderRadius: '8px',
        '& fieldset': { borderColor: m3Tokens.outlineVariant },
        '&:hover fieldset': { borderColor: m3Tokens.outline },
        '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
    },
    '& .MuiInputLabel-root': { color: m3Tokens.onSurfaceVariant },
    '& .MuiInputLabel-root.Mui-focused': { color: m3Tokens.primary },
    '& .MuiFormHelperText-root': { fontFamily: m3Tokens.fontCode, fontSize: 11 },
}

const varInputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: m3Tokens.surfaceContainerLow,
        borderRadius: '6px',
        fontFamily: m3Tokens.fontCode,
        fontSize: 12,
        '& fieldset': { borderColor: m3Tokens.outlineVariant },
        '&:hover fieldset': { borderColor: m3Tokens.outline },
        '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
    },
}

const toSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
const toEnvKey = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')

export function CreateEnvironmentPage({
    projectName,
    existingNames = [],
    onBack,
    onCreate,
}: CreateEnvironmentPageProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [variables, setVariables] = useState<EnvVariable[]>([
        { key: 'NODE_ENV', value: '', isSecret: false },
        { key: 'PORT', value: '8080', isSecret: false },
    ])

    const slug = toSlug(name)
    const isDuplicate = useMemo(
        () => Boolean(slug) && existingNames.some((n) => n.toLowerCase() === slug),
        [slug, existingNames]
    )
    const validVariables = variables.filter((v) => v.key.trim())
    const canSubmit = Boolean(slug) && !isDuplicate

    const updateVariable = (index: number, patch: Partial<EnvVariable>) => {
        setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))
    }

    const addVariable = () => {
        setVariables((prev) => [...prev, { key: '', value: '', isSecret: false }])
    }

    const removeVariable = (index: number) => {
        setVariables((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        // Deduplicate keys, last one wins
        const byKey = new Map<string, EnvVariable>()
        validVariables.forEach((v) => {
            const key = toEnvKey(v.key)
            const value = key === 'NODE_ENV' && !v.value.trim() ? slug : v.value.trim()
            byKey.set(key, { key, value, isSecret: v.isSecret })
        })

        onCreate({
            name: slug,
            description: description.trim() || 'Project environment',
            variables: Array.from(byKey.values()),
        })
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
                        Back to Environments
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
                            Create Environment
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, mt: 0.25 }}>
                            Add a new deployment environment with its own configuration and variables.
                        </Typography>
                    </Box>
                </Box>

                <Chip
                    icon={<FolderIcon sx={{ fontSize: '14px !important' }} />}
                    label={projectName}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(208, 188, 255, 0.08)',
                        color: m3Tokens.primary,
                        border: '1px solid rgba(208, 188, 255, 0.25)',
                        fontFamily: m3Tokens.fontCode,
                        fontSize: 11,
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: m3Tokens.primary },
                    }}
                />
            </Box>

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
                {/* Left column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* General info */}
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
                            <LayersIcon sx={{ color: m3Tokens.primary, fontSize: 22 }} />
                            <Typography sx={{ fontSize: 16, fontWeight: 600, color: m3Tokens.onSurface }}>
                                General Information
                            </Typography>
                        </Box>

                        <TextField
                            id="create-env-name"
                            label="Environment Name"
                            placeholder="e.g. production, staging, development"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            fullWidth
                            autoFocus
                            error={isDuplicate}
                            helperText={
                                isDuplicate
                                    ? `An environment named "${slug}" already exists`
                                    : slug && slug !== name.trim()
                                        ? `Will be saved as "${slug}"`
                                        : ' '
                            }
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LayersIcon sx={{ color: m3Tokens.outline, fontSize: 18 }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            sx={{
                                ...inputSx,
                                '& .MuiFormHelperText-root': {
                                    ...inputSx['& .MuiFormHelperText-root'],
                                    color: isDuplicate ? m3Tokens.error : m3Tokens.primary,
                                },
                            }}
                        />

                        {/* Quick presets */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: -1 }}>
                            <Typography sx={{ fontSize: 12, color: m3Tokens.outline, mr: 0.5 }}>
                                Presets:
                            </Typography>
                            {PRESETS.map((preset) => {
                                const taken = existingNames.some((n) => n.toLowerCase() === preset)
                                const active = slug === preset
                                return (
                                    <Chip
                                        key={preset}
                                        label={preset}
                                        size="small"
                                        disabled={taken}
                                        onClick={() => setName(preset)}
                                        sx={{
                                            fontFamily: m3Tokens.fontCode,
                                            fontSize: 11,
                                            color: active ? m3Tokens.onPrimary : m3Tokens.onSurfaceVariant,
                                            bgcolor: active ? m3Tokens.primary : m3Tokens.surfaceContainerLow,
                                            border: `1px solid ${active ? m3Tokens.primary : m3Tokens.outlineVariant}`,
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                                bgcolor: active ? m3Tokens.primary : m3Tokens.surfaceContainerHigh,
                                                borderColor: m3Tokens.primary,
                                            },
                                        }}
                                    />
                                )
                            })}
                        </Box>

                        <TextField
                            id="create-env-description"
                            label="Description (Optional)"
                            placeholder="What is this environment used for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                            sx={inputSx}
                        />
                    </Box>

                    {/* Variables */}
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
                                        Initial Variables
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: m3Tokens.onSurfaceVariant }}>
                                        Values injected at runtime. Mark sensitive values as secret.
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                id="create-env-add-variable"
                                size="small"
                                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                                onClick={addVariable}
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

                        {variables.length === 0 ? (
                            <Box
                                sx={{
                                    py: 3,
                                    borderRadius: '10px',
                                    border: `1px dashed ${m3Tokens.outlineVariant}`,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography sx={{ fontSize: 12, color: m3Tokens.outline }}>
                                    No variables yet. You can also add them later.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {variables.map((v, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 40px 40px' },
                                            gap: 1.5,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <TextField
                                            placeholder="KEY"
                                            value={v.key}
                                            onChange={(e) => updateVariable(idx, { key: e.target.value })}
                                            size="small"
                                            sx={varInputSx}
                                        />
                                        <TextField
                                            placeholder={v.key === 'NODE_ENV' && slug ? slug : 'VALUE'}
                                            type={v.isSecret ? 'password' : 'text'}
                                            value={v.value}
                                            onChange={(e) => updateVariable(idx, { value: e.target.value })}
                                            size="small"
                                            sx={varInputSx}
                                        />
                                        <Tooltip title={v.isSecret ? 'Secret' : 'Plaintext'} arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => updateVariable(idx, { isSecret: !v.isSecret })}
                                                sx={{
                                                    color: v.isSecret ? m3Tokens.primary : m3Tokens.outline,
                                                    '&:hover': { bgcolor: 'rgba(208, 188, 255, 0.08)' },
                                                }}
                                            >
                                                {v.isSecret ? (
                                                    <LockIcon sx={{ fontSize: 18 }} />
                                                ) : (
                                                    <LockOpenIcon sx={{ fontSize: 18 }} />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Remove" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => removeVariable(idx)}
                                                sx={{
                                                    color: m3Tokens.outline,
                                                    '&:hover': {
                                                        color: m3Tokens.error,
                                                        bgcolor: 'rgba(255, 180, 171, 0.08)',
                                                    },
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Right sticky column: summary and actions */}
                <Box
                    sx={{
                        position: { lg: 'sticky' },
                        top: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                    }}
                >
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
                                Environment Summary
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: slug ? m3Tokens.onSurface : m3Tokens.outline,
                                    mt: 0.5,
                                    wordBreak: 'break-all',
                                    fontFamily: m3Tokens.fontCode,
                                }}
                            >
                                {slug || 'untitled-env'}
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: m3Tokens.outline, fontSize: 12 }}>Project</Typography>
                                <Typography sx={{ color: m3Tokens.onSurface, fontSize: 12, fontWeight: 500 }}>
                                    {projectName}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: m3Tokens.outline, fontSize: 12 }}>Variables</Typography>
                                <Typography
                                    sx={{
                                        color: m3Tokens.onSurface,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        fontFamily: m3Tokens.fontCode,
                                    }}
                                >
                                    {validVariables.length} configured
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ color: m3Tokens.outline, fontSize: 12 }}>Secrets</Typography>
                                <Typography
                                    sx={{
                                        color: m3Tokens.onSurface,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        fontFamily: m3Tokens.fontCode,
                                    }}
                                >
                                    {validVariables.filter((v) => v.isSecret).length}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderColor: m3Tokens.outlineVariant }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Button
                                id="create-env-submit"
                                type="submit"
                                variant="contained"
                                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                                disabled={!canSubmit}
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
                                Create Environment
                            </Button>
                            <Button
                                id="create-env-cancel"
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
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Footer />
        </Box>
    )
}

export default CreateEnvironmentPage