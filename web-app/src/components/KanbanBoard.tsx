import { useState, useMemo } from 'react'
import { Task, TaskList } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import { TaskAssignmentService } from '../services/TaskAssignmentService'
import { LocalAuthService } from '../services/LocalAuthService'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './KanbanBoard.css'

interface KanbanBoardProps {
  taskManager: TaskManager
  listId?: string
  filterByUser?: string // Filter tasks by assigned user
}

export default function KanbanBoard({ taskManager, listId, filterByUser }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists] = useState<TaskList[]>(taskManager.getLists())
  const [selectedUserId, setSelectedUserId] = useState<string>(filterByUser || '')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useMemo(() => {
    let loadedTasks = listId
      ? taskManager.getTasksForList(listId)
      : taskManager.getTasks()
    
    // Filter by assigned user if specified
    if (selectedUserId) {
      loadedTasks = TaskAssignmentService.getTasksForUser(selectedUserId, loadedTasks)
    }
    
    setTasks(loadedTasks)
  }, [taskManager, listId, selectedUserId])

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter(t => !t.isCompleted && !t.dueDate),
      inProgress: tasks.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) >= new Date()),
      done: tasks.filter(t => t.isCompleted)
    }
  }, [tasks])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find task
    const task = tasks.find(t => t.id === activeId)
    if (!task) return

    // Determine new status based on column
    let newStatus: 'todo' | 'inProgress' | 'done' = 'todo'
    if (overId === 'column-done') newStatus = 'done'
    else if (overId === 'column-inProgress') newStatus = 'inProgress'
    else if (overId === 'column-todo') newStatus = 'todo'

    // Update task
    if (newStatus === 'done' && !task.isCompleted) {
      taskManager.toggleTaskCompletion(task)
    } else if (newStatus !== 'done' && task.isCompleted) {
      taskManager.toggleTaskCompletion(task)
    }

    // Reload tasks
    const loadedTasks = listId
      ? taskManager.getTasksForList(listId)
      : taskManager.getTasks()
    setTasks(loadedTasks)
  }

  const users = LocalAuthService.getAllUsers()

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h1 className="kanban-title">📋 Kanban Board</h1>
        <div className="kanban-filters">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="filter-select"
          >
            <option value="">Все задачи</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          <KanbanColumn
            id="column-todo"
            title="To Do"
            tasks={tasksByStatus.todo}
            color="#007AFF"
          />
          <KanbanColumn
            id="column-inProgress"
            title="In Progress"
            tasks={tasksByStatus.inProgress}
            color="#FF9500"
          />
          <KanbanColumn
            id="column-done"
            title="Done"
            tasks={tasksByStatus.done}
            color="#34C759"
          />
        </div>
      </DndContext>
    </div>
  )
}

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  color: string
}

function KanbanColumn({ id, title, tasks, color }: KanbanColumnProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="kanban-column">
      <div className="column-header" style={{ borderTopColor: color }}>
        <h2>{title}</h2>
        <span className="column-count">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="column-content">
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

interface KanbanCardProps {
  task: Task
}

function KanbanCard({ task }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const assignment = TaskAssignmentService.getAssignment(task.id)
  const assignedUser = assignment ? LocalAuthService.getUserById(assignment.assignedTo) : null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
    >
      <div className="card-title">{task.title}</div>
      {assignedUser && (
        <div className="card-assigned">
          👤 {assignedUser.name}
        </div>
      )}
      {task.dueDate && (
        <div className="card-date">
          {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
      {task.priority !== 'none' && (
        <div className={`card-priority ${task.priority}`}>
          {task.priority}
        </div>
      )}
    </div>
  )
}

