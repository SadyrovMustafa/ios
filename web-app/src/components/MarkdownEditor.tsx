import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import ChecklistInNotes from './ChecklistInNotes'
import ImageUpload from './ImageUpload'
import DrawingCanvas from './DrawingCanvas'
import { format } from 'date-fns'
import './MarkdownEditor.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  enableTimestamps?: boolean
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Write notes in Markdown...', enableTimestamps = true }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showDrawing, setShowDrawing] = useState(false)
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; text: string; checked: boolean }>>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastValueRef = useRef<string>(value)
  
  // Parse checklist from markdown
  useEffect(() => {
    const lines = value.split('\n')
    const items: Array<{ id: string; text: string; checked: boolean }> = []
    lines.forEach((line, index) => {
      const match = line.match(/^[-*]\s+\[([ x])\]\s+(.+)$/i)
      if (match) {
        items.push({
          id: `checklist-${index}`,
          text: match[2],
          checked: match[1].toLowerCase() === 'x'
        })
      }
    })
    setChecklistItems(items)
  }, [value])

  // Add timestamp when content changes significantly
  useEffect(() => {
    if (!enableTimestamps) return

    const currentValue = value.trim()
    const lastValue = lastValueRef.current.trim()

    // Only add timestamp if:
    // 1. Content changed significantly (not just whitespace)
    // 2. New content is longer than old content (user is adding, not deleting)
    // 3. There's actual content
    if (currentValue && currentValue !== lastValue && currentValue.length > lastValue.length && currentValue.length > 10) {
      const timestamp = format(new Date(), 'dd.MM.yyyy HH:mm')
      const timestampLine = `\n\n---\n*Изменено: ${timestamp}*\n`
      
      // Insert timestamp at the end
      const newValue = value + timestampLine
      onChange(newValue)
    }

    lastValueRef.current = value
  }, [value, enableTimestamps, onChange])

  return (
    <div className="markdown-editor">
      <div className="markdown-toolbar">
        <div className="toolbar-left">
          <button
            className={`toolbar-btn ${!isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(false)}
          >
            ✏️ Edit
          </button>
          <button
            className={`toolbar-btn ${isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(true)}
          >
            👁️ Preview
          </button>
        </div>
        {!isPreview && (
          <div className="toolbar-right">
            <button
              className="toolbar-btn"
              onClick={() => setShowImageUpload(true)}
              title="Insert Image"
            >
              🖼️
            </button>
            <button
              className="toolbar-btn"
              onClick={() => setShowDrawing(true)}
              title="Draw"
            >
              🎨
            </button>
          </div>
        )}
      </div>

      {isPreview ? (
        <div className="markdown-preview">
          <ReactMarkdown>{value || '*No content*'}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="markdown-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}

      {checklistItems.length > 0 && !isPreview && (
        <div className="markdown-checklist">
          <ChecklistInNotes
            items={checklistItems}
            onChange={(items) => {
              // Update markdown with checklist
              const lines = value.split('\n')
              const updatedLines = lines.map(line => {
                const match = line.match(/^[-*]\s+\[([ x])\]\s+(.+)$/i)
                if (match) {
                  const item = items.find(i => i.text === match[2])
                  if (item) {
                    return `- [${item.checked ? 'x' : ' '}] ${item.text}`
                  }
                }
                return line
              })
              onChange(updatedLines.join('\n'))
            }}
          />
        </div>
      )}

      <div className="markdown-hint">
        💡 Supports **bold**, *italic*, `code`, [links](url), checklists, and more
      </div>

      {showImageUpload && (
        <ImageUpload
          onImageSelect={(imageUrl) => {
            onChange(value + `\n![Image](${imageUrl})\n`)
            setShowImageUpload(false)
          }}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {showDrawing && (
        <DrawingCanvas
          onSave={(imageData) => {
            onChange(value + `\n![Drawing](${imageData})\n`)
            setShowDrawing(false)
          }}
          onClose={() => setShowDrawing(false)}
        />
      )}
    </div>
  )
}

