import { useState } from 'react'
import { TaskList } from '../types/Task'
import './ListBackgroundSettings.css'

interface ListBackgroundSettingsProps {
  list: TaskList
  onUpdate: (list: TaskList) => void
  onClose: () => void
}

export default function ListBackgroundSettings({
  list,
  onUpdate,
  onClose
}: ListBackgroundSettingsProps) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(list.backgroundImage || null)
  const [backgroundColor, setBackgroundColor] = useState<string>(list.backgroundColor || '#FFFFFF')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setBackgroundImage(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    onUpdate({
      ...list,
      backgroundImage: backgroundImage || undefined,
      backgroundColor: backgroundColor
    })
    onClose()
  }

  const presetColors = [
    '#FFFFFF', '#F2F2F7', '#000000', '#1C1C1E',
    '#007AFF', '#34C759', '#FF9500', '#FF3B30',
    '#5856D6', '#FF2D55', '#5AC8FA', '#FFCC00'
  ]

  return (
    <div className="list-background-overlay" onClick={onClose}>
      <div className="list-background-modal" onClick={(e) => e.stopPropagation()}>
        <div className="list-background-header">
          <h2>Фон для списка "{list.name}"</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="list-background-content">
          <div className="background-section">
            <h3>Цвет фона</h3>
            <div className="color-picker-group">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="color-picker"
              />
              <div className="preset-colors">
                {presetColors.map(color => (
                  <button
                    key={color}
                    className={`preset-color ${backgroundColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="background-section">
            <h3>Изображение фона</h3>
            <label className="file-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-upload-input"
              />
              <span className="file-upload-button">📷 Загрузить изображение</span>
            </label>
            {backgroundImage && (
              <div className="background-preview">
                <img src={backgroundImage} alt="Background preview" />
                <button
                  onClick={() => setBackgroundImage(null)}
                  className="remove-background-btn"
                >
                  ✕ Удалить
                </button>
              </div>
            )}
          </div>

          <div className="background-actions">
            <button onClick={handleSave} className="btn-primary">
              Сохранить
            </button>
            <button onClick={onClose} className="btn-secondary">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

