import { useState } from 'react'
import { Task, TaskList } from '../types/Task'
import { ExportImportService } from '../services/ExportImportService'
import { IntegrationService } from '../services/IntegrationService'
import { ImportService } from '../services/ImportService'
import './Modal.css'

interface ExportImportModalProps {
  onClose: () => void
  tasks: Task[]
  lists: TaskList[]
  onImport: (tasks: Task[], lists: TaskList[]) => void
}

export default function ExportImportModal({
  onClose,
  tasks,
  lists,
  onImport
}: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const handleExportJSON = () => {
    ExportImportService.exportTasksToFile(tasks, lists, 'json')
  }

  const handleExportCSV = () => {
    ExportImportService.exportTasksToFile(tasks, lists, 'csv')
  }

  const handleExportExcel = () => {
    ExportImportService.exportToExcel(tasks, lists)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)

    try {
      const { tasks: importedTasks, lists: importedLists } =
        await ExportImportService.importTasksFromFile(file)

      onImport(importedTasks, importedLists)
      setImportSuccess(true)

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Failed to import file'
      )
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Export / Import</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="export-import-tabs">
          <button
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
        </div>

        <div className="modal-form">
          {activeTab === 'export' ? (
            <div className="export-section">
              <p className="section-description">
                Export your tasks and lists to a file. You can choose JSON or CSV format.
              </p>
              <div className="export-stats">
                <div className="stat-item">
                  <span className="stat-label">Tasks:</span>
                  <span className="stat-value">{tasks.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Lists:</span>
                  <span className="stat-value">{lists.length}</span>
                </div>
              </div>
              <div className="export-buttons">
                <button className="btn-primary" onClick={handleExportJSON}>
                  📥 Export as JSON
                </button>
                <button className="btn-primary" onClick={handleExportCSV}>
                  📊 Export as CSV
                </button>
                <button
                  className="btn-primary"
                  onClick={() => ExportImportService.exportTasksToFile(tasks, lists, 'markdown')}
                >
                  📝 Export as Markdown (.md)
                </button>
                <button className="btn-primary" onClick={handleExportExcel}>
                  📑 Export as Excel (.xlsx)
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const tasksWithDates = tasks.filter(t => t.dueDate)
                    IntegrationService.downloadCalendar(tasksWithDates)
                  }}
                >
                  📅 Export to Calendar (.ics)
                </button>
                <button
                  className="btn-primary"
                  onClick={() => IntegrationService.shareViaEmail(tasks)}
                >
                  📧 Share via Email
                </button>
              </div>
            </div>
          ) : (
            <div className="import-section">
              <p className="section-description">
                Import tasks and lists from a previously exported file.
              </p>
              {importError && (
                <div className="error-message">{importError}</div>
              )}
              {importSuccess && (
                <div className="success-message">
                  ✓ Successfully imported tasks and lists!
                </div>
              )}
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <span className="file-input-button">Choose File</span>
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

