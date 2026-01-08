import { useState } from 'react'
import './ImageUpload.css'

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void
  onClose: () => void
}

export default function ImageUpload({ onImageSelect, onClose }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setPreview(imageUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleInsert = () => {
    if (preview) {
      onImageSelect(preview)
      onClose()
    }
  }

  return (
    <div className="image-upload-overlay" onClick={onClose}>
      <div className="image-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-upload-header">
          <h2>🖼️ Insert Image</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="image-upload-content">
          <label className="file-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />
            <span className="file-upload-button">Choose Image</span>
          </label>

          {preview && (
            <>
              <div className="image-preview">
                <img src={preview} alt="Preview" />
              </div>
              <button onClick={handleInsert} className="insert-btn">
                Insert Image
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

