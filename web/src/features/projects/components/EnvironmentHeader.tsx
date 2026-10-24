import React from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FolderOutlined as FolderIcon,
} from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

export interface EnvironmentHeaderProps {
  projectName: string
  environmentsCount: number
  searchQuery: string
  onSearchChange: (value: string) => void
  isRefreshing: boolean
  onRefresh: () => void
  onNewEnvironment: () => void
  onBack?: () => void
}

export function EnvironmentHeader({
  projectName,
  environmentsCount,
  searchQuery,
  onSearchChange,
  isRefreshing,
  onRefresh,
  onNewEnvironment,
  onBack,
}: EnvironmentHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1.5,
        borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
        flexWrap: 'wrap',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              border: `1px solid ${m3Tokens.outlineVariant}`,
              bgcolor: m3Tokens.surfaceContainer,
              color: m3Tokens.onSurface,
              '&:hover': {
                bgcolor: m3Tokens.surfaceContainerHigh,
                borderColor: m3Tokens.primary,
                color: m3Tokens.primary,
              },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
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
              Environments
            </Typography>

            {/* Project Badge */}
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: '12px',
                bgcolor: 'rgba(208, 188, 255, 0.08)',
                border: `1px solid rgba(208, 188, 255, 0.25)`,
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
              {environmentsCount} total
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
            Manage environment settings and variables
          </Typography>
        </Box>
      </Box>

      {/* Right Action Header Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            transition: 'border-color 0.2s',
            '&:focus-within': {
              borderColor: m3Tokens.primary,
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: m3Tokens.onSurfaceVariant, opacity: 0.8 }} />
          <Box
            component="input"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            placeholder="Filter environments..."
            sx={{
              border: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              color: m3Tokens.onSurface,
              fontSize: 13,
              fontFamily: m3Tokens.fontSans,
              width: 170,
              '&::placeholder': {
                color: m3Tokens.onSurfaceVariant,
                opacity: 0.6,
              },
            }}
          />
        </Box>

        {/* Refresh Button */}
        <IconButton
          onClick={onRefresh}
          title="Refresh environments"
          sx={{
            width: 38,
            height: 38,
            borderRadius: '6px',
            border: `1px solid ${m3Tokens.outlineVariant}`,
            bgcolor: m3Tokens.surfaceContainer,
            color: m3Tokens.onSurfaceVariant,
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: m3Tokens.primary,
              color: m3Tokens.primary,
              bgcolor: m3Tokens.surfaceContainerHigh,
            },
          }}
        >
          <RefreshIcon
            sx={{
              fontSize: 18,
              animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
              '@keyframes spin': {
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        </IconButton>

        {/* New Environment Action Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={onNewEnvironment}
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
          New Environment
        </Button>
      </Box>
    </Box>
  )
}
