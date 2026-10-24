import { Box, Typography, IconButton, Tooltip, Button } from '@mui/material'
import { NotificationsNone as NotificationsIcon } from '@mui/icons-material'
import { m3Tokens } from '@/theme/m3Tokens'

interface TopBarProps {
  activeNav?: number
  subTitle?: string
  onTitleClick?: () => void
}

const NAV_TITLES: Record<number, string> = {
  0: 'Overview',
  1: 'Projects',
  2: 'Storage',
  3: 'Servers',
  4: 'Settings',
}

export function TopBar({ activeNav = 0, subTitle, onTitleClick }: TopBarProps) {
  const currentTitle = NAV_TITLES[activeNav] || 'Overview'

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
            onClick={onTitleClick}
            component={onTitleClick ? 'button' : 'span'}
            sx={{
              px: 1.5,
              py: 0.5,
              minWidth: 'auto',
              borderRadius: '4px',
              bgcolor: subTitle ? m3Tokens.surfaceContainer : m3Tokens.primary,
              border: `1px solid ${m3Tokens.outlineVariant}`,
              color: subTitle ? m3Tokens.onSurfaceVariant : m3Tokens.onPrimary,
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              cursor: onTitleClick ? 'pointer' : 'default',
              textTransform: 'none',
              '&:hover': onTitleClick
                ? {
                  bgcolor: m3Tokens.surfaceContainerHigh,
                  color: m3Tokens.onSurface,
                }
                : undefined,
            }}
          >
            {currentTitle}
          </Button>

          <Typography
            component="span"
            sx={{
              color: m3Tokens.outlineVariant,
              fontFamily: m3Tokens.fontCode,
              fontSize: 12,
              px: 0.25,
            }}
          >
            {subTitle ? '>' : '/'}
          </Typography>

          {subTitle && (
            <Button
              component="span"
              sx={{
                px: 1.5,
                py: 0.5,
                minWidth: 'auto',
                borderRadius: '4px',
                bgcolor: m3Tokens.primary,
                border: `1px solid ${m3Tokens.outlineVariant}`,
                color: m3Tokens.onPrimary,
                fontFamily: m3Tokens.fontCode,
                fontSize: 12,
                textTransform: 'none',
              }}
            >
              {subTitle}
            </Button>
          )}
        </Box>
      </Box>

      {/* Right: Utility Frames & Status Node */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

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
