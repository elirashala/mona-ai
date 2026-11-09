import { useCallback, useState } from 'react'
import { getLatestImport } from '../api/imports.api'
import type { ImportResult } from '../types/import.types'
import { useResource } from './useResource'

export function useImportResults() {
  const [uploaded, setUploaded] = useState<ImportResult | null>(null)
  const load = useCallback((signal: AbortSignal) => getLatestImport(signal), [])
  const latest = useResource(load)

  function imported(result: ImportResult) {
    setUploaded(result)
  }

  return {
    imported,
    selection: {
      id: uploaded?.id ?? latest.data?.id ?? null,
      data: uploaded ?? latest.data,
      loading: !uploaded && latest.loading,
      error: uploaded ? null : latest.error,
    },
    retrySelection: latest.reload,
  }
}
