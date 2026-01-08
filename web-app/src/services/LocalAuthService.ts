export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  avatar?: string
}

export class LocalAuthService {
  private static currentUserKey = 'ticktick_current_user'
  private static usersKey = 'ticktick_users'

  static getCurrentUser(): User | null {
    const userId = localStorage.getItem(this.currentUserKey)
    if (!userId) return null

    const users = this.getAllUsers()
    return users.find(u => u.id === userId) || null
  }

  static async signUp(email: string, password: string, name: string): Promise<User> {
    const users = this.getAllUsers()

    // Check if user already exists
    if (users.some(u => u.email === email)) {
      throw new Error('Пользователь с таким email уже существует')
    }

    // Hash password (simple implementation)
    const passwordHash = await this.hashPassword(password)

    // Create user
    const newUser: User = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      createdAt: new Date()
    }

    // Save user
    users.push(newUser)
    this.saveUsers(users)

    // Save password hash (in production, use secure storage)
    localStorage.setItem(`ticktick_user_password_${newUser.id}`, passwordHash)

    // Set as current user
    this.setCurrentUser(newUser.id)

    // Send welcome email (if email service is configured)
    try {
      const { emailService } = await import('./EmailService')
      if (emailService.isEmailConfigured()) {
        const welcomeEmail = emailService.generateWelcomeEmail(newUser.name, newUser.email)
        emailService.sendEmail(welcomeEmail).catch(error => {
          console.warn('Failed to send welcome email:', error)
          // Don't fail registration if email fails
        })
      }
    } catch (error) {
      console.warn('Email service not available:', error)
      // Don't fail registration if email service is not available
    }

    return newUser
  }

  static async signIn(email: string, password: string): Promise<User> {
    const users = this.getAllUsers()
    const user = users.find(u => u.email === email)

    if (!user) {
      throw new Error('Пользователь не найден')
    }

    // Verify password
    const passwordHash = localStorage.getItem(`ticktick_user_password_${user.id}`)
    const inputHash = await this.hashPassword(password)

    if (passwordHash !== inputHash) {
      throw new Error('Неверный пароль')
    }

    // Set as current user
    this.setCurrentUser(user.id)

    return user
  }

  static signOut(): void {
    localStorage.removeItem(this.currentUserKey)
  }

  static async updateProfile(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      throw new Error('Пользователь не найден')
    }

    users[userIndex] = { ...users[userIndex], ...updates }
    this.saveUsers(users)

    return users[userIndex]
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const passwordHash = localStorage.getItem(`ticktick_user_password_${userId}`)
    if (!passwordHash) {
      throw new Error('Пользователь не найден')
    }

    const oldHash = await this.hashPassword(oldPassword)
    if (passwordHash !== oldHash) {
      throw new Error('Неверный текущий пароль')
    }

    const newHash = await this.hashPassword(newPassword)
    localStorage.setItem(`ticktick_user_password_${userId}`, newHash)
  }

  static getAllUsers(): User[] {
    const data = localStorage.getItem(this.usersKey)
    if (!data) return []
    return JSON.parse(data).map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt)
    }))
  }

  static getUserById(userId: string): User | undefined {
    return this.getAllUsers().find(u => u.id === userId)
  }

  private static setCurrentUser(userId: string): void {
    localStorage.setItem(this.currentUserKey, userId)
  }

  private static saveUsers(users: User[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users))
  }

  private static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

