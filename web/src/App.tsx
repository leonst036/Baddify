import { NavigationProvider } from '@/navigation'
import { ControlPlaneDashboard } from '@/features/overview'

function App() {
  return (
    <NavigationProvider>
      <ControlPlaneDashboard />
    </NavigationProvider>
  )
}

export default App

