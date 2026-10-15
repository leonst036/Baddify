import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'
import { useTelemetry } from '../../hooks/useTelemetry'
import { DashboardCard, Sidebar, TopBar } from './shared'
import { HomeView } from './home'
import { ProjectsView } from './projects'

export function ControlPlaneDashboard() {
  const [activeNav, setActiveNav] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const telemetry = useTelemetry()

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        bgcolor: m3Tokens.background,
        color: m3Tokens.onSurface,
        fontFamily: m3Tokens.fontSans,
        userSelect: 'none',
      }}
    >
      {/* Structural Left Shell: Shared Navigation Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        cpuData={telemetry.cpuData}
        ramData={telemetry.ramData}
      />

      {/* Primary Workspace Canvas Frame */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minWidth: 0,
          bgcolor: m3Tokens.background,
          overflow: 'hidden',
        }}
      >
        {/* Top Bar Frame: Shared Shell Header with Active Section Badge */}
        <TopBar activeNav={activeNav} />

        {/* Main Content Area: High-Density Developer Viewport */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeNav === 0 && (
            <HomeView
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              telemetry={telemetry}
            />
          )}

          {activeNav === 1 && <ProjectsView />}

          {activeNav > 1 && (
            <DashboardCard
              sx={{
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: m3Tokens.onSurface }}>
                Work in Progress
              </Typography>
              <Typography sx={{ fontSize: 13, color: m3Tokens.onSurfaceVariant }}>
                This section is currently under development.
              </Typography>
            </DashboardCard>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ControlPlaneDashboard
