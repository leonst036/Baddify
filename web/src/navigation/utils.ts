import type { NavigationState } from './types'

export function getUrlHash(state: NavigationState): string {
  switch (state.activeNav) {
    case 0:
      return '#/'
    case 1: {
      if (state.isCreatingProject) return '#/projects/new'
      if (state.selectedProject) {
        const projName = encodeURIComponent(state.selectedProject.name)
        if (state.isCreatingEnvironment) return `#/projects/${projName}/environments/new`
        if (state.selectedEnvironment) {
          const envName = encodeURIComponent(state.selectedEnvironment.name)
          if (state.isCreatingContainer) {
            return `#/projects/${projName}/environments/${envName}/containers/new`
          }
          return `#/projects/${projName}/environments/${envName}`
        }
        return `#/projects/${projName}`
      }
      return '#/projects'
    }
    case 2:
      return '#/storage'
    case 3:
      return '#/servers'
    case 4:
      return '#/settings'
    default:
      return '#/'
  }
}

export function getInitialState(): NavigationState {
  const historyState = window.history.state?.state as NavigationState | undefined
  if (historyState && typeof historyState.activeNav === 'number') {
    return historyState
  }

  const hash = window.location.hash || ''
  let activeNav = 0
  let isCreatingProject = false

  if (hash.startsWith('#/projects/new')) {
    activeNav = 1
    isCreatingProject = true
  } else if (hash.startsWith('#/projects')) {
    activeNav = 1
  } else if (hash.startsWith('#/storage')) {
    activeNav = 2
  } else if (hash.startsWith('#/servers')) {
    activeNav = 3
  } else if (hash.startsWith('#/settings')) {
    activeNav = 4
  }

  return {
    activeNav,
    isCreatingProject,
    selectedProject: null,
    isCreatingEnvironment: false,
    selectedEnvironment: null,
    isCreatingContainer: false,
  }
}
