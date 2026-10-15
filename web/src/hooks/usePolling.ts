import { useCallback, useEffect, useRef, useState } from 'react'

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs = 5000,
  initialData: T | null = null
) {
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const execute = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true)
    }
    try {
      const result = await fetcherRef.current()
      setData(result)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
      if (isManual) {
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        const result = await fetcherRef.current()
        if (isMounted) {
          setData(result)
          setError(null)
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    run()
    const timer = setInterval(run, intervalMs)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [intervalMs])

  const refetch = useCallback(() => execute(true), [execute])

  return { data, loading, refreshing, error, refetch, setData }
}

export default usePolling
