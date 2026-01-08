//
//  AddListView.swift
//  TickTick
//
//  Add list view
//

import SwiftUI

struct AddListView: View {
    @EnvironmentObject var taskManager: TaskManager
    @Environment(\.dismiss) var dismiss
    
    @State private var name: String = ""
    @State private var selectedColor: String = "blue"
    @State private var selectedIcon: String = "list.bullet"
    
    let colors = ["blue", "red", "orange", "yellow", "green", "purple", "pink", "gray"]
    let icons = ["list.bullet", "tray", "sun.max", "calendar", "person", "briefcase", "house", "heart", "star", "flag"]
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("List name", text: $name)
                }
                
                Section("Color") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 16) {
                        ForEach(colors, id: \.self) { color in
                            Button(action: {
                                selectedColor = color
                            }) {
                                Circle()
                                    .fill(Color(color))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Circle()
                                            .stroke(selectedColor == color ? Color.primary : Color.clear, lineWidth: 3)
                                    )
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                Section("Icon") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 16) {
                        ForEach(icons, id: \.self) { icon in
                            Button(action: {
                                selectedIcon = icon
                            }) {
                                Image(systemName: icon)
                                    .font(.title2)
                                    .foregroundColor(selectedIcon == icon ? Color(selectedColor) : .gray)
                                    .frame(width: 40, height: 40)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(selectedIcon == icon ? Color(selectedColor).opacity(0.2) : Color.clear)
                                    )
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }
            }
            .navigationTitle("New List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveList()
                    }
                    .disabled(name.isEmpty)
                }
            }
        }
    }
    
    private func saveList() {
        let list = TaskList(
            name: name,
            color: selectedColor,
            icon: selectedIcon
        )
        taskManager.addList(list)
        dismiss()
    }
}

