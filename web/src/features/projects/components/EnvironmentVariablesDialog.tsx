import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  VpnKeyOutlined as KeyIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  Close as CloseIcon,
  DeleteOutlined as DeleteIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'
import type { EnvVariable, ProjectEnvironment } from '../types'

export interface EnvironmentVariablesDialogProps {
  open: boolean
  environment: ProjectEnvironment | null
  onClose: () => void
  onUpdateVariables: (envId: string, variables: EnvVariable[]) => void
  onCopyFeedback?: (message: string) => void
}

export function EnvironmentVariablesDialog({
  open,
  environment,
  onClose,
  onUpdateVariables,
  onCopyFeedback,
}: EnvironmentVariablesDialogProps) {
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarValue, setNewVarValue] = useState('')
  const [newVarIsSecret, setNewVarIsSecret] = useState(false)

  if (!environment) return null

  const toggleRevealSecret = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text)
    onCopyFeedback?.(`${label} copied to clipboard!`)
  }

  const handleAdd = () => {
    if (!newVarKey.trim()) return

    const trimmedKey = newVarKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    const trimmedVal = newVarValue.trim()

    const updatedVars: EnvVariable[] = [
      ...environment.variables.filter((v) => v.key !== trimmedKey),
      { key: trimmedKey, value: trimmedVal, isSecret: newVarIsSecret },
    ]

    onUpdateVariables(environment.id, updatedVars)
    setNewVarKey('')
    setNewVarValue('')
    setNewVarIsSecret(false)
  }

  const handleDelete = (keyToDelete: string) => {
    const updatedVars = environment.variables.filter((v) => v.key !== keyToDelete)
    onUpdateVariables(environment.id, updatedVars)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          <KeyIcon sx={{ color: m3Tokens.primary, fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: m3Tokens.onSurface }}>
              Environment Variables
            </Typography>
            <Typography sx={{ fontSize: 12, color: m3Tokens.outline, fontFamily: m3Tokens.fontCode }}>
              {environment.name.toUpperCase()} environment
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: m3Tokens.onSurfaceVariant }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
        {/* Add New Variable inline form */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: m3Tokens.surfaceContainerLow,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: m3Tokens.onSurface }}>
            Add Variable
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <TextField
              size="small"
              placeholder="KEY (e.g. API_SECRET)"
              value={newVarKey}
              onChange={(e) => setNewVarKey(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: m3Tokens.surfaceContainer,
                  fontSize: 12,
                  fontFamily: m3Tokens.fontCode,
                  '& fieldset': { borderColor: m3Tokens.outlineVariant },
                  '&:hover fieldset': { borderColor: m3Tokens.outline },
                  '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
                },
              }}
            />

            <TextField
              size="small"
              placeholder="VALUE"
              type={newVarIsSecret ? 'password' : 'text'}
              value={newVarValue}
              onChange={(e) => setNewVarValue(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: m3Tokens.surfaceContainer,
                  fontSize: 12,
                  fontFamily: m3Tokens.fontCode,
                  '& fieldset': { borderColor: m3Tokens.outlineVariant },
                  '&:hover fieldset': { borderColor: m3Tokens.outline },
                  '&.Mui-focused fieldset': { borderColor: m3Tokens.primary },
                },
              }}
            />

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={!newVarKey.trim()}
              onClick={handleAdd}
              sx={{
                height: 38,
                bgcolor: m3Tokens.primary,
                color: m3Tokens.onPrimary,
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 600,
                '&:hover': { bgcolor: m3Tokens.primary, opacity: 0.9 },
              }}
            >
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setNewVarIsSecret((prev) => !prev)}
              sx={{
                fontSize: 11,
                fontFamily: m3Tokens.fontCode,
                color: newVarIsSecret ? m3Tokens.primary : m3Tokens.outline,
                textTransform: 'none',
              }}
            >
              {newVarIsSecret ? '🔒 Secret Enabled' : '🔓 Plaintext'}
            </Button>
          </Box>
        </Box>

        {/* List of current variables */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: m3Tokens.onSurfaceVariant }}>
            Configured Variables ({environment.variables.length})
          </Typography>

          {environment.variables.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: m3Tokens.outline, py: 2 }}>
              No environment variables configured yet.
            </Typography>
          ) : (
            environment.variables.map((v) => {
              const isRevealed = revealedKeys[v.key]

              return (
                <Box
                  key={v.key}
                  sx={{
                    p: 1.25,
                    px: 2,
                    borderRadius: '8px',
                    bgcolor: m3Tokens.surfaceContainerLow,
                    border: `1px solid ${m3Tokens.outlineVariant}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontFamily: m3Tokens.fontCode,
                        fontWeight: 600,
                        color: m3Tokens.primary,
                        minWidth: 140,
                      }}
                    >
                      {v.key}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 12,
                        fontFamily: m3Tokens.fontCode,
                        color: m3Tokens.onSurface,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {v.isSecret && !isRevealed ? '••••••••••••••••' : v.value || '""'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {v.isSecret && (
                      <Tooltip title={isRevealed ? 'Hide value' : 'Show secret'} arrow>
                        <IconButton
                          size="small"
                          onClick={() => toggleRevealSecret(v.key)}
                          sx={{ color: m3Tokens.onSurfaceVariant }}
                        >
                          {isRevealed ? (
                            <VisibilityOffIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Copy value" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(v.value, v.key)}
                        sx={{ color: m3Tokens.onSurfaceVariant }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete variable" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(v.key)}
                        sx={{
                          color: m3Tokens.onSurfaceVariant,
                          '&:hover': { color: m3Tokens.error },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )
            })
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${m3Tokens.outlineVariant}` }}>
        <Button
          onClick={onClose}
          sx={{
            color: m3Tokens.onSurfaceVariant,
            textTransform: 'none',
            fontSize: 13,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
