import { useState } from 'react'
import { Box } from '@mui/material'
import { m3Tokens } from '../../theme/m3Tokens'
import { useTelemetry } from '../../hooks/useTelemetry'
import { Sidebar, TopBar } from './shared'
import {
  DashboardHeader,
  MetricsGrid,
  NodeDetails,
  WorkloadAllocations,
} from './home'

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
        {/* Top Bar Frame: Shared Shell Header */}
        <TopBar />

        {/* Main Content Area: High-Density Developer Viewport */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Page Header Zone: Home Scaffolding Header & Primary Action Slot */}
          <DashboardHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Resource Overview Strip: Telemetry Metrics Grid Slots */}
          <MetricsGrid telemetry={telemetry} />

          {/* Core Layout Grid: Service & Workload Container Slots */}
          <Box
            component="section"
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: '2fr 1fr',
              },
              gap: 2,
            }}
          >
            {/* Large Workspace Frame (2 Columns Span) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <WorkloadAllocations />
            </Box>

            {/* Right Side Panel Frame (1 Column Span) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NodeDetails />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default ControlPlaneDashboard
