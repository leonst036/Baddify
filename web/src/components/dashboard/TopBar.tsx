import { Box, Typography, IconButton, Tooltip, Button } from '@mui/material'
import { NotificationsNone as NotificationsIcon } from '@mui/icons-material'
import { m3Tokens } from '../../theme/m3Tokens'
import { useState } from 'react'

export function TopBar() {

  const [activeTab, setActiveTab] = useState('overview')

  return (
    <Box
      component="header"
      sx={{
        height: 64,
        bgcolor: 'rgba(29, 27, 33, 0.7)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${m3Tokens.outlineVariant}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Context Badge & Identifier Slot */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontFamily: m3Tokens.fontCode,
            fontSize: 12,
          }}
        >
          <Button
            component="span"
            onClick={() => {
              setActiveTab('overview')
            }}
            sx={{
              px: 1.5,
              py: 0.5,
              minWidth: 'auto',
              borderRadius: '4px',
              bgcolor: activeTab === 'overview' ? m3Tokens.primary : m3Tokens.surfaceContainer,
              border: `1px solid ${m3Tokens.outlineVariant}`,
              color: activeTab === 'overview' ? m3Tokens.onPrimary : m3Tokens.onSurface,
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              '&:hover': {
                bgcolor: activeTab === 'overview' ? m3Tokens.primary : m3Tokens.surfaceContainerHigh,
              },
            }}
          >
            Overview
          </Button>
          <Typography
            component="span"
            sx={{
              color: m3Tokens.outlineVariant,
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
            }}
          >
            /
          </Typography>
        </Box>
      </Box>

      {/* Right: Utility Frames & Status Node */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Status Indicator Pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 0.75,
            borderRadius: 9999,
            bgcolor: m3Tokens.surfaceContainer,
            border: `1px solid ${m3Tokens.outlineVariant}`,
            color: m3Tokens.primary,
            fontFamily: m3Tokens.fontCode,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: m3Tokens.primary,
              animation: 'pulse 2s infinite',
            }}
          />
          <span>Not Connected - Development</span>
        </Box>

        <Box
          sx={{
            height: 20,
            width: '1px',
            bgcolor: m3Tokens.outlineVariant,
          }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Notifications" arrow>
            <IconButton
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: m3Tokens.surfaceContainer,
                border: `1px solid ${m3Tokens.outlineVariant}`,
                color: m3Tokens.onSurfaceVariant,
                '&:hover': {
                  bgcolor: m3Tokens.surfaceContainerHigh,
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}

export default TopBar
