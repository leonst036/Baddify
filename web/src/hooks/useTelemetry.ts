import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type {
  CPUInfoResponse,
  DiskIOResponse,
  InstancesInfoResponse,
  RAMInfoResponse,
} from '../api/types'

export interface TelemetryState {
  cpuData: CPUInfoResponse | null
  ramData: RAMInfoResponse | null
  diskData: DiskIOResponse | null
  instancesData: InstancesInfoResponse | null
  hasCpuError: boolean
  hasRamError: boolean
  hasDiskError: boolean
  hasInstancesError: boolean
}

export function useTelemetry(intervalMs = 5000): TelemetryState {
  const [cpuData, setCpuData] = useState<CPUInfoResponse | null>(null)
  const [ramData, setRamData] = useState<RAMInfoResponse | null>(null)
  const [diskData, setDiskData] = useState<DiskIOResponse | null>(null)
  const [instancesData, setInstancesData] = useState<InstancesInfoResponse | null>(null)

  const [hasCpuError, setHasCpuError] = useState(false)
  const [hasRamError, setHasRamError] = useState(false)
  const [hasDiskError, setHasDiskError] = useState(false)
  const [hasInstancesError, setHasInstancesError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchAll = async () => {
      const fetchCpu = async () => {
        try {
          const data = await apiFetch<CPUInfoResponse>('/api/cpu')
          if (isMounted) {
            setCpuData(data)
            setHasCpuError(false)
          }
        } catch {
          if (isMounted) setHasCpuError(true)
        }
      }

      const fetchRam = async () => {
        try {
          const data = await apiFetch<RAMInfoResponse>('/api/ram')
          if (isMounted) {
            setRamData(data)
            setHasRamError(false)
          }
        } catch {
          if (isMounted) setHasRamError(true)
        }
      }

      const fetchDisk = async () => {
        try {
          const data = await apiFetch<DiskIOResponse>('/api/disk-io')
          if (isMounted) {
            setDiskData(data)
            setHasDiskError(false)
          }
        } catch {
          if (isMounted) setHasDiskError(true)
        }
      }

      const fetchInstances = async () => {
        try {
          const data = await apiFetch<InstancesInfoResponse>('/api/instances')
          if (isMounted) {
            setInstancesData(data)
            setHasInstancesError(false)
          }
        } catch {
          if (isMounted) setHasInstancesError(true)
        }
      }

      await Promise.all([fetchCpu(), fetchRam(), fetchDisk(), fetchInstances()])
    }

    fetchAll()
    const timer = setInterval(fetchAll, intervalMs)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [intervalMs])

  return {
    cpuData,
    ramData,
    diskData,
    instancesData,
    hasCpuError,
    hasRamError,
    hasDiskError,
    hasInstancesError,
  }
}

export default useTelemetry
