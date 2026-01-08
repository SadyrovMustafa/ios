//
//  TaskManager.swift
//  TickTick
//
//  Task data manager
//

import Foundation
import SwiftUI

class TaskManager: ObservableObject {
    @Published var tasks: [Task] = []
    @Published var lists: [TaskList] = []
    
    private let tasksKey = "SavedTasks"
    private let listsKey = "SavedLists"
    
    init() {
        loadData()
        if lists.isEmpty {
            createDefaultLists()
        }
    }
    
    // MARK: - Lists Management
    
    func createDefaultLists() {
        let defaultLists = [
            TaskList(name: "Inbox", color: "blue", icon: "tray"),
            TaskList(name: "Today", color: "orange", icon: "sun.max"),
            TaskList(name: "This Week", color: "purple", icon: "calendar"),
            TaskList(name: "Personal", color: "green", icon: "person"),
            TaskList(name: "Work", color: "red", icon: "briefcase")
        ]
        lists = defaultLists
        saveData()
    }
    
    func addList(_ list: TaskList) {
        lists.append(list)
        saveData()
    }
    
    func deleteList(_ list: TaskList) {
        lists.removeAll { $0.id == list.id }
        tasks.removeAll { $0.listId == list.id }
        saveData()
    }
    
    func getList(by id: UUID) -> TaskList? {
        return lists.first { $0.id == id }
    }
    
    // MARK: - Tasks Management
    
    func addTask(_ task: Task) {
        tasks.append(task)
        saveData()
    }
    
    func updateTask(_ task: Task) {
        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index] = task
            saveData()
        }
    }
    
    func deleteTask(_ task: Task) {
        tasks.removeAll { $0.id == task.id }
        saveData()
    }
    
    func toggleTaskCompletion(_ task: Task) {
        var updatedTask = task
        updatedTask.isCompleted.toggle()
        updatedTask.completedAt = updatedTask.isCompleted ? Date() : nil
        updateTask(updatedTask)
    }
    
    func getTasks(for listId: UUID) -> [Task] {
        return tasks.filter { $0.listId == listId }
    }
    
    func getTasksForToday() -> [Task] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: today)!
        
        return tasks.filter { task in
            guard let dueDate = task.dueDate else { return false }
            let taskDate = calendar.startOfDay(for: dueDate)
            return taskDate >= today && taskDate < tomorrow
        }
    }
    
    // MARK: - Data Persistence
    
    private func saveData() {
        if let encodedTasks = try? JSONEncoder().encode(tasks) {
            UserDefaults.standard.set(encodedTasks, forKey: tasksKey)
        }
        if let encodedLists = try? JSONEncoder().encode(lists) {
            UserDefaults.standard.set(encodedLists, forKey: listsKey)
        }
    }
    
    private func loadData() {
        if let data = UserDefaults.standard.data(forKey: tasksKey),
           let decodedTasks = try? JSONDecoder().decode([Task].self, from: data) {
            tasks = decodedTasks
        }
        if let data = UserDefaults.standard.data(forKey: listsKey),
           let decodedLists = try? JSONDecoder().decode([TaskList].self, from: data) {
            lists = decodedLists
        }
    }
}

