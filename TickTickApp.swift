//
//  TickTickApp.swift
//  TickTick
//
//  Created on iOS
//

import SwiftUI

@main
struct TickTickApp: App {
    @StateObject private var taskManager = TaskManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(taskManager)
        }
    }
}

