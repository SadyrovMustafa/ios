export interface TagNode {
  id: string
  name: string
  color?: string
  parentId?: string
  children?: TagNode[]
  createdAt: Date
}

export class TagHierarchyService {
  private static tagsKey = 'ticktick_tag_hierarchy'

  static getTags(): TagNode[] {
    const data = localStorage.getItem(this.tagsKey)
    if (!data) return []
    return JSON.parse(data).map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      children: t.children ? t.children.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt)
      })) : []
    }))
  }

  static buildTree(tags: TagNode[]): TagNode[] {
    const tagMap = new Map<string, TagNode>()
    const rootTags: TagNode[] = []

    // Create map
    tags.forEach(tag => {
      tagMap.set(tag.id, { ...tag, children: [] })
    })

    // Build tree
    tags.forEach(tag => {
      const node = tagMap.get(tag.id)!
      if (tag.parentId) {
        const parent = tagMap.get(tag.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(node)
        }
      } else {
        rootTags.push(node)
      }
    })

    return rootTags
  }

  static addTag(tag: Omit<TagNode, 'id' | 'createdAt' | 'children'>): TagNode {
    const tags = this.getTags()
    const newTag: TagNode = {
      ...tag,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      children: []
    }
    tags.push(newTag)
    this.saveTags(tags)
    return newTag
  }

  static updateTag(tag: TagNode): void {
    const tags = this.getTags()
    const index = tags.findIndex(t => t.id === tag.id)
    if (index !== -1) {
      tags[index] = tag
      this.saveTags(tags)
    }
  }

  static deleteTag(tagId: string): void {
    const tags = this.getTags()
    // Remove tag and all its children
    const toRemove = this.getAllDescendants(tagId, tags)
    const updated = tags.filter(t => !toRemove.includes(t.id) && t.id !== tagId)
    this.saveTags(updated)
  }

  static getAllDescendants(tagId: string, tags: TagNode[]): string[] {
    const descendants: string[] = []
    const children = tags.filter(t => t.parentId === tagId)
    
    children.forEach(child => {
      descendants.push(child.id)
      descendants.push(...this.getAllDescendants(child.id, tags))
    })
    
    return descendants
  }

  static getTagPath(tagId: string, tags: TagNode[]): string[] {
    const path: string[] = []
    let currentId: string | undefined = tagId

    while (currentId) {
      const tag = tags.find(t => t.id === currentId)
      if (tag) {
        path.unshift(tag.name)
        currentId = tag.parentId
      } else {
        break
      }
    }

    return path
  }

  private static saveTags(tags: TagNode[]): void {
    localStorage.setItem(this.tagsKey, JSON.stringify(tags))
  }
}

