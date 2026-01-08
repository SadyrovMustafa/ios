import { useState, useEffect } from 'react'
import { SmartListService, SmartListRule, SmartListCondition } from '../services/SmartListService'
import { TaskManager } from '../services/TaskManager'
import { Task } from '../types/Task'
import './SmartListsPanel.css'

interface SmartListsPanelProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function SmartListsPanel({ taskManager, onClose }: SmartListsPanelProps) {
  const [rules, setRules] = useState<SmartListRule[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [ruleName, setRuleName] = useState('')
  const [conditions, setConditions] = useState<SmartListCondition[]>([])

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = () => {
    setRules(SmartListService.getRules())
  }

  const handleAddCondition = () => {
    setConditions([...conditions, {
      field: 'title',
      operator: 'contains',
      value: ''
    }])
  }

  const handleUpdateCondition = (index: number, condition: SmartListCondition) => {
    const updated = [...conditions]
    updated[index] = condition
    setConditions(updated)
  }

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const handleCreateRule = () => {
    if (!ruleName.trim() || conditions.length === 0) return

    SmartListService.addRule({
      name: ruleName,
      conditions
    })
    setRuleName('')
    setConditions([])
    setShowCreate(false)
    loadRules()
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Удалить это правило?')) {
      SmartListService.deleteRule(ruleId)
      loadRules()
    }
  }

  const getTasksForRule = (rule: SmartListRule): Task[] => {
    return SmartListService.getTasksForRule(rule, taskManager.getTasks())
  }

  return (
    <div className="smart-lists-overlay" onClick={onClose}>
      <div className="smart-lists-modal" onClick={(e) => e.stopPropagation()}>
        <div className="smart-lists-header">
          <h2>🤖 Умные списки</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="smart-lists-content">
          <button
            className="create-rule-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            + Создать умный список
          </button>

          {showCreate && (
            <div className="create-rule-form">
              <input
                type="text"
                placeholder="Название списка"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="form-input"
              />

              <div className="conditions-section">
                <label>Условия:</label>
                {conditions.map((condition, index) => (
                  <div key={index} className="condition-row">
                    <select
                      value={condition.field}
                      onChange={(e) => handleUpdateCondition(index, {
                        ...condition,
                        field: e.target.value as any
                      })}
                      className="condition-field"
                    >
                      <option value="title">Название</option>
                      <option value="notes">Заметки</option>
                      <option value="priority">Приоритет</option>
                      <option value="dueDate">Дата выполнения</option>
                      <option value="tags">Теги</option>
                      <option value="isCompleted">Статус</option>
                      <option value="listId">Список</option>
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(e) => handleUpdateCondition(index, {
                        ...condition,
                        operator: e.target.value as any
                      })}
                      className="condition-operator"
                    >
                      <option value="equals">Равно</option>
                      <option value="contains">Содержит</option>
                      <option value="greaterThan">Больше</option>
                      <option value="lessThan">Меньше</option>
                      <option value="in">В списке</option>
                      <option value="notIn">Не в списке</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Значение"
                      value={condition.value}
                      onChange={(e) => handleUpdateCondition(index, {
                        ...condition,
                        value: e.target.value
                      })}
                      className="condition-value"
                    />

                    <button
                      onClick={() => handleRemoveCondition(index)}
                      className="remove-condition-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button onClick={handleAddCondition} className="add-condition-btn">
                  + Добавить условие
                </button>
              </div>

              <button onClick={handleCreateRule} className="save-btn">
                Создать
              </button>
            </div>
          )}

          <div className="rules-list">
            {rules.map(rule => {
              const tasks = getTasksForRule(rule)
              return (
                <div key={rule.id} className="rule-card">
                  <div className="rule-header">
                    <h3>{rule.name}</h3>
                    <span className="rule-count">{tasks.length} задач</span>
                  </div>
                  <div className="rule-conditions">
                    {rule.conditions.map((cond, idx) => (
                      <span key={idx} className="condition-badge">
                        {cond.field} {cond.operator} {cond.value}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="delete-btn"
                  >
                    Удалить
                  </button>
                </div>
              )
            })}
          </div>

          {rules.length === 0 && (
            <p className="empty-state">Нет умных списков. Создайте первый!</p>
          )}
        </div>
      </div>
    </div>
  )
}

