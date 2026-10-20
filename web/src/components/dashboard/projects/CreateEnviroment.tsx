import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
    Box,
} from "@mui/material"
import {
    LayersOutlined as LayersIcon,
    Close as CloseIcon,
} from '@mui/icons-material'
import { m3Tokens } from "../../../theme/m3Tokens"

export interface CreateEnvironmentDialogProps {
    isCreateOpen: boolean
    setIsCreateOpen: (value: boolean) => void
    newEnvName: string
    setNewEnvName: (value: string) => void
    handleCreateEnvironment: () => void
}

export function CreateEnvironmentDialog({
    isCreateOpen,
    setIsCreateOpen,
    newEnvName,
    setNewEnvName,
    handleCreateEnvironment,
}: CreateEnvironmentDialogProps) {
    return (
        <Dialog
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: m3Tokens.surfaceContainer,
                        border: `1px solid ${m3Tokens.outlineVariant}`,
                        borderRadius: '16px',
                        color: m3Tokens.onSurface,
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                    borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <LayersIcon sx={{ color: m3Tokens.primary, fontSize: 22 }} />
                    <Typography sx={{ fontSize: 18, fontWeight: 600, color: m3Tokens.onSurface }}>
                        Create Environment
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={() => setIsCreateOpen(false)}
                    sx={{ color: m3Tokens.onSurfaceVariant }}
                >
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
                <TextField
                    label="Environment Name"
                    placeholder="e.g. production, staging, development"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    required
                    fullWidth
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
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${m3Tokens.outlineVariant}`, gap: 1 }}>
                <Button
                    onClick={() => setIsCreateOpen(false)}
                    sx={{
                        color: m3Tokens.onSurfaceVariant,
                        textTransform: 'none',
                        fontSize: 13,
                    }}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    disabled={!newEnvName.trim()}
                    onClick={handleCreateEnvironment}
                    sx={{
                        bgcolor: m3Tokens.primary,
                        color: m3Tokens.onPrimary,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        borderRadius: '8px',
                        px: 2.5,
                        '&:hover': { bgcolor: m3Tokens.primary, opacity: 0.95 },
                    }}
                >
                    Create Environment
                </Button>
            </DialogActions>
        </Dialog>
    )
}