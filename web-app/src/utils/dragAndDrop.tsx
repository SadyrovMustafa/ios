import { ReactNode } from 'react'

// Simple drag and drop wrapper (since react-beautiful-dnd is deprecated)
export interface DragDropProps {
  children: ReactNode
  onDragEnd?: (result: { source: { index: number }, destination: { index: number } | null }) => void
}

export function DragDropList({ children, onDragEnd }: DragDropProps) {
  let draggedElement: HTMLElement | null = null
  let draggedIndex = -1

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedElement = e.currentTarget as HTMLElement
    draggedIndex = index
    draggedElement.style.opacity = '0.5'
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedElement) {
      draggedElement.style.opacity = '1'
    }
    if (draggedIndex !== -1 && draggedIndex !== index && onDragEnd) {
      onDragEnd({
        source: { index: draggedIndex },
        destination: { index }
      })
    }
  }

  const handleDragEnd = () => {
    if (draggedElement) {
      draggedElement.style.opacity = '1'
    }
    draggedElement = null
    draggedIndex = -1
  }

  return (
    <div>
      {Array.isArray(children) ? children.map((child, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          style={{ cursor: 'move' }}
        >
          {child}
        </div>
      )) : children}
    </div>
  )
}

