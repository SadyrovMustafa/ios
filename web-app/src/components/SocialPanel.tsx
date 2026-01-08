import { useState, useEffect } from 'react'
import { SocialService, LeaderboardEntry, Challenge, LeaderboardPeriod } from '../services/SocialService'
import { LocalAuthService } from '../services/LocalAuthService'
import { toastService } from '../services/ToastService'
import './SocialPanel.css'

export default function SocialPanel() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'challenges' | 'profile'>('leaderboard')
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('all-time')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [leaderboardPeriod])

  const loadData = () => {
    const currentUser = LocalAuthService.getCurrentUser()
    if (currentUser) {
      // Create or get profile
      const profile = SocialService.createOrUpdateProfile(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        currentUser.avatar
      )
      setUserProfile(profile)

      // Load leaderboard
      const lb = SocialService.getLeaderboard(leaderboardPeriod)
      setLeaderboard(lb)

      // Load challenges
      const activeChallenges = SocialService.getActiveChallenges()
      setChallenges(activeChallenges)
    }
  }

  const handleCreateChallenge = () => {
    const currentUser = LocalAuthService.getCurrentUser()
    if (!currentUser) return

    const name = prompt('Название челенджа:')
    if (!name) return

    const description = prompt('Описание:')
    if (!description) return

    const goal = parseInt(prompt('Цель (количество задач):') || '10')
    const duration = parseInt(prompt('Длительность (дней):') || '7')

    try {
      const challenge = SocialService.createChallenge(
        name,
        description,
        'tasks',
        goal,
        duration,
        currentUser.id
      )
      toastService.success('Челендж создан!')
      loadData()
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка создания челенджа')
    }
  }

  const handleJoinChallenge = (challengeId: string) => {
    const currentUser = LocalAuthService.getCurrentUser()
    if (!currentUser) return

    try {
      SocialService.joinChallenge(challengeId, currentUser.id)
      toastService.success('Вы присоединились к челенджу!')
      loadData()
    } catch (error: any) {
      toastService.error(error.message || 'Ошибка присоединения')
    }
  }

  const currentUser = LocalAuthService.getCurrentUser()
  if (!currentUser) {
    return (
      <div className="social-panel">
        <div className="empty-state">
          <p>Войдите в аккаунт для доступа к социальным функциям</p>
        </div>
      </div>
    )
  }

  const userRank = leaderboard.findIndex(e => e.userId === currentUser.id) + 1

  return (
    <div className="social-panel">
      <div className="social-header">
        <h2>Социальная продуктивность</h2>
      </div>

      <div className="social-tabs">
        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Рейтинг
        </button>
        <button
          className={`tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          🎯 Челенджи
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Профиль
        </button>
      </div>

      <div className="social-content">
        {activeTab === 'leaderboard' && (
          <div className="leaderboard-tab">
            <div className="period-selector">
              <button
                className={`period-btn ${leaderboardPeriod === 'daily' ? 'active' : ''}`}
                onClick={() => setLeaderboardPeriod('daily')}
              >
                День
              </button>
              <button
                className={`period-btn ${leaderboardPeriod === 'weekly' ? 'active' : ''}`}
                onClick={() => setLeaderboardPeriod('weekly')}
              >
                Неделя
              </button>
              <button
                className={`period-btn ${leaderboardPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setLeaderboardPeriod('monthly')}
              >
                Месяц
              </button>
              <button
                className={`period-btn ${leaderboardPeriod === 'all-time' ? 'active' : ''}`}
                onClick={() => setLeaderboardPeriod('all-time')}
              >
                Все время
              </button>
            </div>

            <div className="user-rank-card">
              <div className="rank-badge">#{userRank || '?'}</div>
              <div className="rank-info">
                <h3>{currentUser.name}</h3>
                <p>Ваше место в рейтинге</p>
              </div>
            </div>

            <div className="leaderboard-list">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`leaderboard-entry ${entry.userId === currentUser.id ? 'current-user' : ''}`}
                >
                  <div className="entry-rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${entry.rank}`}
                  </div>
                  <div className="entry-avatar">
                    {entry.avatar || entry.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="entry-info">
                    <div className="entry-name">{entry.userName}</div>
                    <div className="entry-stats">
                      {entry.tasksCompleted} задач • Стрик: {entry.streak} дней
                    </div>
                  </div>
                  <div className="entry-score">{entry.score} очков</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="challenges-tab">
            <div className="challenges-header">
              <h3>Активные челенджи</h3>
              <button className="btn-create-challenge" onClick={handleCreateChallenge}>
                + Создать челендж
              </button>
            </div>

            {challenges.length === 0 ? (
              <div className="empty-state">
                <p>Нет активных челенджей</p>
                <button className="btn-primary" onClick={handleCreateChallenge}>
                  Создать первый челендж
                </button>
              </div>
            ) : (
              <div className="challenges-list">
                {challenges.map(challenge => {
                  const progress = SocialService.getChallengeProgress(challenge.id, currentUser.id)
                  const isParticipant = challenge.participants.includes(currentUser.id)
                  const progressPercent = progress
                    ? Math.min(100, (progress.currentProgress / challenge.goal) * 100)
                    : 0

                  return (
                    <div key={challenge.id} className="challenge-card">
                      <div className="challenge-header">
                        <h4>{challenge.name}</h4>
                        <span className="challenge-type">{challenge.type}</span>
                      </div>
                      <p className="challenge-description">{challenge.description}</p>
                      <div className="challenge-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          {progress?.currentProgress || 0} / {challenge.goal}
                        </div>
                      </div>
                      <div className="challenge-meta">
                        <span>Участников: {challenge.participants.length}</span>
                        <span>
                          До {new Date(challenge.endDate).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      {!isParticipant && (
                        <button
                          className="btn-join"
                          onClick={() => handleJoinChallenge(challenge.id)}
                        >
                          Присоединиться
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && userProfile && (
          <div className="profile-tab">
            <div className="profile-card">
              <div className="profile-avatar-large">
                {userProfile.avatar || userProfile.userName.charAt(0).toUpperCase()}
              </div>
              <h3>{userProfile.userName}</h3>
              <p className="profile-email">{userProfile.userEmail}</p>

              <div className="profile-stats">
                <div className="stat-box">
                  <div className="stat-value">{userProfile.level}</div>
                  <div className="stat-label">Уровень</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{userProfile.totalTasksCompleted}</div>
                  <div className="stat-label">Задач выполнено</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{userProfile.currentStreak}</div>
                  <div className="stat-label">Текущий стрик</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{userProfile.experience}</div>
                  <div className="stat-label">Опыт</div>
                </div>
              </div>

              <div className="profile-achievements">
                <h4>Достижения ({userProfile.achievements.length})</h4>
                {userProfile.achievements.length === 0 ? (
                  <p className="empty-state">Пока нет достижений</p>
                ) : (
                  <div className="achievements-list">
                    {userProfile.achievements.map((ach: string) => (
                      <div key={ach} className="achievement-badge">
                        {ach}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="profile-settings">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={userProfile.isPublic}
                    onChange={(e) => {
                      SocialService.updateProfile(userProfile.userId, { isPublic: e.target.checked })
                      loadData()
                    }}
                  />
                  Публичный профиль
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

