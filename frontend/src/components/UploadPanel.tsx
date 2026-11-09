import { useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { uploadCsv } from '../api/imports.api'
import { errorMessage } from '../utils/error-message'
import type { ImportResult } from '../types/import.types'
import { ErrorNotice } from './Shared'

export function UploadPanel({
  onImported,
  onBusyChange,
}: {
  onImported: (result: ImportResult) => void
  onBusyChange?: (busy: boolean) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  function select(files: File[]) {
    setError(null)
    setFile(null)
    if (files.length !== 1) {
      setError('Please select one CSV file at a time.')
      return
    }
    const candidate = files[0]
    if (!candidate.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file.')
      return
    }
    if (candidate.size === 0) {
      setError('This file is empty. Choose a CSV containing request records.')
      return
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError('The file exceeds the 5 MiB upload limit.')
      return
    }
    setFile(candidate)
  }

  function drop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    if (!busy) select(Array.from(event.dataTransfer.files))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!file || busy) return
    setBusy(true)
    onBusyChange?.(true)
    setError(null)
    try {
      const result = await uploadCsv(file)
      onImported(result)
      setFile(null)
      if (input.current) input.current.value = ''
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  return (
    <section className="panel upload-panel" aria-labelledby="upload-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / IMPORT</p>
          <h2 id="upload-title">Import service requests</h2>
        </div>
        <span className="subtle-label">CSV upload</span>
      </div>
      <p className="section-description">
        Choose requests_2026-03.csv. Each row is validated; uploading the same
        file again does not create duplicate requests.
      </p>
      <form onSubmit={submit} aria-busy={busy}>
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''} ${busy ? 'disabled' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
        >
          <svg
            className="upload-icon"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M16 21V5m0 0-6 6m6-6 6 6M6 20v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <strong>{file ? file.name : 'Drop your CSV file here'}</strong>
          <span>
            {file
              ? `${(file.size / 1024).toFixed(1)} KB · Ready to import`
              : 'or choose a file from your computer'}
          </span>
          <label
            className={`button secondary small file-label ${busy ? 'disabled' : ''}`}
          >
            {file ? 'Change file' : 'Choose CSV file'}
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              aria-label="Choose CSV file"
              onChange={(event) => {
                if (event.target.files?.length)
                  select(Array.from(event.target.files))
                event.target.value = ''
              }}
            />
          </label>
        </div>
        <div className="upload-footer">
          <span>CSV · Up to 5 MiB · 10,000 rows</span>
          <button
            className="button primary"
            disabled={!file || busy}
            type="submit"
          >
            {busy ? (
              <>
                <span className="spinner" /> Importing…
              </>
            ) : (
              <>
                Import requests <span aria-hidden="true">↗</span>
              </>
            )}
          </button>
        </div>
        {busy && (
          <p className="helper" role="status">
            Validating and saving your upload. Please keep this page open.
          </p>
        )}
        {error && <ErrorNotice message={error} />}
      </form>
    </section>
  )
}
