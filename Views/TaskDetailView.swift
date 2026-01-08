//
//  TaskDetailView.swift
//  TickTick
//
//  Task detail view
//

import SwiftUI

struct TaskDetailView: View {
    @EnvironmentObject var taskManager: TaskManager
    @Environment(\.dismiss) var dismiss
    
    @State var task: Task
    @State private var isEditing = false
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    HStack {
                        Button(action: {
                            taskManager.toggleTaskCompletion(task)
                            task.isCompleted.toggle()
                        }) {
                            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(task.isCompleted ? .green : .gray)
                                .font(.title2)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Text(task.title)
                            .font(.title3)
                            .strikethrough(task.isCompleted)
                    }
                }
                
                if !task.notes.isEmpty {
                    Section("Notes") {
                        Text(task.notes)
                    }
                }
                
                Section("Details") {
                    if let list = taskManager.getList(by: task.listId) {
                        HStack {
                            Text("List")
                            Spacer()
                            HStack {
                                Image(systemName: list.icon)
                                    .foregroundColor(Color(list.color))
                                Text(list.name)
                            }
                        }
                    }
                    
                    if let dueDate = task.dueDate {
                        HStack {
                            Text("Due Date")
                            Spacer()
                            Text(dueDate, style: .date)
                                .foregroundColor(isOverdue(dueDate) && !task.isCompleted ? .red : .primary)
                        }
                    }
                    
                    HStack {
                        Text("Priority")
                        Spacer()
                        HStack {
                            Circle()
                                .fill(Color(task.priority.color))
                                .frame(width: 12, height: 12)
                            Text(task.priority.rawValue)
                        }
                    }
                }
            }
            .navigationTitle("Task Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Edit") {
                        isEditing = true
                    }
                }
            }
            .sheet(isPresented: $isEditing) {
                EditTaskView(task: task)
            }
        }
    }
    
    private func isOverdue(_ date: Date) -> Bool {
        return date < Date() && !Calendar.current.isDateInToday(date)
    }
}

struct EditTaskView: View {
    @EnvironmentObject var taskManager: TaskManager
    @Environment(\.dismiss) var dismiss
    
    @State var task: Task
    @State private var title: String
    @State private var notes: String
    @State private var dueDate: Date?
    @State private var hasDueDate: Bool
    @State private var priority: Priority
    @State private var selectedListId: UUID
    
    init(task: Task) {
        _task = State(initialValue: task)
        _title = State(initialValue: task.title)
        _notes = State(initialValue: task.notes)
        _dueDate = State(initialValue: task.dueDate)
        _hasDueDate = State(initialValue: task.dueDate != nil)
        _priority = State(initialValue: task.priority)
        _selectedListId = State(initialValue: task.listId)
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Task title", text: $title)
                    TextField("Notes (optional)", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("List") {
                    Picker("List", selection: $selectedListId) {
                        ForEach(taskManager.lists) { list in
                            HStack {
                                Image(systemName: list.icon)
                                    .foregroundColor(Color(list.color))
                                Text(list.name)
                            }
                            .tag(list.id)
                        }
                    }
                }
                
                Section("Due Date") {
                    Toggle("Set due date", isOn: $hasDueDate)
                    if hasDueDate {
                        DatePicker("Due date", selection: Binding(
                            get: { dueDate ?? Date() },
                            set: { dueDate = $0 }
                        ), displayedComponents: [.date, .hourAndMinute])
                    }
                }
                
                Section("Priority") {
                    Picker("Priority", selection: $priority) {
                        ForEach(Priority.allCases, id: \.self) { priority in
                            HStack {
                                Circle()
                                    .fill(Color(priority.color))
                                    .frame(width: 12, height: 12)
                                Text(priority.rawValue)
                            }
                            .tag(priority)
                        }
                    }
                }
            }
            .navigationTitle("Edit Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveTask()
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
    }
    
    private func saveTask() {
        var updatedTask = task
        updatedTask.title = title
        updatedTask.notes = notes
        updatedTask.dueDate = hasDueDate ? dueDate : nil
        updatedTask.priority = priority
        updatedTask.listId = selectedListId
        taskManager.updateTask(updatedTask)
        dismiss()
    }
}

