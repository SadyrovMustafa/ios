import { FixedSizeList } from 'react-window'
import { Task } from '../types/Task'
import TaskItem from './TaskItem'
import './VirtualizedTaskList.css'

interface VirtualizedTaskListProps {
  tasks: Task[]
  onToggleComplete: (task: Task) => void
  onDelete: (taskId: string) => void
  onTaskClick: (task: Task) => void
  height?: number
}

export default function VirtualizedTaskList({
  tasks,
  onToggleComplete,
  onDelete,
  onTaskClick,
  height = 600
}: VirtualizedTaskListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = tasks[index]
    if (!task) return null

    return (
      <div style={style}>
        <TaskItem
          task={task}
          onToggleComplete={() => onToggleComplete(task)}
          onDelete={() => onDelete(task.id)}
          onClick={() => onTaskClick(task)}
        />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-tasks">
        <p>No tasks found</p>
      </div>
    )
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={tasks.length}
      itemSize={80}
      width="100%"
      className="virtualized-list"
    >
      {Row}
    </FixedSizeList>
  )
}

