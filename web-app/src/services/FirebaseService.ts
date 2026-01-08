import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore'
import { Task, TaskList } from '../types/Task'

// Firebase config - пользователь должен заменить на свой
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

// Initialize Firebase (only if config is provided)
let app: any = null
let auth: any = null
let db: any = null
let isInitialized = false

export const initializeFirebase = () => {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    isInitialized = true
    return true
  }
  return false
}

export class FirebaseService {
  static isAvailable(): boolean {
    return isInitialized
  }

  static async signInAnonymously(): Promise<User> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const result = await signInAnonymously(auth)
    return result.user
  }

  static async signInWithEmail(email: string, password: string): Promise<User> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  static async signUp(email: string, password: string): Promise<User> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return result.user
  }

  static async signOut(): Promise<void> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    await signOut(auth)
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!isInitialized) return () => {}
    return onAuthStateChanged(auth, callback)
  }

  static getCurrentUser(): User | null {
    if (!isInitialized) return null
    return auth.currentUser
  }

  static async syncTasks(userId: string, tasks: Task[]): Promise<void> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const tasksRef = doc(db, 'users', userId, 'data', 'tasks')
    await setDoc(tasksRef, {
      tasks: tasks.map(t => ({
        ...t,
        dueDate: t.dueDate ? Timestamp.fromDate(new Date(t.dueDate)) : null,
        createdAt: Timestamp.fromDate(new Date(t.createdAt)),
        completedAt: t.completedAt ? Timestamp.fromDate(new Date(t.completedAt)) : null,
        reminderDate: t.reminderDate ? Timestamp.fromDate(new Date(t.reminderDate)) : null
      })),
      lastSync: serverTimestamp()
    })
  }

  static async syncLists(userId: string, lists: TaskList[]): Promise<void> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const listsRef = doc(db, 'users', userId, 'data', 'lists')
    await setDoc(listsRef, {
      lists,
      lastSync: serverTimestamp()
    })
  }

  static async getTasks(userId: string): Promise<Task[]> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const tasksRef = doc(db, 'users', userId, 'data', 'tasks')
    const docSnap = await getDoc(tasksRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      return (data.tasks || []).map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? t.dueDate.toDate() : undefined,
        createdAt: t.createdAt.toDate(),
        completedAt: t.completedAt ? t.completedAt.toDate() : undefined,
        reminderDate: t.reminderDate ? t.reminderDate.toDate() : undefined
      }))
    }
    return []
  }

  static async getLists(userId: string): Promise<TaskList[]> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const listsRef = doc(db, 'users', userId, 'data', 'lists')
    const docSnap = await getDoc(listsRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      return data.lists || []
    }
    return []
  }

  static subscribeToTasks(userId: string, callback: (tasks: Task[]) => void): () => void {
    if (!isInitialized) return () => {}
    const tasksRef = doc(db, 'users', userId, 'data', 'tasks')
    return onSnapshot(tasksRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const tasks = (data.tasks || []).map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? t.dueDate.toDate() : undefined,
          createdAt: t.createdAt.toDate(),
          completedAt: t.completedAt ? t.completedAt.toDate() : undefined,
          reminderDate: t.reminderDate ? t.reminderDate.toDate() : undefined
        }))
        callback(tasks)
      }
    })
  }

  // Shared lists
  static async createSharedList(list: TaskList, ownerId: string): Promise<string> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const sharedListRef = doc(collection(db, 'sharedLists'))
    await setDoc(sharedListRef, {
      ...list,
      ownerId,
      sharedAt: serverTimestamp(),
      members: [ownerId]
    })
    return sharedListRef.id
  }

  static async getSharedLists(userId: string): Promise<TaskList[]> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const q = query(collection(db, 'sharedLists'), where('members', 'array-contains', userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskList))
  }

  static async addComment(taskId: string, userId: string, text: string): Promise<void> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const commentsRef = collection(db, 'tasks', taskId, 'comments')
    await setDoc(doc(commentsRef), {
      userId,
      text,
      createdAt: serverTimestamp()
    })
  }

  static async getComments(taskId: string): Promise<Array<{ id: string; userId: string; text: string; createdAt: Date }>> {
    if (!isInitialized) throw new Error('Firebase not initialized')
    const commentsRef = collection(db, 'tasks', taskId, 'comments')
    const querySnapshot = await getDocs(commentsRef)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))
  }
}

