import { useState, useEffect } from 'react'
import { TagHierarchyService, TagNode } from '../services/TagHierarchyService'
import './TagHierarchyEditor.css'

interface TagHierarchyEditorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  onClose?: () => void
}

export default function TagHierarchyEditor({ selectedTags, onChange, onClose }: TagHierarchyEditorProps) {
  const [tags, setTags] = useState<TagNode[]>([])
  const [tree, setTree] = useState<TagNode[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#007AFF')
  const [parentTagId, setParentTagId] = useState<string | undefined>()

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = () => {
    const loadedTags = TagHierarchyService.getTags()
    setTags(loadedTags)
    setTree(TagHierarchyService.buildTree(loadedTags))
  }

  const handleCreateTag = () => {
    if (!newTagName.trim()) return

    TagHierarchyService.addTag({
      name: newTagName,
      color: newTagColor,
      parentId: parentTagId
    })
    setNewTagName('')
    setNewTagColor('#007AFF')
    setParentTagId(undefined)
    setShowCreate(false)
    loadTags()
  }

  const handleDeleteTag = (tagId: string) => {
    if (confirm('Удалить тег и все дочерние теги?')) {
      TagHierarchyService.deleteTag(tagId)
      loadTags()
    }
  }

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId))
    } else {
      onChange([...selectedTags, tagId])
    }
  }

  const renderTag = (tag: TagNode, level: number = 0) => {
    const isSelected = selectedTags.includes(tag.id)
    const path = TagHierarchyService.getTagPath(tag.id, tags)

    return (
      <div key={tag.id} className="tag-node" style={{ marginLeft: `${level * 20}px` }}>
        <div className="tag-item">
          <label className="tag-checkbox-label">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleTag(tag.id)}
              className="tag-checkbox"
            />
            <span
              className="tag-name"
              style={{ color: tag.color || 'inherit' }}
            >
              {path.join(' > ')}
            </span>
          </label>
          <button
            onClick={() => handleDeleteTag(tag.id)}
            className="tag-delete-btn"
          >
            ×
          </button>
        </div>
        {tag.children && tag.children.map(child => renderTag(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="tag-hierarchy-editor">
      <div className="tag-hierarchy-header">
        <h3>🏷️ Иерархия тегов</h3>
        <button
          className="create-tag-btn"
          onClick={() => setShowCreate(!showCreate)}
        >
          + Создать тег
        </button>
      </div>

      {showCreate && (
        <div className="create-tag-form">
          <input
            type="text"
            placeholder="Название тега"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="form-input"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="color-input"
          />
          <select
            value={parentTagId || ''}
            onChange={(e) => setParentTagId(e.target.value || undefined)}
            className="parent-select"
          >
            <option value="">Без родителя</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {TagHierarchyService.getTagPath(tag.id, tags).join(' > ')}
              </option>
            ))}
          </select>
          <button onClick={handleCreateTag} className="save-btn">
            Создать
          </button>
        </div>
      )}

      <div className="tags-tree">
        {tree.length === 0 ? (
          <p className="empty-state">Нет тегов. Создайте первый!</p>
        ) : (
          tree.map(tag => renderTag(tag))
        )}
      </div>
    </div>
  )
}

