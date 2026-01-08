import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Task, TaskList, Priority } from '../types/Task'
import { TaskManager } from '../services/TaskManager'
import TaskItem from './TaskItem'
import AddTaskModal from './AddTaskModal'
import TaskDetailModal from './TaskDetailModal'
import SearchBar from './SearchBar'
import FilterBar, { FilterOptions } from './FilterBar'
import StatsPanel from './StatsPanel'
import AdvancedSearch, { AdvancedSearchQuery } from './AdvancedSearch'
import DragDropTaskList from './DragDropTaskList'
import VirtualizedTaskList from './VirtualizedTaskList'
import FocusMode from './FocusMode'
import SkeletonLoader from './SkeletonLoader'
import MultiSelectTaskList from './MultiSelectTaskList'
import TaskGrouping, { GroupBy } from './TaskGrouping'
import TagFilters from './TagFilters'
import DailyGoalsPanel from './DailyGoalsPanel'
import HabitsPanel from './HabitsPanel'
import FocusStatsPanel from './FocusStatsPanel'
import LocationReminder from './LocationReminder'
import { usePullToRefresh } from '../utils/pullToRefresh'
import { DailyGoalsService } from '../services/DailyGoalsService'
import { FocusStatsService } from '../services/FocusStatsService'
import { ArchiveService } from '../services/ArchiveService'
import { toastService } from '../services/ToastService'
import { useRef, useEffect as useRefEffect } from 'react'
import './TaskListView.css'

interface TaskListViewProps {
  taskManager: TaskManager
  viewType?: 'today' | 'all'
  onListsChange: () => void
}

export default function TaskListView({
  taskManager,
  viewType,
  onListsChange
}: TaskListViewProps) {
  const { listId } = useParams<{ listId: string }>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [list, setList] = useState<TaskList | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({
    priority: 'all',
    status: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [showStats, setShowStats] = useState(true)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedQuery, setAdvancedQuery] = useState<AdvancedSearchQuery | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showDailyGoals, setShowDailyGoals] = useState(false)
  const [showHabits, setShowHabits] = useState(false)
  const [showFocusStats, setShowFocusStats] = useState(false)
  const [showLocationReminder, setShowLocationReminder] = useState(false)
  const [selectedTaskForLocation, setSelectedTaskForLocation] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      loadTasks()
      setIsLoading(false)
    }, 300)
  }, [listId, viewType])

  // Pull to refresh
  useRefEffect(() => {
    if (!contentRef.current) return

    const cleanup = usePullToRefresh(contentRef.current, {
      onRefresh: async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        loadTasks()
      }
    })

    return cleanup
  }, [])

  const loadTasks = () => {
    let loadedTasks: Task[] = []
    let loadedList: TaskList | null = null

    if (viewType === 'today') {
      loadedTasks = taskManager.getTasksForToday()
    } else if (viewType === 'all') {
      loadedTasks = taskManager.getTasks()
    } else if (listId) {
      loadedList = taskManager.getList(listId) || null
      loadedTasks = taskManager.getTasksForList(listId)
    }

    setTasks(loadedTasks)
    setList(loadedList)
  }

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]

    // Advanced search
    if (advancedQuery) {
      if (advancedQuery.text.trim()) {
        const query = advancedQuery.text.toLowerCase()
        filtered = filtered.filter(task =>
          task.title.toLowerCase().includes(query) ||
          task.notes.toLowerCase().includes(query)
        )
      }

      if (advancedQuery.tags.length > 0) {
        filtered = filtered.filter(task =>
          task.tags && advancedQuery.tags.every(tag => task.tags!.includes(tag))
        )
      }

      if (advancedQuery.priority !== 'all') {
        filtered = filtered.filter(task => task.priority === advancedQuery.priority)
      }

      if (advancedQuery.status === 'active') {
        filtered = filtered.filter(task => !task.isCompleted)
      } else if (advancedQuery.status === 'completed') {
        filtered = filtered.filter(task => task.isCompleted)
      }

      if (advancedQuery.hasDueDate === true) {
        filtered = filtered.filter(task => !!task.dueDate)
        if (advancedQuery.dueDateFrom) {
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) >= advancedQuery.dueDateFrom!
          )
        }
        if (advancedQuery.dueDateTo) {
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) <= advancedQuery.dueDateTo!
          )
        }
      }

      if (advancedQuery.hasSubtasks === true) {
        filtered = filtered.filter(task => task.subtasks && task.subtasks.length > 0)
      }

      if (advancedQuery.hasRecurring === true) {
        filtered = filtered.filter(task => !!task.recurring)
      }
    } else {
      // Basic search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(task =>
          task.title.toLowerCase().includes(query) ||
          task.notes.toLowerCase().includes(query)
        )
      }

      // Priority filter
      if (filters.priority !== 'all') {
        filtered = filtered.filter(task => task.priority === filters.priority)
      }

      // Status filter
      if (filters.status === 'active') {
        filtered = filtered.filter(task => !task.isCompleted)
      } else if (filters.status === 'completed') {
        filtered = filtered.filter(task => task.isCompleted)
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case 'date':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0
          comparison = dateA - dateB
          break
        case 'priority':
          const priorityOrder: Record<Priority, number> = { 
            [Priority.High]: 3, 
            [Priority.Medium]: 2, 
            [Priority.Low]: 1, 
            [Priority.None]: 0 
          }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [tasks, searchQuery, filters])

  const activeTasks = filteredAndSortedTasks.filter(task => !task.isCompleted)
  const completedTasks = filteredAndSortedTasks.filter(task => task.isCompleted)

  const handleTaskChange = () => {
    loadTasks()
  }

  const handleDeleteTask = (taskId: string) => {
    taskManager.deleteTask(taskId)
    loadTasks()
  }

  const handleToggleComplete = (task: Task) => {
    taskManager.toggleTaskCompletion(task)
    loadTasks()
    
    // Update daily goals
    const today = new Date()
    const completedToday = taskManager.getTasks().filter(t => {
      if (!t.completedAt) return false
      return new Date(t.completedAt).toDateString() === today.toDateString()
    }).length
    DailyGoalsService.updateCompletedTasks(today, completedToday)

    // Update social profile if task was completed
    if (task.isCompleted) {
      try {
        const { SocialService } = require('../services/SocialService')
        const { LocalAuthService } = require('../services/LocalAuthService')
        const currentUser = LocalAuthService.getCurrentUser()
        if (currentUser) {
          SocialService.incrementTasksCompleted(currentUser.id)
        }
      } catch (error) {
        // Social service not available
      }
    }
  }

  const handleBulkAction = (taskIds: string[], action: 'delete' | 'complete' | 'archive') => {
    taskIds.forEach(taskId => {
      const task = taskManager.getTasks().find(t => t.id === taskId)
      if (!task) return

      switch (action) {
        case 'delete':
          taskManager.deleteTask(taskId)
          break
        case 'complete':
          if (!task.isCompleted) {
            taskManager.toggleTaskCompletion(task)
          }
          break
        case 'archive':
          ArchiveService.archiveTask(task)
          taskManager.deleteTask(taskId)
          break
      }
    })
    loadTasks()
    toastService.success(`${action === 'delete' ? 'Удалено' : action === 'complete' ? 'Выполнено' : 'Заархивировано'}: ${taskIds.length} задач`)
  }

  const getTitle = () => {
    if (viewType === 'today') return 'Today'
    if (viewType === 'all') return 'All Tasks'
    return list?.name || 'Tasks'
  }

  return (
    <div className="task-list-view">
      <div className="task-list-header">
        <h1 className="task-list-title">{getTitle()}</h1>
        <div className="header-actions">
          <button
            className="stats-toggle-btn"
            onClick={() => setShowStats(!showStats)}
            aria-label="Toggle statistics"
          >
            {showStats ? '📊' : '📈'}
          </button>
          <button
            className="add-task-btn"
            onClick={() => setShowAddTask(true)}
            aria-label="Add task"
          >
            + Add Task
          </button>
        </div>
      </div>

      {showStats && (
        <StatsPanel taskManager={taskManager} listId={listId} />
      )}

      <SearchBar 
        onSearch={(query) => {
          setSearchQuery(query)
          setAdvancedQuery(null) // Clear advanced search when using basic search
        }}
        onAdvancedSearch={() => setShowAdvancedSearch(true)}
      />

      <FilterBar onFilterChange={setFilters} currentFilters={filters} />

      <div className="task-list-content">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              {searchQuery ? 'No tasks found' : 'No tasks yet'}
            </p>
            {!searchQuery && (
              <button
                className="empty-state-btn"
                onClick={() => setShowAddTask(true)}
              >
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <>
            {activeTasks.length > 0 && (
              <div className="task-section">
                {activeTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="task-section">
                <div className="section-header">
                  <h2 className="section-title">Completed</h2>
                  <button
                    className="toggle-completed-btn"
                    onClick={() => setShowCompleted(!showCompleted)}
                  >
                    {showCompleted ? '▼' : '▶'}
                  </button>
                </div>
                {showCompleted && (
                  <div className="completed-tasks">
                    {completedTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={() => handleToggleComplete(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onClick={() => setSelectedTask(task)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onAdd={(task) => {
            const created = taskManager.addTask({
              ...task,
              listId: listId || taskManager.getLists()[0]?.id || ''
            })
            handleTaskChange()
            setShowAddTask(false)
            return created
          }}
          defaultListId={listId || undefined}
          taskManager={taskManager}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            taskManager.updateTask(updatedTask)
            handleTaskChange()
            setSelectedTask(null)
          }}
          onDelete={(taskId) => {
            taskManager.deleteTask(taskId)
            handleTaskChange()
            setSelectedTask(null)
          }}
          taskManager={taskManager}
        />
      )}

      {showAdvancedSearch && (
        <AdvancedSearch
          onSearch={(query) => {
            setAdvancedQuery(query)
            setShowAdvancedSearch(false)
          }}
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}
    </div>
  )
}

