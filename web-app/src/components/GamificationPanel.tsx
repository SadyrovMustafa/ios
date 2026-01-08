import { useState, useEffect } from 'react'
import { GamificationService, UserStats, Achievement } from '../services/GamificationService'
import { TaskManager } from '../services/TaskManager'
import './GamificationPanel.css'

interface GamificationPanelProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function GamificationPanel({ taskManager, onClose }: GamificationPanelProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = () => {
    const userStats = GamificationService.getUserStats()
    const tasks = taskManager.getTasks()
    const lists = taskManager.getLists()
    
    // Update achievements
    const unlocked = GamificationService.checkAchievements(tasks, lists)
    const newlyUnlocked = unlocked.filter(a => 
      !userStats.achievements.find(ua => ua.id === a.id && ua.unlockedAt)
    )
    
    if (newlyUnlocked.length > 0) {
      setNewAchievements(newlyUnlocked)
    }

    setStats(userStats)
  }

  const xpPercentage = stats 
    ? (stats.xp / stats.xpToNextLevel) * 100 
    : 0

  return (
    <div className="gamification-overlay" onClick={onClose}>
      <div className="gamification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gamification-header">
          <h2>🎮 Gamification</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {newAchievements.length > 0 && (
          <div className="new-achievements-banner">
            <h3>🎉 New Achievements Unlocked!</h3>
            {newAchievements.map(ach => (
              <div key={ach.id} className="new-achievement">
                {ach.icon} <strong>{ach.name}</strong> - {ach.description}
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="gamification-content">
            <div className="level-section">
              <div className="level-display">
                <div className="level-number">Level {stats.level}</div>
                <div className="xp-bar-container">
                  <div className="xp-bar" style={{ width: `${xpPercentage}%` }}>
                    {stats.xp} / {stats.xpToNextLevel} XP
                  </div>
                </div>
                <div className="xp-text">
                  {stats.xpToNextLevel - stats.xp} XP to next level
                </div>
              </div>
            </div>

            <div className="streaks-section">
              <h3>🔥 Streaks</h3>
              <div className="streaks-grid">
                <div className="streak-card">
                  <div className="streak-icon">📅</div>
                  <div className="streak-value">{stats.streaks.daily.current}</div>
                  <div className="streak-label">Day Streak</div>
                  <div className="streak-best">Best: {stats.streaks.daily.longest}</div>
                </div>
                <div className="streak-card">
                  <div className="streak-icon">📆</div>
                  <div className="streak-value">{stats.streaks.weekly.current}</div>
                  <div className="streak-label">Week Streak</div>
                  <div className="streak-best">Best: {stats.streaks.weekly.longest}</div>
                </div>
              </div>
            </div>

            <div className="achievements-section">
              <h3>🏆 Achievements</h3>
              <div className="achievements-grid">
                {stats.achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`achievement-card ${achievement.unlockedAt ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">
                      {achievement.unlockedAt ? achievement.icon : '🔒'}
                    </div>
                    <div className="achievement-info">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-desc">{achievement.description}</div>
                      <div className="achievement-progress">
                        <div className="progress-bar-small">
                          <div
                            className="progress-fill-small"
                            style={{
                              width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                            }}
                          />
                        </div>
                        <span className="progress-text">
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                    </div>
                    {achievement.unlockedAt && (
                      <div className="achievement-date">
                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>📊 Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Completed:</span>
                  <span className="stat-value">{stats.totalTasksCompleted}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unlocked Achievements:</span>
                  <span className="stat-value">
                    {stats.achievements.filter(a => a.unlockedAt).length} / {stats.achievements.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

