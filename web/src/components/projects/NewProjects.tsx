
import { Box, Button, Typography } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'
import { Footer } from '../footer/footer'

interface NewProjectsProps {
    onBack?: () => void
}

export function NewProjects({ onBack }: NewProjectsProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
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
                                '&:hover': {
                                    color: m3Tokens.onSurface,
                                    bgcolor: m3Tokens.surfaceContainerHigh,
                                },
                            }}
                        >
                            Back
                        </Button>
                    )}
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: 28,
                            fontWeight: 600,
                            color: m3Tokens.onSurface,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                        }}
                    >
                        Create New Project
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: m3Tokens.onSurfaceVariant, fontSize: 14 }}>
                    Configure and create a new project.
                </Typography>
            </Box>

            <Footer />
        </Box>
    )
}

export default NewProjects
