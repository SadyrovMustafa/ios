export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Approval {
  id: string
  taskId: string
  requestedBy: string
  requestedAt: Date
  approvers: string[] // User IDs
  status: ApprovalStatus
  comments: ApprovalComment[]
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
}

export interface ApprovalComment {
  id: string
  userId: string
  text: string
  createdAt: Date
}

export class ApprovalService {
  private static approvalsKey = 'ticktick_approvals'

  static requestApproval(
    taskId: string,
    requestedBy: string,
    approvers: string[]
  ): Approval {
    const approvals = this.getAllApprovals()
    const newApproval: Approval = {
      id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      requestedBy,
      requestedAt: new Date(),
      approvers,
      status: 'pending',
      comments: []
    }

    approvals.push(newApproval)
    this.saveApprovals(approvals)

    return newApproval
  }

  static approve(approvalId: string, approvedBy: string): void {
    const approvals = this.getAllApprovals()
    const approval = approvals.find(a => a.id === approvalId)
    if (approval && approval.status === 'pending') {
      approval.status = 'approved'
      approval.approvedBy = approvedBy
      approval.approvedAt = new Date()
      this.saveApprovals(approvals)
    }
  }

  static reject(approvalId: string, rejectedBy: string, reason?: string): void {
    const approvals = this.getAllApprovals()
    const approval = approvals.find(a => a.id === approvalId)
    if (approval && approval.status === 'pending') {
      approval.status = 'rejected'
      approval.rejectedBy = rejectedBy
      approval.rejectedAt = new Date()
      approval.rejectionReason = reason
      this.saveApprovals(approvals)
    }
  }

  static cancelApproval(approvalId: string): void {
    const approvals = this.getAllApprovals()
    const approval = approvals.find(a => a.id === approvalId)
    if (approval && approval.status === 'pending') {
      approval.status = 'cancelled'
      this.saveApprovals(approvals)
    }
  }

  static getApproval(approvalId: string): Approval | undefined {
    return this.getAllApprovals().find(a => a.id === approvalId)
  }

  static getApprovalForTask(taskId: string): Approval | undefined {
    return this.getAllApprovals()
      .filter(a => a.taskId === taskId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())[0]
  }

  static getAllApprovals(): Approval[] {
    const data = localStorage.getItem(this.approvalsKey)
    if (!data) return []
    return JSON.parse(data).map((a: any) => ({
      ...a,
      requestedAt: new Date(a.requestedAt),
      approvedAt: a.approvedAt ? new Date(a.approvedAt) : undefined,
      rejectedAt: a.rejectedAt ? new Date(a.rejectedAt) : undefined,
      comments: a.comments.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt)
      }))
    }))
  }

  static getApprovalsForUser(userId: string): Approval[] {
    return this.getAllApprovals().filter(a => 
      a.approvers.includes(userId) || a.requestedBy === userId
    )
  }

  static getPendingApprovalsForUser(userId: string): Approval[] {
    return this.getAllApprovals()
      .filter(a => a.status === 'pending' && a.approvers.includes(userId))
      .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime())
  }

  static addComment(approvalId: string, userId: string, text: string): void {
    const approvals = this.getAllApprovals()
    const approval = approvals.find(a => a.id === approvalId)
    if (approval) {
      approval.comments.push({
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        text,
        createdAt: new Date()
      })
      this.saveApprovals(approvals)
    }
  }

  static getApprovalHistory(taskId: string): Approval[] {
    return this.getAllApprovals()
      .filter(a => a.taskId === taskId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
  }

  private static saveApprovals(approvals: Approval[]): void {
    localStorage.setItem(this.approvalsKey, JSON.stringify(approvals))
  }
}

