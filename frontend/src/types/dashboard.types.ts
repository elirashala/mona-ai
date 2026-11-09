import type { ImportResult } from './import.types'

export interface ImportSelection {
  id: string | null
  data: ImportResult | null
  loading: boolean
  error: string | null
}
