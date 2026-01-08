export interface TagColor {
  tag: string
  color: string
}

export class TagColorService {
  private static colorsKey = 'ticktick_tag_colors'
  private static defaultColors = [
    '#FF3B30', // Красный
    '#FF9500', // Оранжевый
    '#FFCC00', // Желтый
    '#34C759', // Зеленый
    '#007AFF', // Синий
    '#5856D6', // Фиолетовый
    '#AF52DE', // Розовый
    '#FF2D55', // Розово-красный
    '#5AC8FA', // Голубой
    '#FF9500'  // Оранжевый
  ]

  static getColorForTag(tag: string): string {
    const colors = this.getTagColors()
    const tagColor = colors.find(tc => tc.tag === tag)
    if (tagColor) {
      return tagColor.color
    }

    // Генерировать цвет на основе хеша тега
    const hash = this.hashString(tag)
    return this.defaultColors[hash % this.defaultColors.length]
  }

  static setColorForTag(tag: string, color: string): void {
    const colors = this.getTagColors()
    const index = colors.findIndex(tc => tc.tag === tag)
    
    if (index !== -1) {
      colors[index].color = color
    } else {
      colors.push({ tag, color })
    }
    
    this.saveTagColors(colors)
  }

  static getTagColors(): TagColor[] {
    const data = localStorage.getItem(this.colorsKey)
    if (!data) return []
    return JSON.parse(data)
  }

  static getAllTagsWithColors(): TagColor[] {
    return this.getTagColors()
  }

  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  private static saveTagColors(colors: TagColor[]): void {
    localStorage.setItem(this.colorsKey, JSON.stringify(colors))
  }
}

