//
//  ContentView.swift
//  TickTick
//
//  Main content view
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var taskManager: TaskManager
    @State private var selectedListId: UUID?
    @State private var showingAddTask = false
    @State private var showingAddList = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Sidebar with lists
                List {
                    Section("Lists") {
                        ForEach(taskManager.lists) { list in
                            NavigationLink(
                                destination: TaskListView(listId: list.id),
                                tag: list.id,
                                selection: $selectedListId
                            ) {
                                HStack {
                                    Image(systemName: list.icon)
                                        .foregroundColor(Color(list.color))
                                        .frame(width: 20)
                                    Text(list.name)
                                    Spacer()
                                    Text("\(taskManager.getTasks(for: list.id).count)")
                                        .foregroundColor(.secondary)
                                        .font(.caption)
                                }
                            }
                        }
                        .onDelete(perform: deleteLists)
                    }
                    
                    Section("Quick Views") {
                        NavigationLink(
                            destination: TaskListView(listId: nil, title: "Today", isTodayView: true)
                        ) {
                            HStack {
                                Image(systemName: "sun.max")
                                    .foregroundColor(.orange)
                                    .frame(width: 20)
                                Text("Today")
                                Spacer()
                                Text("\(taskManager.getTasksForToday().count)")
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                        }
                        
                        NavigationLink(
                            destination: TaskListView(listId: nil, title: "All Tasks")
                        ) {
                            HStack {
                                Image(systemName: "checklist")
                                    .foregroundColor(.blue)
                                    .frame(width: 20)
                                Text("All Tasks")
                                Spacer()
                                Text("\(taskManager.tasks.count)")
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                        }
                    }
                }
                .listStyle(SidebarListStyle())
                .navigationTitle("TickTick")
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(action: { showingAddList = true }) {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showingAddList) {
            AddListView()
        }
    }
    
    private func deleteLists(at offsets: IndexSet) {
        for index in offsets {
            let list = taskManager.lists[index]
            taskManager.deleteList(list)
        }
    }
}

