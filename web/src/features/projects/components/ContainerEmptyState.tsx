import { Box, Button, Typography } from '@mui/material'
import { Inventory2Outlined as ContainerIcon } from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface ContainerEmptyStateProps {
    hasContainers: boolean
    envName: string
    searchQuery: string
    onReset: () => void
}

export function ContainerEmptyState({
    hasContainers,
    envName,
    searchQuery,
    onReset,
}: ContainerEmptyStateProps) {
    return (
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
                {!hasContainers ? 'No containers deployed' : 'No matching containers'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, maxWidth: 420 }}>
                {!hasContainers
                    ? `No active containers were found in environment "${envName}". Deploy a container or check your Docker engine.`
                    : `No containers matched your filter "${searchQuery}".`}
            </Typography>
            <Button
                variant="outlined"
                size="small"
                onClick={onReset}
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
    )
}
