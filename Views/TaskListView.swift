//
//  TaskListView.swift
//  TickTick
//
//  Task list view
//

import SwiftUI

struct TaskListView: View {
    @EnvironmentObject var taskManager: TaskManager
    let listId: UUID?
    let title: String?
    let isTodayView: Bool
    
    @State private var showingAddTask = false
    @State private var selectedTask: Task?
    @State private var showCompleted = false
    
    init(listId: UUID?, title: String? = nil, isTodayView: Bool = false) {
        self.listId = listId
        self.title = title
        self.isTodayView = isTodayView
    }
    
    var tasks: [Task] {
        if isTodayView {
            return taskManager.getTasksForToday()
        } else if let listId = listId {
            return taskManager.getTasks(for: listId)
        } else {
            return taskManager.tasks
        }
    }
    
    var activeTasks: [Task] {
        tasks.filter { !$0.isCompleted }
    }
    
    var completedTasks: [Task] {
        tasks.filter { $0.isCompleted }
    }
    
    var displayTitle: String {
        if let title = title {
            return title
        } else if let listId = listId, let list = taskManager.getList(by: listId) {
            return list.name
        }
        return "Tasks"
    }
    
    var body: some View {
        List {
            // Active tasks
            ForEach(activeTasks) { task in
                TaskRowView(task: task)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedTask = task
                    }
            }
            .onDelete(perform: deleteTasks)
            
            // Completed tasks
            if !completedTasks.isEmpty {
                Section {
                    ForEach(completedTasks) { task in
                        TaskRowView(task: task)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedTask = task
                            }
                    }
                    .onDelete(perform: deleteCompletedTasks)
                } header: {
                    HStack {
                        Text("Completed")
                        Spacer()
                        Button(action: { showCompleted.toggle() }) {
                            Image(systemName: showCompleted ? "chevron.down" : "chevron.right")
                        }
                    }
                }
            }
        }
        .navigationTitle(displayTitle)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddTask = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showingAddTask) {
            AddTaskView(listId: listId)
        }
        .sheet(item: $selectedTask) { task in
            TaskDetailView(task: task)
        }
    }
    
    private func deleteTasks(at offsets: IndexSet) {
        for index in offsets {
            let task = activeTasks[index]
            taskManager.deleteTask(task)
        }
    }
    
    private func deleteCompletedTasks(at offsets: IndexSet) {
        for index in offsets {
            let task = completedTasks[index]
            taskManager.deleteTask(task)
        }
    }
}

struct TaskRowView: View {
    @EnvironmentObject var taskManager: TaskManager
    let task: Task
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: {
                taskManager.toggleTaskCompletion(task)
            }) {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(task.isCompleted ? .green : .gray)
                    .font(.title3)
            }
            .buttonStyle(PlainButtonStyle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .strikethrough(task.isCompleted)
                    .foregroundColor(task.isCompleted ? .secondary : .primary)
                
                if !task.notes.isEmpty {
                    Text(task.notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                
                HStack(spacing: 8) {
                    if let dueDate = task.dueDate {
                        Label(dueDate, style: .date)
                            .font(.caption2)
                            .foregroundColor(isOverdue(dueDate) && !task.isCompleted ? .red : .secondary)
                    }
                    
                    if task.priority != .none {
                        Circle()
                            .fill(Color(task.priority.color))
                            .frame(width: 8, height: 8)
                    }
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
    
    private func isOverdue(_ date: Date) -> Bool {
        return date < Date() && !Calendar.current.isDateInToday(date)
    }
}

