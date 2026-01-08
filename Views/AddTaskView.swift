//
//  AddTaskView.swift
//  TickTick
//
//  Add/Edit task view
//

import SwiftUI

struct AddTaskView: View {
    @EnvironmentObject var taskManager: TaskManager
    @Environment(\.dismiss) var dismiss
    
    let listId: UUID?
    @State private var title: String = ""
    @State private var notes: String = ""
    @State private var dueDate: Date?
    @State private var hasDueDate: Bool = false
    @State private var priority: Priority = .none
    @State private var selectedListId: UUID = UUID()
    
    init(listId: UUID?) {
        self.listId = listId
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
            .onAppear {
                if let listId = listId {
                    selectedListId = listId
                } else if let firstListId = taskManager.lists.first?.id {
                    selectedListId = firstListId
                }
            }
            .navigationTitle("New Task")
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
        let task = Task(
            title: title,
            notes: notes,
            dueDate: hasDueDate ? dueDate : nil,
            priority: priority,
            listId: selectedListId
        )
        taskManager.addTask(task)
        dismiss()
    }
}

