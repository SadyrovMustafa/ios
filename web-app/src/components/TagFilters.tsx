import { useState, useEffect } from 'react'
import { Task } from '../types/Task'
import { TagColorService } from '../services/TagColorService'
import './TagFilters.css'

interface TagFiltersProps {
  tasks: Task[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function TagFilters({ tasks, selectedTags, onTagsChange }: TagFiltersProps) {
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    const tags = new Set<string>()
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => tags.add(tag))
      }
    })
    setAllTags(Array.from(tags).sort())
  }, [tasks])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const clearFilters = () => {
    onTagsChange([])
  }

  if (allTags.length === 0) {
    return null
  }

  return (
    <div className="tag-filters">
      <div className="tag-filters-header">
        <h4>Фильтр по тегам</h4>
        {selectedTags.length > 0 && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Очистить
          </button>
        )}
      </div>
      <div className="tag-filters-list">
        {allTags.map(tag => {
          const isSelected = selectedTags.includes(tag)
          const tagColor = TagColorService.getColorForTag(tag)
          return (
            <button
              key={tag}
              className={`tag-filter-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
              style={isSelected && tagColor ? {
                backgroundColor: tagColor,
                color: 'white',
                borderColor: tagColor
              } : tagColor ? {
                borderColor: tagColor,
                color: tagColor
              } : undefined}
            >
              {tag}
              {isSelected && ' ✓'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

