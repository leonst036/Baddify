import type { ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material'
import { Card } from '@mui/material'
import { m3Tokens } from '@/theme/m3Tokens'

interface DashboardCardProps {
  children: ReactNode
  sx?: SxProps<Theme>
}

export function DashboardCard({ children, sx }: DashboardCardProps) {
  return (
    <Card
      sx={{
        borderRadius: `${m3Tokens.cardRadius}px`,
        bgcolor: m3Tokens.surfaceContainer,
        border: `1px solid ${m3Tokens.outlineVariant}`,
        boxShadow: m3Tokens.cardShadow,
        ...sx,
      }}
    >
      {children}
    </Card>
  )
}

export default DashboardCard
