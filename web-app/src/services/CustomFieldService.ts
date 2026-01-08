export type CustomFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'multiselect' | 'checkbox' | 'person' | 'url'

export interface CustomFieldOption {
  id: string
  label: string
  color?: string
}

export interface CustomField {
  id: string
  name: string
  type: CustomFieldType
  projectId?: string // If null, field is global
  listId?: string // If null, field is project-wide
  required: boolean
  options?: CustomFieldOption[] // For dropdown and multiselect
  defaultValue?: any
  createdAt: Date
}

export interface CustomFieldValue {
  fieldId: string
  value: any
}

export class CustomFieldService {
  private static fieldsKey = 'ticktick_custom_fields'
  private static valuesKey = 'ticktick_custom_field_values'

  static createField(
    name: string,
    type: CustomFieldType,
    projectId?: string,
    listId?: string,
    required: boolean = false,
    options?: CustomFieldOption[],
    defaultValue?: any
  ): CustomField {
    const fields = this.getAllFields()
    const newField: CustomField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      projectId,
      listId,
      required,
      options,
      defaultValue,
      createdAt: new Date()
    }

    fields.push(newField)
    this.saveFields(fields)

    return newField
  }

  static updateField(fieldId: string, updates: Partial<Omit<CustomField, 'id' | 'createdAt'>>): void {
    const fields = this.getAllFields()
    const field = fields.find(f => f.id === fieldId)
    if (field) {
      Object.assign(field, updates)
      this.saveFields(fields)
    }
  }

  static deleteField(fieldId: string): void {
    const fields = this.getAllFields().filter(f => f.id !== fieldId)
    this.saveFields(fields)
    
    // Remove all values for this field
    const values = this.getAllValues()
    const filteredValues = values.filter(v => v.fieldId !== fieldId)
    this.saveValues(filteredValues)
  }

  static getField(fieldId: string): CustomField | undefined {
    return this.getAllFields().find(f => f.id === fieldId)
  }

  static getAllFields(): CustomField[] {
    const data = localStorage.getItem(this.fieldsKey)
    if (!data) return []
    return JSON.parse(data).map((f: any) => ({
      ...f,
      createdAt: new Date(f.createdAt)
    }))
  }

  static getFieldsForProject(projectId: string): CustomField[] {
    return this.getAllFields().filter(f => 
      f.projectId === projectId || (!f.projectId && !f.listId)
    )
  }

  static getFieldsForList(listId: string, projectId?: string): CustomField[] {
    return this.getAllFields().filter(f => 
      f.listId === listId || 
      (f.projectId === projectId && !f.listId) ||
      (!f.projectId && !f.listId)
    )
  }

  static setFieldValue(taskId: string, fieldId: string, value: any): void {
    const values = this.getAllValues()
    const existingIndex = values.findIndex(v => v.taskId === taskId && v.fieldId === fieldId)
    
    const fieldValue = { taskId, fieldId, value }
    
    if (existingIndex >= 0) {
      values[existingIndex] = fieldValue
    } else {
      values.push(fieldValue)
    }
    
    this.saveValues(values)
  }

  static getFieldValue(taskId: string, fieldId: string): any {
    const values = this.getAllValues()
    const value = values.find(v => v.taskId === taskId && v.fieldId === fieldId)
    return value ? value.value : undefined
  }

  static getTaskFieldValues(taskId: string): CustomFieldValue[] {
    return this.getAllValues().filter(v => v.taskId === taskId)
  }

  static deleteTaskFieldValues(taskId: string): void {
    const values = this.getAllValues().filter(v => v.taskId !== taskId)
    this.saveValues(values)
  }

  static getAllValues(): Array<CustomFieldValue & { taskId: string }> {
    const data = localStorage.getItem(this.valuesKey)
    if (!data) return []
    return JSON.parse(data)
  }

  private static saveFields(fields: CustomField[]): void {
    localStorage.setItem(this.fieldsKey, JSON.stringify(fields))
  }

  private static saveValues(values: Array<CustomFieldValue & { taskId: string }>): void {
    localStorage.setItem(this.valuesKey, JSON.stringify(values))
  }
}

