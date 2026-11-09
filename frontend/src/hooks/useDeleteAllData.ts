import { useState } from 'react'
import { deleteAllData } from '../api/imports.api'
import { errorMessage } from '../utils/error-message'

export function useDeleteAllData(onDeleted: () => void) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)

  async function deleteAll() {
    if (deleting) return
    const confirmed = window.confirm(
      'Delete all saved requests, imports, and validation results for every date? This permanently removes the data from the database and cannot be undone.',
    )
    if (!confirmed) return
    setDeleting(true)
    setError(null)
    setDeleted(false)
    try {
      await deleteAllData()
      onDeleted()
      setDeleted(true)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setDeleting(false)
    }
  }

  function clearFeedback() {
    setError(null)
    setDeleted(false)
  }

  return { deleteAll, deleting, error, deleted, clearFeedback }
}
