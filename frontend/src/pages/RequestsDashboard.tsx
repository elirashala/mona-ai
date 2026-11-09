import { useRef, useState } from 'react'
import { ImportPage } from './ImportPage'
import { ReportsPage } from './ReportsPage'
import { presetRange } from '../utils/date-ranges'
import type { DateRange } from '../types/report.types'
import { useDeleteAllData } from '../hooks/useDeleteAllData'
import { ErrorNotice } from '../components/Shared'
import './RequestsDashboard.css'

const tabs = [
  { id: 'import', label: 'Import CSV' },
  { id: 'reports', label: 'Reports' },
] as const

export function RequestsDashboard() {
  const [tab, setTab] = useState<'import' | 'reports'>('import')
  const [range, setRange] = useState(() => presetRange('lastMonth'))
  const [dataVersion, setDataVersion] = useState(0)
  const [uploading, setUploading] = useState(false)
  const { deleteAll, deleting, error, deleted, clearFeedback } =
    useDeleteAllData(() => {
      setDataVersion((version) => version + 1)
    })
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([])

  function uploadBusyChanged(busy: boolean) {
    setUploading(busy)
    if (busy) clearFeedback()
  }

  function changeRange(next: DateRange) {
    setRange((previous) =>
      previous.startDate === next.startDate && previous.endDate === next.endDate
        ? previous
        : next,
    )
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <div className="header-inner">
          <span className="brand">Mona AI · Alpenhof Facility AG</span>
          <span className="header-link">Requests workspace</span>
        </div>
      </header>
      <main id="main" className="dashboard">
        <div className="page-heading">
          <p className="eyebrow">REQUESTS WORKSPACE</p>
          <h1>
            {tab === 'import' ? 'Import service requests' : 'Reports by site'}
          </h1>
          <p>
            {tab === 'import'
              ? 'Upload a CSV and review validation results. Existing requests are counted once.'
              : 'Choose a date range and download the report for all four sites. Last month is selected by default.'}
          </p>
        </div>
        <div className="workspace-toolbar">
          <div
            className="page-tabs"
            role="tablist"
            aria-label="Workspace pages"
          >
            {tabs.map((item, index) => (
              <button
                key={item.id}
                ref={(element) => {
                  tabButtons.current[index] = element
                }}
                role="tab"
                disabled={deleting}
                id={`${item.id}-tab`}
                aria-controls={`${item.id}-panel`}
                aria-selected={tab === item.id}
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => {
                  const next =
                    event.key === 'ArrowRight'
                      ? (index + 1) % tabs.length
                      : event.key === 'ArrowLeft'
                        ? (index + tabs.length - 1) % tabs.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? tabs.length - 1
                            : null
                  if (next !== null) {
                    event.preventDefault()
                    setTab(tabs[next].id)
                    tabButtons.current[next]?.focus()
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="button danger small"
            disabled={deleting || uploading}
            onClick={() => {
              void deleteAll()
            }}
          >
            {deleting ? 'Deleting…' : 'Delete all data'}
          </button>
        </div>
        {error && <ErrorNotice message={error} />}
        {deleted && (
          <p className="notice success" role="status">
            All saved requests and import results have been deleted.
          </p>
        )}
        <fieldset
          className="workspace-content"
          disabled={deleting}
          aria-busy={deleting}
        >
          <div
            role="tabpanel"
            id="import-panel"
            aria-labelledby="import-tab"
            hidden={tab !== 'import'}
          >
            {tab === 'import' && (
              <ImportPage key={dataVersion} onBusyChange={uploadBusyChanged} />
            )}
          </div>
          <div
            role="tabpanel"
            id="reports-panel"
            aria-labelledby="reports-tab"
            hidden={tab !== 'reports'}
          >
            {tab === 'reports' && (
              <ReportsPage
                key={dataVersion}
                range={range}
                onRangeChange={changeRange}
              />
            )}
          </div>
        </fieldset>
        <footer className="app-footer">
          Alpenhof Facility AG · Every request counted once.
        </footer>
      </main>
    </>
  )
}
