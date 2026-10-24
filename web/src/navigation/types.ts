import type { ProjectItem, ProjectEnvironment } from '@/features/projects/types'

export interface NavigationState {
  activeNav: number
  isCreatingProject: boolean
  selectedProject: ProjectItem | null
  isCreatingEnvironment: boolean
  selectedEnvironment: ProjectEnvironment | null
  isCreatingContainer: boolean
}

export interface NavigationContextValue {
  state: NavigationState
  canGoBack: boolean
  canGoForward: boolean
  navigate: (updates: Partial<NavigationState>, options?: { replace?: boolean }) => void
  goBack: () => void
  goForward: () => void
  registerBackInterceptor: (handler: () => boolean | void) => () => void
}
