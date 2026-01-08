import { useState, useEffect } from 'react'
import { FileStorageService, FileAttachmentData } from '../services/FileStorageService'
import CloudFilePicker from './CloudFilePicker'
import { CloudFile } from '../services/CloudStorageService'
import './FileAttachment.css'

interface FileAttachmentProps {
  taskId: string
  onFilesChange?: (files: FileAttachmentData[]) => void
  readOnly?: boolean
}

export default function FileAttachment({ taskId, onFilesChange, readOnly = false }: FileAttachmentProps) {
  const [files, setFiles] = useState<FileAttachmentData[]>([])
  const [uploading, setUploading] = useState(false)
  const [showCloudPicker, setShowCloudPicker] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [taskId])

  const loadFiles = async () => {
    try {
      const loadedFiles = await FileStorageService.getFilesForTask(taskId)
      setFiles(loadedFiles)
      onFilesChange?.(loadedFiles)
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(selectedFiles).map(file =>
        FileStorageService.saveFile(file, taskId)
      )
      const uploaded = await Promise.all(uploadPromises)
      await loadFiles()
    } catch (error) {
      console.error('Failed to upload files:', error)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file?')) return

    try {
      await FileStorageService.deleteFile(fileId)
      await loadFiles()
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file')
    }
  }

  const handleDownload = (file: FileAttachmentData) => {
    const link = document.createElement('a')
    link.href = FileStorageService.createFileUrl(file.data)
    link.download = file.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCloudFileSelect = async (cloudFile: CloudFile) => {
    try {
      // Скачиваем файл из облака и сохраняем локально
      const blob = await fetch(cloudFile.downloadUrl || cloudFile.webViewLink || '').then(r => r.blob())
      const file = new File([blob], cloudFile.name, { type: cloudFile.mimeType })
      await FileStorageService.saveFile(file, taskId)
      await loadFiles()
      setShowCloudPicker(false)
    } catch (error) {
      console.error('Failed to import cloud file:', error)
      alert('Ошибка импорта файла из облака')
    }
  }

  if (readOnly && files.length === 0) return null

  return (
    <div className="file-attachment">
      {!readOnly && (
        <div className="upload-options">
          <label className="file-upload-label">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="file-upload-input"
            />
            <span className="file-upload-button">
              {uploading ? 'Uploading...' : '📎 Attach Files'}
            </span>
          </label>
          <button
            className="cloud-upload-button"
            onClick={() => setShowCloudPicker(true)}
            disabled={uploading}
          >
            ☁️ From Cloud
          </button>
        </div>
      )}

      {showCloudPicker && (
        <CloudFilePicker
          taskId={taskId}
          onFileSelected={handleCloudFileSelect}
          onClose={() => setShowCloudPicker(false)}
        />
      )}

      {files.length > 0 && (
        <div className="files-list">
          {files.map(file => (
            <div key={file.id} className="file-item">
              <div className="file-info" onClick={() => handleDownload(file)}>
                <span className="file-icon">
                  {file.fileType.startsWith('image/') ? '🖼️' :
                   file.fileType.includes('pdf') ? '📄' :
                   file.fileType.includes('word') ? '📝' :
                   file.fileType.includes('excel') ? '📊' :
                   '📎'}
                </span>
                <div className="file-details">
                  <div className="file-name">{file.fileName}</div>
                  <div className="file-meta">
                    {FileStorageService.formatFileSize(file.fileSize)}
                    {' • '}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {!readOnly && (
                <button
                  className="file-delete"
                  onClick={() => handleDelete(file.id)}
                  aria-label="Delete file"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

