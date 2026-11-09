import type { DeleteAllResult, ImportResult } from '../types/import.types'
import { send } from './client'

export function deleteAllData() {
  return send<DeleteAllResult>('/api/imports', { method: 'DELETE' })
}

export function uploadCsv(file: File) {
  const body = new FormData()
  body.append('file', file)
  return send<ImportResult>('/api/imports', { method: 'POST', body })
}

export function getLatestImport(signal: AbortSignal) {
  return send<ImportResult | null>('/api/imports/latest', { signal })
}
