import React, { useState, useEffect } from 'react'
import { ApprovalService, Approval } from '../services/ApprovalService'
import { TaskManager } from '../services/TaskManager'
import { LocalAuthService } from '../services/LocalAuthService'
import './ApprovalPanel.css'

interface ApprovalPanelProps {
  taskId?: string
  onClose: () => void
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ taskId, onClose }) => {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [currentUser] = useState(LocalAuthService.getCurrentUser())

  useEffect(() => {
    if (currentUser) {
      if (taskId) {
        const approval = ApprovalService.getApprovalForTask(taskId)
        setApprovals(approval ? [approval] : [])
      } else {
        setApprovals(ApprovalService.getApprovalsForUser(currentUser.id))
      }
    }
  }, [taskId, currentUser])

  const handleRequestApproval = (taskId: string, approvers: string[]) => {
    if (!currentUser) return
    ApprovalService.requestApproval(taskId, currentUser.id, approvers)
    if (currentUser) {
      setApprovals(ApprovalService.getApprovalsForUser(currentUser.id))
    }
  }

  const handleApprove = (approvalId: string) => {
    if (!currentUser) return
    ApprovalService.approve(approvalId, currentUser.id)
    if (currentUser) {
      setApprovals(ApprovalService.getApprovalsForUser(currentUser.id))
    }
  }

  const handleReject = (approvalId: string) => {
    if (!currentUser) return
    const reason = prompt('Причина отклонения:')
    ApprovalService.reject(approvalId, currentUser.id, reason || undefined)
    if (currentUser) {
      setApprovals(ApprovalService.getApprovalsForUser(currentUser.id))
    }
  }

  return (
    <div className="approval-panel">
      <div className="panel-header">
        <h2>✅ Утверждения</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <div className="approvals-list">
          {approvals.map(approval => (
            <div key={approval.id} className={`approval-card ${approval.status}`}>
              <div className="approval-header">
                <span className="status-badge">{approval.status}</span>
                <span>Задача: {approval.taskId}</span>
              </div>
              <div className="approval-actions">
                {approval.status === 'pending' && approval.approvers.includes(currentUser?.id || '') && (
                  <>
                    <button className="btn-approve" onClick={() => handleApprove(approval.id)}>Утвердить</button>
                    <button className="btn-reject" onClick={() => handleReject(approval.id)}>Отклонить</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

