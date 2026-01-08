export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'file' | 'checkbox'

export interface FormField {
  id: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  options?: string[] // For select and multiselect
  defaultValue?: any
}

export interface Form {
  id: string
  name: string
  description?: string
  projectId: string
  fields: FormField[]
  assigneeFieldId?: string // Field that determines task assignee
  listId?: string // List where tasks will be created
  public: boolean
  publicUrl?: string
  createdAt: Date
  createdBy: string
}

export interface FormSubmission {
  id: string
  formId: string
  submittedAt: Date
  data: Record<string, any>
  taskId?: string // Created task ID
}

export class FormService {
  private static formsKey = 'ticktick_forms'
  private static submissionsKey = 'ticktick_form_submissions'

  static createForm(
    name: string,
    projectId: string,
    createdBy: string,
    description?: string,
    listId?: string,
    publicForm: boolean = false
  ): Form {
    const forms = this.getAllForms()
    const newForm: Form = {
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      projectId,
      fields: [],
      listId,
      public: publicForm,
      publicUrl: publicForm ? this.generatePublicUrl() : undefined,
      createdAt: new Date(),
      createdBy
    }

    forms.push(newForm)
    this.saveForms(forms)

    return newForm
  }

  static updateForm(formId: string, updates: Partial<Omit<Form, 'id' | 'createdAt' | 'createdBy'>>): void {
    const forms = this.getAllForms()
    const form = forms.find(f => f.id === formId)
    if (form) {
      Object.assign(form, updates)
      if (updates.public && !form.publicUrl) {
        form.publicUrl = this.generatePublicUrl()
      }
      this.saveForms(forms)
    }
  }

  static deleteForm(formId: string): void {
    const forms = this.getAllForms().filter(f => f.id !== formId)
    this.saveForms(forms)
    
    // Delete submissions
    const submissions = this.getAllSubmissions().filter(s => s.formId !== formId)
    this.saveSubmissions(submissions)
  }

  static getForm(formId: string): Form | undefined {
    return this.getAllForms().find(f => f.id === formId)
  }

  static getFormByPublicUrl(publicUrl: string): Form | undefined {
    return this.getAllForms().find(f => f.publicUrl === publicUrl)
  }

  static getAllForms(): Form[] {
    const data = localStorage.getItem(this.formsKey)
    if (!data) return []
    return JSON.parse(data).map((f: any) => ({
      ...f,
      createdAt: new Date(f.createdAt)
    }))
  }

  static getFormsForProject(projectId: string): Form[] {
    return this.getAllForms().filter(f => f.projectId === projectId)
  }

  static addFieldToForm(formId: string, field: FormField): void {
    const forms = this.getAllForms()
    const form = forms.find(f => f.id === formId)
    if (form) {
      form.fields.push(field)
      this.saveForms(forms)
    }
  }

  static updateFormField(formId: string, fieldId: string, updates: Partial<FormField>): void {
    const forms = this.getAllForms()
    const form = forms.find(f => f.id === formId)
    if (form) {
      const field = form.fields.find(f => f.id === fieldId)
      if (field) {
        Object.assign(field, updates)
        this.saveForms(forms)
      }
    }
  }

  static removeFieldFromForm(formId: string, fieldId: string): void {
    const forms = this.getAllForms()
    const form = forms.find(f => f.id === formId)
    if (form) {
      form.fields = form.fields.filter(f => f.id !== fieldId)
      this.saveForms(forms)
    }
  }

  static submitForm(formId: string, data: Record<string, any>): FormSubmission {
    const submissions = this.getAllSubmissions()
    const submission: FormSubmission = {
      id: `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      formId,
      submittedAt: new Date(),
      data
    }

    submissions.push(submission)
    this.saveSubmissions(submissions)

    return submission
  }

  static getAllSubmissions(): FormSubmission[] {
    const data = localStorage.getItem(this.submissionsKey)
    if (!data) return []
    return JSON.parse(data).map((s: any) => ({
      ...s,
      submittedAt: new Date(s.submittedAt)
    }))
  }

  static getSubmissionsForForm(formId: string): FormSubmission[] {
    return this.getAllSubmissions()
      .filter(s => s.formId === formId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
  }

  static linkSubmissionToTask(submissionId: string, taskId: string): void {
    const submissions = this.getAllSubmissions()
    const submission = submissions.find(s => s.id === submissionId)
    if (submission) {
      submission.taskId = taskId
      this.saveSubmissions(submissions)
    }
  }

  private static generatePublicUrl(): string {
    return `form-${Math.random().toString(36).substr(2, 16)}`
  }

  private static saveForms(forms: Form[]): void {
    localStorage.setItem(this.formsKey, JSON.stringify(forms))
  }

  private static saveSubmissions(submissions: FormSubmission[]): void {
    localStorage.setItem(this.submissionsKey, JSON.stringify(submissions))
  }
}

