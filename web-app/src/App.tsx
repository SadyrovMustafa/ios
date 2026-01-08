import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TaskListView from './components/TaskListView'
import EnhancedCalendarView from './components/EnhancedCalendarView'
import AnalyticsView from './components/AnalyticsView'
import { TaskManager } from './services/TaskManager'
import { RecurringTaskService } from './services/RecurringTaskService'
import { PushNotificationService } from './services/PushNotificationService'
import { OfflineQueue } from './services/OfflineQueue'
import { TaskList } from './types/Task'
import ToastContainer from './components/ToastContainer'
import Onboarding from './components/Onboarding'
import './i18n/config' // Initialize i18n
import './App.css'

// Lazy load heavy components
const KanbanBoard = lazy(() => import('./components/KanbanBoard'))

function App() {
  const [taskManager] = useState(() => new TaskManager())
  const [lists, setLists] = useState<TaskList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const loadedLists = taskManager.getLists()
    setLists(loadedLists)
    if (loadedLists.length > 0 && !selectedListId) {
      setSelectedListId(loadedLists[0].id)
    }

    // Process recurring tasks on app load
    RecurringTaskService.processRecurringTasks(taskManager)

    // Request notification permission
    if ('Notification' in window) {
      PushNotificationService.requestPermission().catch(console.error)
    }

    // Initialize offline queue
    OfflineQueue.initializeDB().catch(console.error)

    // Check if onboarding is needed
    const hasCompletedOnboarding = localStorage.getItem('ticktick_onboarding_completed')
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
  }, [taskManager, selectedListId])

  const handleListsChange = () => {
    setLists(taskManager.getLists())
  }

  return (
    <Router>
      <div className="app">
        <ToastContainer />
        <Sidebar
          lists={lists}
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
          onListsChange={handleListsChange}
          taskManager={taskManager}
        />
        <main className="main-content">
          <Routes>
            <Route
              path="/list/:listId"
              element={
                <TaskListView
                  taskManager={taskManager}
                  onListsChange={handleListsChange}
                />
              }
            />
            <Route
              path="/today"
              element={
                <TaskListView
                  taskManager={taskManager}
                  viewType="today"
                  onListsChange={handleListsChange}
                />
              }
            />
            <Route
              path="/all"
              element={
                <TaskListView
                  taskManager={taskManager}
                  viewType="all"
                  onListsChange={handleListsChange}
                />
              }
            />
            <Route
              path="/calendar"
              element={
                <EnhancedCalendarView
                  tasks={taskManager.getTasks()}
                  onTaskClick={(task) => {
                    // Navigate to task detail or list
                    window.location.href = `/list/${task.listId}`
                  }}
                />
              }
            />
                <Route
                  path="/analytics"
                  element={
                    <Suspense fallback={<div>Loading...</div>}>
                      <AnalyticsView
                        taskManager={taskManager}
                      />
                    </Suspense>
                  }
                />
                <Route
                  path="/kanban"
                  element={
                    <Suspense fallback={<div>Loading...</div>}>
                      <KanbanBoard
                        taskManager={taskManager}
                      />
                    </Suspense>
                  }
                />
            <Route
              path="/"
              element={
                selectedListId ? (
                  <Navigate to={`/list/${selectedListId}`} replace />
                ) : (
                  <div className="empty-state">
                    <p>Выберите список задач</p>
                  </div>
                )
              }
            />
          </Routes>
        </main>
      </div>

      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </Router>
  )
}

export default App

