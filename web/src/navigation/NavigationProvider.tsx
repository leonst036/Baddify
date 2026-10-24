import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { NavigationContext } from './context'
import { getUrlHash, getInitialState } from './utils'
import type { NavigationState } from './types'

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [initial] = useState<NavigationState>(getInitialState)
  const [state, setState] = useState<NavigationState>(initial)
  const [stack, setStack] = useState<NavigationState[]>([initial])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasInterceptors, setHasInterceptors] = useState(false)

  const stateRef = useRef(state)
  const currentIndexRef = useRef(currentIndex)
  const stackRef = useRef(stack)
  const interceptorsRef = useRef<Array<() => boolean | void>>([])
  const lastNavTimeRef = useRef(0)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    stackRef.current = stack
  }, [stack])

  // Initialize history entry on first render
  useEffect(() => {
    const initialHash = getUrlHash(initial)
    if (!window.history.state || typeof window.history.state.index !== 'number') {
      window.history.replaceState({ index: 0, state: initial }, '', initialHash)
    }
  }, [initial])

  const registerBackInterceptor = useCallback((handler: () => boolean | void) => {
    interceptorsRef.current.push(handler)
    setHasInterceptors(true)
    return () => {
      interceptorsRef.current = interceptorsRef.current.filter((h) => h !== handler)
      setHasInterceptors(interceptorsRef.current.length > 0)
    }
  }, [])

  const goBack = useCallback(() => {
    const now = performance.now()
    if (now - lastNavTimeRef.current < 120) return
    lastNavTimeRef.current = now

    // Check if any modal or dialog interceptor handles the back event
    const interceptors = interceptorsRef.current
    for (let i = interceptors.length - 1; i >= 0; i--) {
      const handled = interceptors[i]()
      if (handled) return
    }

    if (currentIndexRef.current > 0) {
      window.history.back()
    }
  }, [])

  const goForward = useCallback(() => {
    const now = performance.now()
    if (now - lastNavTimeRef.current < 120) return
    lastNavTimeRef.current = now

    if (currentIndexRef.current < stackRef.current.length - 1) {
      window.history.forward()
    }
  }, [])

  const navigate = useCallback(
    (updates: Partial<NavigationState>, options?: { replace?: boolean }) => {
      const current = stateRef.current
      const next: NavigationState = {
        ...current,
        ...updates,
      }

      // Check if state actually changed
      const isSame =
        current.activeNav === next.activeNav &&
        current.isCreatingProject === next.isCreatingProject &&
        current.selectedProject?.name === next.selectedProject?.name &&
        current.selectedProject?.id === next.selectedProject?.id &&
        current.selectedProject?.uuid === next.selectedProject?.uuid &&
        current.isCreatingEnvironment === next.isCreatingEnvironment &&
        current.selectedEnvironment?.id === next.selectedEnvironment?.id &&
        current.selectedEnvironment?.name === next.selectedEnvironment?.name &&
        current.isCreatingContainer === next.isCreatingContainer

      if (isSame) return

      const hash = getUrlHash(next)

      if (options?.replace) {
        const curIdx = currentIndexRef.current
        const nextStack = [...stackRef.current]
        nextStack[curIdx] = next
        stackRef.current = nextStack
        setStack(nextStack)

        window.history.replaceState({ index: curIdx, state: next }, '', hash)
      } else {
        const nextIdx = currentIndexRef.current + 1
        const nextStack = stackRef.current.slice(0, nextIdx)
        nextStack.push(next)
        stackRef.current = nextStack
        currentIndexRef.current = nextIdx

        setStack(nextStack)
        setCurrentIndex(nextIdx)

        window.history.pushState({ index: nextIdx, state: next }, '', hash)
      }

      stateRef.current = next
      setState(next)
    },
    []
  )

  // Listen to popstate (browser back/forward & window.history.back/forward)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.index === 'number') {
        const targetIndex = event.state.index
        currentIndexRef.current = targetIndex
        setCurrentIndex(targetIndex)

        if (event.state.state) {
          const nextState = event.state.state as NavigationState
          stateRef.current = nextState
          setState(nextState)

          const nextStack = [...stackRef.current]
          nextStack[targetIndex] = nextState
          stackRef.current = nextStack
          setStack(nextStack)
        } else if (stackRef.current[targetIndex]) {
          const nextState = stackRef.current[targetIndex]
          stateRef.current = nextState
          setState(nextState)
        }
      } else {
        const fallback = getInitialState()
        stateRef.current = fallback
        setState(fallback)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Listen to mouse side buttons (button 3: Back, button 4: Forward)
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) {
        // Side Back button
        e.preventDefault()
        e.stopPropagation()
        goBack()
      } else if (e.button === 4) {
        // Side Forward button
        e.preventDefault()
        e.stopPropagation()
        goForward()
      }
    }

    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault()
      }
    }

    window.addEventListener('mouseup', handleMouseUp, true)
    window.addEventListener('auxclick', handleAuxClick, true)
    window.addEventListener('pointerdown', handlePointerDown, true)

    return () => {
      window.removeEventListener('mouseup', handleMouseUp, true)
      window.removeEventListener('auxclick', handleAuxClick, true)
      window.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [goBack, goForward])

  const canGoBack = currentIndex > 0 || hasInterceptors
  const canGoForward = currentIndex < stack.length - 1

  return (
    <NavigationContext.Provider
      value={{
        state,
        canGoBack,
        canGoForward,
        navigate,
        goBack,
        goForward,
        registerBackInterceptor,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}
