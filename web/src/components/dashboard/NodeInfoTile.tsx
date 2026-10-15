import type { ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material'
import { Box } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'

interface NodeInfoTileProps {
  children: ReactNode
  sx?: SxProps<Theme>
}

export function NodeInfoTile({ children, sx }: NodeInfoTileProps) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: '12px',
        bgcolor: m3Tokens.surfaceContainerLow,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export default NodeInfoTile
