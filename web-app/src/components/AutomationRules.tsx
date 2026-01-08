import { useState, useEffect } from 'react'
import { AutomationService, AutomationRule, AutomationCondition, AutomationAction } from '../services/AutomationService'
import { TaskManager } from '../services/TaskManager'
import { Priority } from '../types/Task'
import './AutomationRules.css'

interface AutomationRulesProps {
  taskManager: TaskManager
  onClose: () => void
}

export default function AutomationRules({ taskManager, onClose }: AutomationRulesProps) {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [showAddRule, setShowAddRule] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = () => {
    setRules(AutomationService.getRules())
  }

  const handleDelete = (ruleId: string) => {
    if (confirm('Delete this rule?')) {
      AutomationService.deleteRule(ruleId)
      loadRules()
    }
  }

  const handleToggle = (rule: AutomationRule) => {
    const updated = { ...rule, enabled: !rule.enabled }
    AutomationService.updateRule(updated)
    loadRules()
  }

  return (
    <div className="automation-rules-overlay" onClick={onClose}>
      <div className="automation-rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="automation-rules-header">
          <h2>Automation Rules</h2>
          <div>
            <button className="btn-primary" onClick={() => setShowAddRule(true)}>
              + Add Rule
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="automation-rules-content">
          {rules.length === 0 ? (
            <div className="empty-rules">
              <p>No automation rules yet</p>
              <button className="btn-primary" onClick={() => setShowAddRule(true)}>
                Create your first rule
              </button>
            </div>
          ) : (
            <div className="rules-list">
              {rules.map(rule => (
                <div key={rule.id} className="rule-card">
                  <div className="rule-header">
                    <div className="rule-info">
                      <h3>{rule.name}</h3>
                      <span className={`rule-status ${rule.enabled ? 'enabled' : 'disabled'}`}>
                        {rule.enabled ? '✓ Enabled' : '○ Disabled'}
                      </span>
                    </div>
                    <div className="rule-actions">
                      <button
                        className="toggle-btn"
                        onClick={() => handleToggle(rule)}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => setEditingRule(rule)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(rule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="rule-details">
                    <div className="rule-section">
                      <strong>If:</strong>
                      {rule.conditions.map((cond, i) => (
                        <span key={i} className="condition-badge">
                          {cond.type} {cond.operator} {String(cond.value)}
                        </span>
                      ))}
                    </div>
                    <div className="rule-section">
                      <strong>Then:</strong>
                      {rule.actions.map((action, i) => (
                        <span key={i} className="action-badge">
                          {action.type} {String(action.value)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(showAddRule || editingRule) && (
          <AddEditRuleModal
            rule={editingRule}
            taskManager={taskManager}
            onClose={() => {
              setShowAddRule(false)
              setEditingRule(null)
            }}
            onSave={() => {
              loadRules()
              setShowAddRule(false)
              setEditingRule(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

interface AddEditRuleModalProps {
  rule?: AutomationRule | null
  taskManager: TaskManager
  onClose: () => void
  onSave: () => void
}

function AddEditRuleModal({ rule, taskManager, onSave, onClose }: AddEditRuleModalProps) {
  const [name, setName] = useState(rule?.name || '')
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [conditions, setConditions] = useState<AutomationCondition[]>(rule?.conditions || [])
  const [actions, setActions] = useState<AutomationAction[]>(rule?.actions || [])

  const handleSave = () => {
    if (!name.trim() || conditions.length === 0 || actions.length === 0) {
      alert('Please fill all fields')
      return
    }

    if (rule) {
      AutomationService.updateRule({
        ...rule,
        name,
        enabled,
        conditions,
        actions
      })
    } else {
      AutomationService.addRule({
        name,
        enabled,
        conditions,
        actions
      })
    }
    onSave()
  }

  const addCondition = () => {
    setConditions([...conditions, {
      type: 'tag',
      operator: 'equals',
      value: ''
    }])
  }

  const updateCondition = (index: number, field: keyof AutomationCondition, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const addAction = () => {
    setActions([...actions, {
      type: 'addTag',
      value: ''
    }])
  }

  const updateAction = (index: number, field: keyof AutomationAction, value: any) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], [field]: value }
    setActions(updated)
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const lists = taskManager.getLists()

  return (
    <div className="add-edit-rule-modal">
      <div className="modal-header">
        <h3>{rule ? 'Edit Rule' : 'New Rule'}</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="modal-content">
        <div className="form-group">
          <label>Rule Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Auto-tag high priority tasks"
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enabled
          </label>
        </div>

        <div className="form-group">
          <label>Conditions (If)</label>
          {conditions.map((cond, i) => (
            <div key={i} className="condition-row">
              <select
                value={cond.type}
                onChange={(e) => updateCondition(i, 'type', e.target.value)}
              >
                <option value="tag">Has tag</option>
                <option value="priority">Priority is</option>
                <option value="list">List is</option>
                <option value="titleContains">Title contains</option>
                <option value="hasSubtasks">Has subtasks</option>
              </select>
              <select
                value={cond.operator}
                onChange={(e) => updateCondition(i, 'operator', e.target.value)}
              >
                <option value="equals">equals</option>
                <option value="contains">contains</option>
                <option value="exists">exists</option>
              </select>
              {cond.type === 'priority' ? (
                <select
                  value={cond.value}
                  onChange={(e) => updateCondition(i, 'value', e.target.value)}
                >
                  <option value={Priority.High}>High</option>
                  <option value={Priority.Medium}>Medium</option>
                  <option value={Priority.Low}>Low</option>
                  <option value={Priority.None}>None</option>
                </select>
              ) : cond.type === 'list' ? (
                <select
                  value={cond.value}
                  onChange={(e) => updateCondition(i, 'value', e.target.value)}
                >
                  {lists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => updateCondition(i, 'value', e.target.value)}
                  placeholder="Value"
                />
              )}
              <button onClick={() => removeCondition(i)}>×</button>
            </div>
          ))}
          <button className="add-btn" onClick={addCondition}>+ Add Condition</button>
        </div>

        <div className="form-group">
          <label>Actions (Then)</label>
          {actions.map((action, i) => (
            <div key={i} className="action-row">
              <select
                value={action.type}
                onChange={(e) => updateAction(i, 'type', e.target.value)}
              >
                <option value="addTag">Add tag</option>
                <option value="setPriority">Set priority</option>
                <option value="moveToList">Move to list</option>
                <option value="setReminder">Set reminder</option>
              </select>
              {action.type === 'setPriority' ? (
                <select
                  value={action.value}
                  onChange={(e) => updateAction(i, 'value', e.target.value)}
                >
                  <option value={Priority.High}>High</option>
                  <option value={Priority.Medium}>Medium</option>
                  <option value={Priority.Low}>Low</option>
                  <option value={Priority.None}>None</option>
                </select>
              ) : action.type === 'moveToList' ? (
                <select
                  value={action.value}
                  onChange={(e) => updateAction(i, 'value', e.target.value)}
                >
                  {lists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={action.value}
                  onChange={(e) => updateAction(i, 'value', e.target.value)}
                  placeholder="Value"
                />
              )}
              <button onClick={() => removeAction(i)}>×</button>
            </div>
          ))}
          <button className="add-btn" onClick={addAction}>+ Add Action</button>
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>Save</button>
      </div>
    </div>
  )
}

