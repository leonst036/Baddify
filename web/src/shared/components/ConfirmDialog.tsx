import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material'
import { WarningAmberOutlined as WarningIcon } from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: m3Tokens.surfaceContainer,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            borderRadius: '16px',
            color: m3Tokens.onSurface,
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        {isDestructive && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: 'rgba(255, 180, 171, 0.1)',
              border: `1px solid rgba(255, 180, 171, 0.25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: m3Tokens.error,
              flexShrink: 0,
            }}
          >
            <WarningIcon sx={{ fontSize: 20 }} />
          </Box>
        )}
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: m3Tokens.onSurface }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        {typeof message === 'string' ? (
          <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant, lineHeight: 1.5 }}>
            {message}
          </Typography>
        ) : (
          message
        )}
      </DialogContent>

      <DialogActions sx={{ pt: 2, px: 2, pb: 1 }}>
        <Button
          onClick={onCancel}
          disabled={isLoading}
          sx={{
            color: m3Tokens.onSurfaceVariant,
            textTransform: 'none',
            fontSize: 13,
            '&:hover': { color: m3Tokens.onSurface },
          }}
        >
          {cancelText}
        </Button>

        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{
            bgcolor: isDestructive ? m3Tokens.error : m3Tokens.primary,
            color: isDestructive ? m3Tokens.onError : m3Tokens.onPrimary,
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: '8px',
            px: 2,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: isDestructive ? m3Tokens.error : m3Tokens.primary,
              opacity: 0.9,
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
