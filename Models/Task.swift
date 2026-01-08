//
//  Task.swift
//  TickTick
//
//  Task model
//

import Foundation

struct Task: Identifiable, Codable, Equatable {
    var id: UUID
    var title: String
    var notes: String
    var isCompleted: Bool
    var dueDate: Date?
    var priority: Priority
    var listId: UUID
    var createdAt: Date
    var completedAt: Date?
    
    init(
        id: UUID = UUID(),
        title: String,
        notes: String = "",
        isCompleted: Bool = false,
        dueDate: Date? = nil,
        priority: Priority = .none,
        listId: UUID,
        createdAt: Date = Date(),
        completedAt: Date? = nil
    ) {
        self.id = id
        self.title = title
        self.notes = notes
        self.isCompleted = isCompleted
        self.dueDate = dueDate
        self.priority = priority
        self.listId = listId
        self.createdAt = createdAt
        self.completedAt = completedAt
    }
}

enum Priority: String, Codable, CaseIterable {
    case none = "None"
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    
    var color: String {
        switch self {
        case .none: return "gray"
        case .low: return "blue"
        case .medium: return "orange"
        case .high: return "red"
        }
    }
}

struct TaskList: Identifiable, Codable {
    var id: UUID
    var name: String
    var color: String
    var icon: String
    
    init(id: UUID = UUID(), name: String, color: String = "blue", icon: String = "list.bullet") {
        self.id = id
        self.name = name
        self.color = color
        self.icon = icon
    }
}

