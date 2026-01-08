import React, { useState, useEffect } from 'react'
import { OKRService, Objective, KeyResult } from '../services/OKRService'
import { ProjectService } from '../services/ProjectService'
import { LocalAuthService } from '../services/LocalAuthService'
import './OKRPanel.css'

interface OKRPanelProps {
  projectId?: string
  onClose: () => void
}

export const OKRPanel: React.FC<OKRPanelProps> = ({ projectId, onClose }) => {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)
  const currentUser = LocalAuthService.getCurrentUser()

  useEffect(() => {
    loadObjectives()
  }, [projectId])

  const loadObjectives = () => {
    if (projectId) {
      setObjectives(OKRService.getObjectivesForProject(projectId))
    } else if (currentUser) {
      setObjectives(OKRService.getObjectivesForUser(currentUser.id))
    }
  }

  const handleCreateObjective = (name: string, description?: string) => {
    if (!currentUser) return
    OKRService.createObjective(name, currentUser.id, description, projectId)
    loadObjectives()
  }

  const handleAddKeyResult = (objectiveId: string, name: string, target: number, unit: string) => {
    OKRService.addKeyResult(objectiveId, name, target, unit)
    loadObjectives()
  }

  return (
    <div className="okr-panel">
      <div className="panel-header">
        <h2>🎯 OKR</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <button className="btn-primary" onClick={() => {
          const name = prompt('Название цели:')
          if (name) handleCreateObjective(name)
        }}>+ Создать цель</button>
        <div className="objectives-list">
          {objectives.map(objective => (
            <div key={objective.id} className="objective-card">
              <div className="objective-header">
                <h3>{objective.name}</h3>
                <div className="progress-circle">
                  <span>{objective.progress.toFixed(0)}%</span>
                </div>
              </div>
              <div className="key-results">
                {objective.keyResults.map(kr => (
                  <div key={kr.id} className="key-result">
                    <span>{kr.name}</span>
                    <span>{kr.current} / {kr.target} {kr.unit}</span>
                  </div>
                ))}
                <button onClick={() => {
                  const name = prompt('Название ключевого результата:')
                  const target = prompt('Целевое значение:')
                  const unit = prompt('Единица измерения:')
                  if (name && target && unit) {
                    handleAddKeyResult(objective.id, name, parseFloat(target), unit)
                  }
                }}>+ Добавить ключевой результат</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

