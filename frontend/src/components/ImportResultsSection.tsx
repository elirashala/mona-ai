import type { ImportSelection } from '../types/dashboard.types'
import { ImportResults } from './ImportResults'
import { ErrorNotice, Loading } from './Shared'

export function ImportResultsSection({
  selection,
  onRetry,
}: {
  selection: ImportSelection
  onRetry: () => void
}) {
  return (
    <div id="import-results" aria-live="polite" aria-busy={selection.loading}>
      {selection.loading ? (
        <section className="panel">
          <Loading label="Loading import results…" />
        </section>
      ) : selection.error ? (
        <section className="panel">
          <h2>Import results</h2>
          <ErrorNotice message={selection.error} retry={onRetry} />
        </section>
      ) : selection.data ? (
        <ImportResults key={selection.data.id} result={selection.data} />
      ) : (
        <section className="results-placeholder">
          <span className="placeholder-icon" aria-hidden="true">
            ✓
          </span>
          <div>
            <h2>Import results, without the guesswork.</h2>
            <p>
              Upload the supplied CSV to see imported rows, duplicates, and
              clear reasons for every invalid row.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
