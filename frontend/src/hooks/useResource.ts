import { useEffect, useState } from 'react'
import { errorMessage } from '../utils/error-message'
import { deferredLoad } from '../utils/deferred-load'

// Each result belongs to a specific loader/revision. A filter change immediately
// shows loading instead of displaying old rows under the new filter labels.
export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  refreshKey = 0,
) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<{
    load: typeof load | null
    revision: number
    refreshKey: number
    data: T | null
    error: string | null
  }>({ load: null, revision: -1, refreshKey: -1, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    deferredLoad(controller.signal, load).then(
      (data) => {
        if (!controller.signal.aborted)
          setResult({ load, revision, refreshKey, data, error: null })
      },
      (error) => {
        if (!controller.signal.aborted)
          setResult({
            load,
            revision,
            refreshKey,
            data: null,
            error: errorMessage(error),
          })
      },
    )
    return () => controller.abort()
  }, [load, revision, refreshKey])

  const loading =
    result.load !== load ||
    result.revision !== revision ||
    result.refreshKey !== refreshKey
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload: () => setRevision((value) => value + 1),
  }
}
