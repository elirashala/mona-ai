// Mirrors the JSON returned by the NestJS import endpoints.
export type RowStatus = 'imported' | 'invalid' | 'duplicate'

export interface ImportRow {
  id: number
  importId: string
  rowNumber: number
  status: RowStatus
  requestId: string | null
  original: Record<string, string>
  errors: { field: string; code: string; message: string }[]
}

export interface ImportBatch {
  id: string
  filename: string
  encoding: string
  createdAt: string
  totalRows: number
  importedCount: number
  invalidCount: number
  duplicateCount: number
}

export interface ImportResult extends ImportBatch {
  rows: ImportRow[]
}

export interface DeleteAllResult {
  deletedRequests: number
  deletedImports: number
  deletedRows: number
}
