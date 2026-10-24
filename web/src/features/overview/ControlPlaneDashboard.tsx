import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { m3Tokens } from '@/theme/m3Tokens'
import { useTelemetry } from '@/hooks/useTelemetry'
import { useNavigation } from '@/navigation'
import { Sidebar, TopBar } from '@/components/layout'
import { DashboardCard } from '@/components/common'
import { HomeView } from './HomeView'
import { ProjectsView } from '@/features/projects'

export function ControlPlaneDashboard() {
  const { state: navState, navigate, goBack } = useNavigation()
  const {
    activeNav,
    isCreatingProject,
    selectedProject,
    selectedEnvironment,
    isCreatingEnvironment,
    isCreatingContainer,
  } = navState
  const [searchQuery, setSearchQuery] = useState('')
  const telemetry = useTelemetry()

  const handleSelectNav = (index: number) => {
    navigate({
      activeNav: index,
      isCreatingProject: false,
      selectedProject: null,
      selectedEnvironment: null,
      isCreatingEnvironment: false,
      isCreatingContainer: false,
    })
  }

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
        onSelectNav={handleSelectNav}
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
        <TopBar
          activeNav={activeNav}
          subTitle={
            activeNav === 1
              ? isCreatingProject
                ? 'New Projects'
                : selectedProject
                  ? isCreatingEnvironment
                    ? `${selectedProject.name} > New Environment`
                    : selectedEnvironment
                      ? isCreatingContainer
                        ? `${selectedProject.name} > ${selectedEnvironment.name} > New Container`
                        : `${selectedProject.name} > ${selectedEnvironment.name}`
                      : selectedProject.name
                  : undefined
              : undefined
          }
          onTitleClick={
            activeNav === 1 && (isCreatingProject || selectedProject)
              ? () => goBack()
              : undefined
          }
        />

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

          {activeNav === 1 && (
            <ProjectsView
              isCreating={isCreatingProject}
              onToggleCreating={(creating) => {
                if (creating) {
                  navigate({ isCreatingProject: true, selectedProject: null })
                } else {
                  goBack()
                }
              }}
              selectedProject={selectedProject}
              onSelectProject={(project) => {
                if (project) {
                  navigate({
                    selectedProject: project,
                    isCreatingProject: false,
                    selectedEnvironment: null,
                    isCreatingEnvironment: false,
                    isCreatingContainer: false,
                  })
                } else {
                  goBack()
                }
              }}
              selectedEnvironment={selectedEnvironment}
              onSelectEnvironment={(env) => {
                if (env) {
                  navigate({
                    selectedEnvironment: env,
                    isCreatingContainer: false,
                  })
                } else {
                  goBack()
                }
              }}
              isCreatingEnvironment={isCreatingEnvironment}
              onToggleCreatingEnvironment={(creating) => {
                if (creating) {
                  navigate({ isCreatingEnvironment: true })
                } else {
                  goBack()
                }
              }}
              isCreatingContainer={isCreatingContainer}
              onToggleCreatingContainer={(creating) => {
                if (creating) {
                  navigate({ isCreatingContainer: true })
                } else {
                  goBack()
                }
              }}
            />
          )}

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
