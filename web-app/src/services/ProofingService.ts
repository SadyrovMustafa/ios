export interface ProofComment {
  id: string
  userId: string
  text: string
  x: number // Position on image (0-100%)
  y: number
  createdAt: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface ProofVersion {
  id: string
  fileId: string
  version: number
  uploadedAt: Date
  uploadedBy: string
  comments: ProofComment[]
  approved: boolean
  approvedBy?: string
  approvedAt?: Date
}

export interface ProofFile {
  id: string
  taskId: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: Date
  uploadedBy: string
  currentVersion: number
  versions: ProofVersion[]
}

export class ProofingService {
  private static proofsKey = 'ticktick_proofs'

  static createProof(
    taskId: string,
    fileName: string,
    fileType: string,
    fileUrl: string,
    uploadedBy: string
  ): ProofFile {
    const proofs = this.getAllProofs()
    const newProof: ProofFile = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      fileName,
      fileType,
      fileUrl,
      uploadedAt: new Date(),
      uploadedBy,
      currentVersion: 1,
      versions: [{
        id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileId: `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        version: 1,
        uploadedAt: new Date(),
        uploadedBy,
        comments: [],
        approved: false
      }]
    }

    proofs.push(newProof)
    this.saveProofs(proofs)

    return newProof
  }

  static addVersion(
    proofId: string,
    fileUrl: string,
    uploadedBy: string
  ): ProofVersion {
    const proofs = this.getAllProofs()
    const proof = proofs.find(p => p.id === proofId)
    if (!proof) throw new Error('Proof not found')

    const newVersion: ProofVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileId: proofId,
      version: proof.currentVersion + 1,
      uploadedAt: new Date(),
      uploadedBy,
      comments: [],
      approved: false
    }

    proof.versions.push(newVersion)
    proof.currentVersion = newVersion.version
    this.saveProofs(proofs)

    return newVersion
  }

  static addComment(
    proofId: string,
    version: number,
    userId: string,
    text: string,
    x: number,
    y: number
  ): ProofComment {
    const proofs = this.getAllProofs()
    const proof = proofs.find(p => p.id === proofId)
    if (!proof) throw new Error('Proof not found')

    const proofVersion = proof.versions.find(v => v.version === version)
    if (!proofVersion) throw new Error('Version not found')

    const newComment: ProofComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      text,
      x,
      y,
      createdAt: new Date(),
      resolved: false
    }

    proofVersion.comments.push(newComment)
    this.saveProofs(proofs)

    return newComment
  }

  static resolveComment(
    proofId: string,
    version: number,
    commentId: string,
    resolvedBy: string
  ): void {
    const proofs = this.getAllProofs()
    const proof = proofs.find(p => p.id === proofId)
    if (!proof) return

    const proofVersion = proof.versions.find(v => v.version === version)
    if (!proofVersion) return

    const comment = proofVersion.comments.find(c => c.id === commentId)
    if (comment) {
      comment.resolved = true
      comment.resolvedAt = new Date()
      comment.resolvedBy = resolvedBy
      this.saveProofs(proofs)
    }
  }

  static approveVersion(
    proofId: string,
    version: number,
    approvedBy: string
  ): void {
    const proofs = this.getAllProofs()
    const proof = proofs.find(p => p.id === proofId)
    if (!proof) return

    const proofVersion = proof.versions.find(v => v.version === version)
    if (proofVersion) {
      proofVersion.approved = true
      proofVersion.approvedBy = approvedBy
      proofVersion.approvedAt = new Date()
      this.saveProofs(proofs)
    }
  }

  static getProof(proofId: string): ProofFile | undefined {
    return this.getAllProofs().find(p => p.id === proofId)
  }

  static getProofsForTask(taskId: string): ProofFile[] {
    return this.getAllProofs()
      .filter(p => p.taskId === taskId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
  }

  static getAllProofs(): ProofFile[] {
    const data = localStorage.getItem(this.proofsKey)
    if (!data) return []
    return JSON.parse(data).map((p: any) => ({
      ...p,
      uploadedAt: new Date(p.uploadedAt),
      versions: p.versions.map((v: any) => ({
        ...v,
        uploadedAt: new Date(v.uploadedAt),
        approvedAt: v.approvedAt ? new Date(v.approvedAt) : undefined,
        comments: v.comments.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined
        }))
      }))
    }))
  }

  static getCurrentVersion(proofId: string): ProofVersion | undefined {
    const proof = this.getProof(proofId)
    if (!proof) return undefined
    return proof.versions.find(v => v.version === proof.currentVersion)
  }

  static deleteProof(proofId: string): void {
    const proofs = this.getAllProofs().filter(p => p.id !== proofId)
    this.saveProofs(proofs)
  }

  private static saveProofs(proofs: ProofFile[]): void {
    localStorage.setItem(this.proofsKey, JSON.stringify(proofs))
  }
}

