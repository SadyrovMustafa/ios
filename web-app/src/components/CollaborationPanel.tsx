import { useState, useEffect } from 'react'
import { FirebaseService } from '../services/FirebaseService'
import { TaskManager } from '../services/TaskManager'
import './CollaborationPanel.css'

interface CollaborationPanelProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function CollaborationPanel({ taskManager, onClose }: CollaborationPanelProps) {
  const [sharedLists, setSharedLists] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [comments, setComments] = useState<Array<{ id: string; userId: string; text: string; createdAt: Date }>>([])
  const [newComment, setNewComment] = useState('')
  const [newSharedListName, setNewSharedListName] = useState('')

  useEffect(() => {
    if (FirebaseService.isAvailable() && FirebaseService.getCurrentUser()) {
      loadSharedLists()
    }
  }, [])

  useEffect(() => {
    if (selectedTask) {
      loadComments()
    }
  }, [selectedTask])

  const loadSharedLists = async () => {
    try {
      const user = FirebaseService.getCurrentUser()
      if (!user) return
      const lists = await FirebaseService.getSharedLists(user.uid)
      setSharedLists(lists)
    } catch (error) {
      console.error('Failed to load shared lists:', error)
    }
  }

  const loadComments = async () => {
    if (!selectedTask) return
    try {
      const comments = await FirebaseService.getComments(selectedTask)
      setComments(comments)
    } catch (error) {
      console.error('Failed to load comments:', error)
    }
  }

  const handleCreateSharedList = async () => {
    if (!newSharedListName.trim()) return
    try {
      const user = FirebaseService.getCurrentUser()
      if (!user) return
      const newList = {
        id: `shared-${Date.now()}`,
        name: newSharedListName,
        color: '#007AFF'
      }
      await FirebaseService.createSharedList(newList, user.uid)
      setNewSharedListName('')
      loadSharedLists()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return
    try {
      const user = FirebaseService.getCurrentUser()
      if (!user) return
      await FirebaseService.addComment(selectedTask, user.uid, newComment)
      setNewComment('')
      loadComments()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  if (!FirebaseService.isAvailable()) {
    return (
      <div className="collab-overlay" onClick={onClose}>
        <div className="collab-modal" onClick={(e) => e.stopPropagation()}>
          <div className="collab-header">
            <h2>👥 Collaboration</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="collab-content">
            <p>Please configure Firebase to use collaboration features.</p>
          </div>
        </div>
      </div>
    )
  }

  const user = FirebaseService.getCurrentUser()
  if (!user) {
    return (
      <div className="collab-overlay" onClick={onClose}>
        <div className="collab-modal" onClick={(e) => e.stopPropagation()}>
          <div className="collab-header">
            <h2>👥 Collaboration</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="collab-content">
            <p>Please sign in to use collaboration features.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="collab-overlay" onClick={onClose}>
      <div className="collab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="collab-header">
          <h2>👥 Collaboration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="collab-content">
          <div className="collab-section">
            <h3>Shared Lists</h3>
            <div className="create-shared-list">
              <input
                type="text"
                placeholder="List name"
                value={newSharedListName}
                onChange={(e) => setNewSharedListName(e.target.value)}
                className="shared-list-input"
              />
              <button onClick={handleCreateSharedList} className="create-btn">
                Create Shared List
              </button>
            </div>
            <div className="shared-lists">
              {sharedLists.map(list => (
                <div key={list.id} className="shared-list-item">
                  <span>{list.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="collab-section">
            <h3>Comments</h3>
            <select
              value={selectedTask || ''}
              onChange={(e) => setSelectedTask(e.target.value || null)}
              className="task-select"
            >
              <option value="">Select a task...</option>
              {taskManager.getTasks().map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>

            {selectedTask && (
              <>
                <div className="comments-list">
                  {comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <strong>User {comment.userId.slice(0, 8)}</strong>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                    </div>
                  ))}
                </div>
                <div className="add-comment">
                  <textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="comment-input"
                  />
                  <button onClick={handleAddComment} className="comment-btn">
                    Add Comment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

