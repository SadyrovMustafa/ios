import { useState, useEffect } from 'react'
import { CloudStorageService, CloudProvider, CloudFile } from '../services/CloudStorageService'
import { toastService } from '../services/ToastService'
import './CloudFilePicker.css'

interface CloudFilePickerProps {
  taskId: string
  onFileSelected?: (file: CloudFile) => void
  onClose?: () => void
}

export default function CloudFilePicker({ taskId, onFileSelected, onClose }: CloudFilePickerProps) {
  const [providers, setProviders] = useState<CloudProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider['id'] | null>(null)
  const [files, setFiles] = useState<CloudFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    if (selectedProvider && CloudStorageService.isProviderConnected(selectedProvider)) {
      loadFiles()
    }
  }, [selectedProvider, currentFolder])

  const loadProviders = () => {
    setProviders(CloudStorageService.getProviders())
  }

  const handleConnectProvider = async (providerId: CloudProvider['id']) => {
    try {
      const connected = await CloudStorageService.connectProvider(providerId)
      if (connected) {
        toastService.success(`${providers.find(p => p.id === providerId)?.name} подключен`)
        loadProviders()
        setSelectedProvider(providerId)
      }
    } catch (error) {
      toastService.error('Ошибка подключения')
    }
  }

  const handleDisconnectProvider = async (providerId: CloudProvider['id']) => {
    try {
      await CloudStorageService.disconnectProvider(providerId)
      toastService.success('Провайдер отключен')
      loadProviders()
      if (selectedProvider === providerId) {
        setSelectedProvider(null)
        setFiles([])
      }
    } catch (error) {
      toastService.error('Ошибка отключения')
    }
  }

  const loadFiles = async () => {
    if (!selectedProvider) return

    setIsLoading(true)
    try {
      const fileList = await CloudStorageService.listFiles(selectedProvider, currentFolder)
      setFiles(fileList)
    } catch (error) {
      console.error('Failed to load files:', error)
      toastService.error('Ошибка загрузки файлов')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (file: CloudFile) => {
    if (onFileSelected) {
      onFileSelected(file)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedProvider) return

    setIsLoading(true)
    try {
      const uploadedFile = await CloudStorageService.uploadFile(selectedProvider, file, currentFolder)
      toastService.success('Файл загружен')
      loadFiles()
      if (onFileSelected) {
        onFileSelected(uploadedFile)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toastService.error('Ошибка загрузки файла')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={`cloud-file-picker ${onClose ? 'modal' : ''}`}>
      {onClose && (
        <div className="picker-header">
          <h2>☁️ Облачные хранилища</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <div className="picker-content">
        <div className="providers-section">
          <h3>Провайдеры</h3>
          <div className="providers-list">
            {providers.map(provider => (
              <div key={provider.id} className="provider-item">
                <div className="provider-info">
                  <span className="provider-icon">{provider.icon}</span>
                  <span className="provider-name">{provider.name}</span>
                  {provider.isConnected && (
                    <span className="provider-status connected">✓ Подключен</span>
                  )}
                </div>
                {provider.isConnected ? (
                  <div className="provider-actions">
                    <button
                      className="action-btn"
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      Открыть
                    </button>
                    <button
                      className="action-btn disconnect"
                      onClick={() => handleDisconnectProvider(provider.id)}
                    >
                      Отключить
                    </button>
                  </div>
                ) : (
                  <button
                    className="connect-btn"
                    onClick={() => handleConnectProvider(provider.id)}
                  >
                    Подключить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedProvider && CloudStorageService.isProviderConnected(selectedProvider) && (
          <div className="files-section">
            <div className="files-header">
              <h3>Файлы из {providers.find(p => p.id === selectedProvider)?.name}</h3>
              <label className="upload-label">
                <input
                  type="file"
                  onChange={handleUploadFile}
                  style={{ display: 'none' }}
                />
                <span className="upload-btn">📤 Загрузить</span>
              </label>
            </div>

            {isLoading ? (
              <div className="loading">Загрузка...</div>
            ) : files.length === 0 ? (
              <div className="empty-files">
                <p>Нет файлов</p>
                <p className="hint">Загрузите файл или подключите облачное хранилище</p>
              </div>
            ) : (
              <div className="files-list">
                {files.map(file => (
                  <div
                    key={file.id}
                    className="file-item"
                    onClick={() => handleFileSelect(file)}
                  >
                    <span className="file-icon">
                      {file.mimeType?.includes('image') ? '🖼️' :
                       file.mimeType?.includes('pdf') ? '📄' :
                       file.mimeType?.includes('folder') ? '📁' : '📎'}
                    </span>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      {file.size > 0 && (
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      )}
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="picker-info">
          <p>ℹ️ <strong>Примечание:</strong> Для полной интеграции требуется настройка OAuth для каждого провайдера. 
          В демо-режиме подключение симулируется.</p>
        </div>
      </div>
    </div>
  )
}

