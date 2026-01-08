import React, { useState, useEffect } from 'react'
import { ProofingService, ProofFile, ProofComment } from '../services/ProofingService'
import './ProofingPanel.css'

interface ProofingPanelProps {
  taskId: string
  onClose: () => void
}

export const ProofingPanel: React.FC<ProofingPanelProps> = ({ taskId, onClose }) => {
  const [proofs, setProofs] = useState<ProofFile[]>([])
  const [selectedProof, setSelectedProof] = useState<ProofFile | null>(null)

  useEffect(() => {
    loadProofs()
  }, [taskId])

  const loadProofs = () => {
    setProofs(ProofingService.getProofsForTask(taskId))
  }

  const handleUploadFile = (file: File) => {
    // In real implementation, upload to storage and get URL
    const fileUrl = URL.createObjectURL(file)
    ProofingService.createProof(taskId, file.name, file.type, fileUrl, 'current-user')
    loadProofs()
  }

  const handleAddComment = (proofId: string, version: number, text: string, x: number, y: number) => {
    ProofingService.addComment(proofId, version, 'current-user', text, x, y)
    loadProofs()
  }

  return (
    <div className="proofing-panel">
      <div className="panel-header">
        <h2>🖼️ Ревью файлов</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-content">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUploadFile(file)
          }}
        />
        <div className="proofs-list">
          {proofs.map(proof => (
            <div key={proof.id} className="proof-card">
              <h3>{proof.fileName}</h3>
              <div className="proof-versions">
                {proof.versions.map(version => (
                  <div key={version.id} className="version-item">
                    <span>Версия {version.version}</span>
                    {version.approved && <span className="approved-badge">✓ Утверждено</span>}
                    <div className="comments-count">
                      Комментариев: {version.comments.length}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelectedProof(proof)}>Открыть</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

