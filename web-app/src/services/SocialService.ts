/**
 * Social Service - социальные функции для продуктивности
 */

export interface UserProfile {
  userId: string
  userName: string
  userEmail: string
  avatar?: string
  level: number
  experience: number
  totalTasksCompleted: number
  currentStreak: number
  longestStreak: number
  achievements: string[]
  isPublic: boolean
  joinedAt: Date
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar?: string
  score: number
  rank: number
  tasksCompleted: number
  streak: number
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time'

export interface Challenge {
  id: string
  name: string
  description: string
  type: 'tasks' | 'streak' | 'time' | 'custom'
  goal: number
  duration: number // days
  startDate: Date
  endDate: Date
  participants: string[]
  createdBy: string
  createdAt: Date
  isActive: boolean
}

export interface ChallengeProgress {
  challengeId: string
  userId: string
  currentProgress: number
  completed: boolean
  completedAt?: Date
}

export class SocialService {
  private static profilesKey = 'ticktick_social_profiles'
  private static leaderboardKey = 'ticktick_leaderboard'
  private static challengesKey = 'ticktick_challenges'
  private static challengeProgressKey = 'ticktick_challenge_progress'

  // User Profiles
  static getUserProfile(userId: string): UserProfile | null {
    const profiles = this.getAllProfiles()
    return profiles.find(p => p.userId === userId) || null
  }

  static createOrUpdateProfile(userId: string, userName: string, userEmail: string, avatar?: string): UserProfile {
    const profiles = this.getAllProfiles()
    const existingIndex = profiles.findIndex(p => p.userId === userId)

    const profile: UserProfile = {
      userId,
      userName,
      userEmail,
      avatar,
      level: existingIndex >= 0 ? profiles[existingIndex].level : 1,
      experience: existingIndex >= 0 ? profiles[existingIndex].experience : 0,
      totalTasksCompleted: existingIndex >= 0 ? profiles[existingIndex].totalTasksCompleted : 0,
      currentStreak: existingIndex >= 0 ? profiles[existingIndex].currentStreak : 0,
      longestStreak: existingIndex >= 0 ? profiles[existingIndex].longestStreak : 0,
      achievements: existingIndex >= 0 ? profiles[existingIndex].achievements : [],
      isPublic: existingIndex >= 0 ? profiles[existingIndex].isPublic : false,
      joinedAt: existingIndex >= 0 ? profiles[existingIndex].joinedAt : new Date()
    }

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile
    } else {
      profiles.push(profile)
    }

    this.saveProfiles(profiles)
    return profile
  }

  static updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const profiles = this.getAllProfiles()
    const index = profiles.findIndex(p => p.userId === userId)
    if (index === -1) {
      throw new Error('Profile not found')
    }

    profiles[index] = { ...profiles[index], ...updates }
    this.saveProfiles(profiles)
    return profiles[index]
  }

  static addExperience(userId: string, amount: number): { level: number; experience: number } {
    const profile = this.getUserProfile(userId)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const newExperience = profile.experience + amount
    const newLevel = Math.floor(newExperience / 100) + 1

    this.updateProfile(userId, {
      experience: newExperience,
      level: newLevel
    })

    return { level: newLevel, experience: newExperience }
  }

  static incrementTasksCompleted(userId: string): void {
    const profile = this.getUserProfile(userId)
    if (!profile) return

    this.updateProfile(userId, {
      totalTasksCompleted: profile.totalTasksCompleted + 1
    })

    // Add experience for completing task
    this.addExperience(userId, 10)
  }

  static updateStreak(userId: string, newStreak: number): void {
    const profile = this.getUserProfile(userId)
    if (!profile) return

    this.updateProfile(userId, {
      currentStreak: newStreak,
      longestStreak: Math.max(profile.longestStreak, newStreak)
    })
  }

  static addAchievement(userId: string, achievementId: string): void {
    const profile = this.getUserProfile(userId)
    if (!profile) return

    if (!profile.achievements.includes(achievementId)) {
      this.updateProfile(userId, {
        achievements: [...profile.achievements, achievementId]
      })
      this.addExperience(userId, 50) // Bonus experience for achievement
    }
  }

  static getPublicProfiles(): UserProfile[] {
    return this.getAllProfiles().filter(p => p.isPublic)
  }

  // Leaderboard
  static getLeaderboard(period: LeaderboardPeriod = 'all-time'): LeaderboardEntry[] {
    const profiles = this.getAllProfiles()
    const now = new Date()
    const startDate = this.getPeriodStartDate(period, now)

    const entries: LeaderboardEntry[] = profiles
      .filter(p => {
        if (period === 'all-time') return true
        return p.joinedAt >= startDate
      })
      .map((profile, index) => ({
        userId: profile.userId,
        userName: profile.userName,
        avatar: profile.avatar,
        score: this.calculateScore(profile, period),
        rank: 0, // Will be set after sorting
        tasksCompleted: profile.totalTasksCompleted,
        streak: profile.currentStreak
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

    return entries
  }

  private static calculateScore(profile: UserProfile, period: LeaderboardPeriod): number {
    // Score = tasks completed * 10 + streak * 5 + level * 20 + achievements * 15
    return (
      profile.totalTasksCompleted * 10 +
      profile.currentStreak * 5 +
      profile.level * 20 +
      profile.achievements.length * 15
    )
  }

  private static getPeriodStartDate(period: LeaderboardPeriod, now: Date): Date {
    const start = new Date(now)
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        start.setDate(start.getDate() - start.getDay())
        start.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case 'all-time':
        return new Date(0)
    }
    return start
  }

  // Challenges
  static getAllChallenges(): Challenge[] {
    const data = localStorage.getItem(this.challengesKey)
    if (!data) return []
    return JSON.parse(data).map((c: any) => ({
      ...c,
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
      createdAt: new Date(c.createdAt)
    }))
  }

  static getActiveChallenges(): Challenge[] {
    const now = new Date()
    return this.getAllChallenges().filter(
      c => c.isActive && c.startDate <= now && c.endDate >= now
    )
  }

  static createChallenge(
    name: string,
    description: string,
    type: Challenge['type'],
    goal: number,
    duration: number,
    createdBy: string
  ): Challenge {
    const challenges = this.getAllChallenges()
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + duration)

    const challenge: Challenge = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      type,
      goal,
      duration,
      startDate: now,
      endDate,
      participants: [createdBy],
      createdBy,
      createdAt: now,
      isActive: true
    }

    challenges.push(challenge)
    this.saveChallenges(challenges)
    return challenge
  }

  static joinChallenge(challengeId: string, userId: string): void {
    const challenges = this.getAllChallenges()
    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) {
      throw new Error('Challenge not found')
    }

    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId)
      this.saveChallenges(challenges)

      // Initialize progress
      this.updateChallengeProgress(challengeId, userId, 0)
    }
  }

  static getChallengeProgress(challengeId: string, userId: string): ChallengeProgress | null {
    const allProgress = this.getAllChallengeProgress()
    return allProgress.find(p => p.challengeId === challengeId && p.userId === userId) || null
  }

  static updateChallengeProgress(challengeId: string, userId: string, progress: number): ChallengeProgress {
    const allProgress = this.getAllChallengeProgress()
    const existingIndex = allProgress.findIndex(
      p => p.challengeId === challengeId && p.userId === userId
    )

    const challengeProgress: ChallengeProgress = {
      challengeId,
      userId,
      currentProgress: progress,
      completed: false,
      completedAt: undefined
    }

    // Check if challenge is completed
    const challenge = this.getAllChallenges().find(c => c.id === challengeId)
    if (challenge && progress >= challenge.goal) {
      challengeProgress.completed = true
      challengeProgress.completedAt = new Date()
    }

    if (existingIndex >= 0) {
      allProgress[existingIndex] = challengeProgress
    } else {
      allProgress.push(challengeProgress)
    }

    this.saveChallengeProgress(allProgress)
    return challengeProgress
  }

  static getChallengeLeaderboard(challengeId: string): LeaderboardEntry[] {
    const challenge = this.getAllChallenges().find(c => c.id === challengeId)
    if (!challenge) return []

    const allProgress = this.getAllChallengeProgress()
    const challengeProgress = allProgress.filter(p => p.challengeId === challengeId)

    const entries: LeaderboardEntry[] = challenge.participants
      .map(userId => {
        const progress = challengeProgress.find(p => p.userId === userId)
        const profile = this.getUserProfile(userId)
        if (!profile) return null

        return {
          userId,
          userName: profile.userName,
          avatar: profile.avatar,
          score: progress?.currentProgress || 0,
          rank: 0,
          tasksCompleted: 0,
          streak: 0
        }
      })
      .filter((e): e is LeaderboardEntry => e !== null)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

    return entries
  }

  // Private helpers
  private static getAllProfiles(): UserProfile[] {
    const data = localStorage.getItem(this.profilesKey)
    if (!data) return []
    return JSON.parse(data).map((p: any) => ({
      ...p,
      joinedAt: new Date(p.joinedAt)
    }))
  }

  private static saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem(this.profilesKey, JSON.stringify(profiles))
  }

  private static getAllChallengeProgress(): ChallengeProgress[] {
    const data = localStorage.getItem(this.challengeProgressKey)
    if (!data) return []
    return JSON.parse(data).map((p: any) => ({
      ...p,
      completedAt: p.completedAt ? new Date(p.completedAt) : undefined
    }))
  }

  private static saveChallengeProgress(progress: ChallengeProgress[]): void {
    localStorage.setItem(this.challengeProgressKey, JSON.stringify(progress))
  }

  private static saveChallenges(challenges: Challenge[]): void {
    localStorage.setItem(this.challengesKey, JSON.stringify(challenges))
  }
}

