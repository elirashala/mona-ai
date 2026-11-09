import { ImportResultsSection } from '../components/ImportResultsSection'
import { UploadPanel } from '../components/UploadPanel'
import { useImportResults } from '../hooks/useImportResults'

export function ImportPage({
  onBusyChange,
}: {
  onBusyChange: (busy: boolean) => void
}) {
  const { imported, selection, retrySelection } = useImportResults()
  return (
    <>
      <UploadPanel onImported={imported} onBusyChange={onBusyChange} />
      <ImportResultsSection selection={selection} onRetry={retrySelection} />
    </>
  )
}
