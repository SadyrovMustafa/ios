import { useState, useEffect } from 'react'
import { FirebaseService, initializeFirebase } from '../services/FirebaseService'
import { TaskManager } from '../services/TaskManager'
import { Task, TaskList } from '../types/Task'
import './CloudSync.css'

interface CloudSyncProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function CloudSync({ taskManager, onClose }: CloudSyncProps) {
  const [isInitialized, setIsInitialized] = useState(initializeFirebase())
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    if (!isInitialized) return

    const unsubscribe = FirebaseService.onAuthStateChanged((user) => {
      setUser(user)
    })

    return unsubscribe
  }, [isInitialized])

  const handleSignIn = async () => {
    try {
      if (isSignUp) {
        await FirebaseService.signUp(email, password)
      } else {
        await FirebaseService.signInWithEmail(email, password)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleSignInAnonymously = async () => {
    try {
      await FirebaseService.signInAnonymously()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleSync = async () => {
    if (!user) return
    setSyncing(true)
    try {
      const tasks = taskManager.getTasks()
      const lists = taskManager.getLists()
      await FirebaseService.syncTasks(user.uid, tasks)
      await FirebaseService.syncLists(user.uid, lists)
      setLastSync(new Date())
    } catch (error: any) {
      alert(`Sync error: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handlePull = async () => {
    if (!user) return
    setSyncing(true)
    try {
      const cloudTasks = await FirebaseService.getTasks(user.uid)
      const cloudLists = await FirebaseService.getLists(user.uid)
      
      // Merge with local data
      const localTasks = taskManager.getTasks()
      const localLists = taskManager.getLists()
      
      // Simple merge strategy: cloud wins
      cloudLists.forEach(list => {
        const exists = localLists.find(l => l.id === list.id)
        if (!exists) {
          taskManager.addList(list)
        }
      })
      
      cloudTasks.forEach(task => {
        const exists = localTasks.find(t => t.id === task.id)
        if (!exists) {
          taskManager.addTask(task)
        } else {
          taskManager.updateTask(task)
        }
      })
      
      alert('Data pulled from cloud successfully!')
    } catch (error: any) {
      alert(`Pull error: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await FirebaseService.signOut()
      setUser(null)
    } catch (error: any) {
      alert(`Sign out error: ${error.message}`)
    }
  }

  if (!isInitialized) {
    return (
      <div className="cloud-sync-overlay" onClick={onClose}>
        <div className="cloud-sync-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cloud-sync-header">
            <h2>☁️ Cloud Sync</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="cloud-sync-content">
            <p>Firebase not configured. Please add your Firebase config to <code>src/services/FirebaseService.ts</code></p>
            <p className="config-hint">
              Get your config from Firebase Console → Project Settings → General → Your apps
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cloud-sync-overlay" onClick={onClose}>
      <div className="cloud-sync-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cloud-sync-header">
          <h2>☁️ Cloud Sync</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="cloud-sync-content">
          {!user ? (
            <div className="auth-section">
              <h3>Sign In / Sign Up</h3>
              <div className="auth-form">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                />
                <button onClick={handleSignIn} className="auth-btn">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="toggle-auth-btn"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
                <div className="divider">OR</div>
                <button onClick={handleSignInAnonymously} className="auth-btn anonymous">
                  Sign In Anonymously
                </button>
              </div>
            </div>
          ) : (
            <div className="sync-section">
              <div className="user-info">
                <p>Signed in as: <strong>{user.email || 'Anonymous'}</strong></p>
                <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
              </div>

              {lastSync && (
                <p className="last-sync">Last sync: {lastSync.toLocaleString()}</p>
              )}

              <div className="sync-actions">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="sync-btn"
                >
                  {syncing ? 'Syncing...' : '📤 Push to Cloud'}
                </button>
                <button
                  onClick={handlePull}
                  disabled={syncing}
                  className="sync-btn"
                >
                  {syncing ? 'Syncing...' : '📥 Pull from Cloud'}
                </button>
              </div>

              <div className="sync-info">
                <p>💡 <strong>Push:</strong> Upload your local data to cloud</p>
                <p>💡 <strong>Pull:</strong> Download cloud data (will merge with local)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

