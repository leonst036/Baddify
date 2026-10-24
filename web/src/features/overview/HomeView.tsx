import { Box } from '@mui/material'
import type { TelemetryState } from '@/hooks/useTelemetry'
import { DashboardHeader } from './components/DashboardHeader'
import { MetricsGrid } from './components/MetricsGrid'
import { WorkloadAllocations } from './components/WorkloadAllocations'
import { NodeDetails } from './components/NodeDetails'
import { Footer } from '@/components/common'

interface HomeViewProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  telemetry: TelemetryState
}

export function HomeView({ searchQuery, onSearchChange, telemetry }: HomeViewProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header Zone: Home Scaffolding Header & Primary Action Slot */}
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
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
      <Footer />
    </Box>
  )
}

export default HomeView
