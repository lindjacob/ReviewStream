import { useEffect, useState } from 'react'
import { fetchApps } from '../api/apps'
import type { AppsLoad } from '../types/load'

export function useApps() {
  const [appsLoad, setAppsLoad] = useState<AppsLoad>({ status: 'loading' })
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const loadApps = async () => {
      try {
        const data = await fetchApps()
        if (controller.signal.aborted) return
        if (data.apps.length === 0) {
          setAppsLoad({ status: 'empty' })
          setSelectedAppId(null)
          return
        }
        setAppsLoad({ status: 'ready', apps: data.apps })
        setSelectedAppId((current) =>
          current !== null && data.apps.includes(current)
            ? current
            : data.apps[0],
        )
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : 'Failed to load configured apps'
        setAppsLoad({ status: 'error', message })
        setSelectedAppId(null)
      }
    }

    void loadApps()
    return () => controller.abort()
  }, [retryKey])

  const retry = () => {
    setAppsLoad({ status: 'loading' })
    setRetryKey((key) => key + 1)
  }

  return { appsLoad, selectedAppId, setSelectedAppId, retry }
}
