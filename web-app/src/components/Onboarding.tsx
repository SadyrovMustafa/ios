import { useState, useEffect } from 'react'
import './Onboarding.css'

interface OnboardingProps {
  onComplete: () => void
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
  image?: string
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в TickTick!',
    description: 'Мощный менеджер задач с множеством функций для повышения продуктивности.',
    icon: '👋'
  },
  {
    id: 'tasks',
    title: 'Создавайте и управляйте задачами',
    description: 'Добавляйте задачи, устанавливайте сроки, приоритеты и теги. Организуйте задачи в списки и проекты.',
    icon: '✅'
  },
  {
    id: 'team',
    title: 'Работайте в команде',
    description: 'Назначайте задачи, общайтесь в чате, отслеживайте прогресс команды и управляйте проектами вместе.',
    icon: '👥'
  },
  {
    id: 'productivity',
    title: 'Повышайте продуктивность',
    description: 'Используйте Pomodoro таймер, аналитику, умные напоминания и автоматизацию для эффективной работы.',
    icon: '🚀'
  },
  {
    id: 'ready',
    title: 'Готовы начать?',
    description: 'Начните создавать задачи и организовывать свою работу. Все ваши данные сохраняются локально.',
    icon: '🎉'
  }
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('ticktick_onboarding_completed')
    if (hasCompletedOnboarding) {
      onComplete()
      return
    }

    // Show onboarding after a short delay
    setTimeout(() => setIsVisible(true), 300)
  }, [onComplete])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('ticktick_onboarding_completed', 'true')
    setIsVisible(false)
    setTimeout(() => onComplete(), 300)
  }

  if (!isVisible) return null

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="onboarding-content">
          <div className="step-icon">{step.icon}</div>
          <h2 className="step-title">{step.title}</h2>
          <p className="step-description">{step.description}</p>

          {step.id === 'welcome' && (
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Управление задачами</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Командная работа</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Аналитика и отчеты</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>AI и автоматизация</span>
              </div>
            </div>
          )}

          {step.id === 'tasks' && (
            <div className="tasks-demo">
              <div className="demo-task completed">
                <span className="task-checkbox">✓</span>
                <span className="task-text">Пример выполненной задачи</span>
              </div>
              <div className="demo-task">
                <span className="task-checkbox">○</span>
                <span className="task-text">Пример активной задачи</span>
                <span className="task-priority high">Высокий</span>
              </div>
              <div className="demo-task">
                <span className="task-checkbox">○</span>
                <span className="task-text">Задача с тегом</span>
                <span className="task-tag">#важно</span>
              </div>
            </div>
          )}

          {step.id === 'team' && (
            <div className="team-demo">
              <div className="team-member">
                <div className="member-avatar">👤</div>
                <div className="member-info">
                  <div className="member-name">Вы</div>
                  <div className="member-role">Владелец</div>
                </div>
              </div>
              <div className="team-member">
                <div className="member-avatar">👤</div>
                <div className="member-info">
                  <div className="member-name">Участник</div>
                  <div className="member-role">Редактор</div>
                </div>
              </div>
              <div className="team-stats">
                <div className="stat">
                  <div className="stat-value">12</div>
                  <div className="stat-label">Задач в проекте</div>
                </div>
                <div className="stat">
                  <div className="stat-value">8</div>
                  <div className="stat-label">Выполнено</div>
                </div>
              </div>
            </div>
          )}

          {step.id === 'productivity' && (
            <div className="productivity-demo">
              <div className="productivity-item">
                <span className="productivity-icon">🍅</span>
                <div>
                  <div className="productivity-title">Pomodoro таймер</div>
                  <div className="productivity-desc">25 минут фокуса</div>
                </div>
              </div>
              <div className="productivity-item">
                <span className="productivity-icon">📊</span>
                <div>
                  <div className="productivity-title">Аналитика</div>
                  <div className="productivity-desc">Отслеживание прогресса</div>
                </div>
              </div>
              <div className="productivity-item">
                <span className="productivity-icon">🤖</span>
                <div>
                  <div className="productivity-title">Автоматизация</div>
                  <div className="productivity-desc">Умные правила</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          <div className="step-indicators">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>

          <div className="action-buttons">
            {currentStep > 0 && (
              <button className="btn-secondary" onClick={handlePrevious}>
                Назад
              </button>
            )}
            <button className="btn-skip" onClick={handleSkip}>
              Пропустить
            </button>
            <button className="btn-primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Начать' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

