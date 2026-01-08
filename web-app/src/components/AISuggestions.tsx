import { useState, useEffect } from 'react'
import { AIService, Suggestion } from '../services/AIService'
import { TaskManager } from '../services/TaskManager'
import './AISuggestions.css'

interface AISuggestionsProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function AISuggestions({ taskManager, onClose }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = () => {
    const tasks = taskManager.getTasks()
    const lists = taskManager.getLists()
    const { suggestions: aiSuggestions, insights: aiInsights } = 
      AIService.analyzeTasks(tasks, lists)
    
    setSuggestions(aiSuggestions)
    setInsights(aiInsights)
  }

  return (
    <div className="ai-suggestions-overlay" onClick={onClose}>
      <div className="ai-suggestions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-suggestions-header">
          <h2>🤖 AI Suggestions</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ai-suggestions-content">
          {insights.length > 0 && (
            <div className="insights-section">
              <h3>💡 Insights</h3>
              <div className="insights-list">
                {insights.map((insight, i) => (
                  <div key={i} className="insight-item">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 ? (
            <div className="suggestions-section">
              <h3>🎯 Suggestions</h3>
              <div className="suggestions-list">
                {suggestions.map(suggestion => (
                  <div key={suggestion.id} className="suggestion-card">
                    <div className="suggestion-header">
                      <div className="suggestion-icon">
                        {suggestion.type === 'task' && '📋'}
                        {suggestion.type === 'tag' && '🏷️'}
                        {suggestion.type === 'priority' && '🎯'}
                        {suggestion.type === 'list' && '📂'}
                        {suggestion.type === 'dueDate' && '📅'}
                      </div>
                      <div className="suggestion-info">
                        <div className="suggestion-title">{suggestion.title}</div>
                        <div className="suggestion-desc">{suggestion.description}</div>
                      </div>
                      <div className="suggestion-confidence">
                        {Math.round(suggestion.confidence * 100)}%
                      </div>
                    </div>
                    <button
                      className="suggestion-action-btn"
                      onClick={() => {
                        suggestion.action()
                        loadSuggestions()
                      }}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-suggestions">
              <p>No suggestions at this time. Keep up the great work! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

