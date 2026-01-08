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
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../types/Task'
import TaskItem from './TaskItem'
import './DragDropTaskList.css'

interface DragDropTaskListProps {
  tasks: Task[]
  onReorder: (tasks: Task[]) => void
  onToggleComplete: (task: Task) => void
  onDelete: (taskId: string) => void
  onTaskClick: (task: Task) => void
}

export default function DragDropTaskList({
  tasks,
  onReorder,
  onToggleComplete,
  onDelete,
  onTaskClick
}: DragDropTaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id)
      const newIndex = tasks.findIndex((task) => task.id === over.id)
      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      onReorder(newTasks)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="drag-drop-list">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onToggleComplete={() => onToggleComplete(task)}
              onDelete={() => onDelete(task.id)}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface SortableTaskItemProps {
  task: Task
  onToggleComplete: () => void
  onDelete: () => void
  onClick: () => void
}

function SortableTaskItem({ task, onToggleComplete, onDelete, onClick }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="sortable-item">
      <div className="drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      <div className="task-item-wrapper" onClick={onClick}>
        <TaskItem
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onClick={onClick}
        />
      </div>
    </div>
  )
}

