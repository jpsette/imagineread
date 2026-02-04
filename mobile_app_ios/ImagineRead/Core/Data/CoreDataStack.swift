//
//  CoreDataStack.swift
//  ImagineRead
//
//  Core Data persistence stack
//

import Foundation
import CoreData

/// Core Data stack for persistent storage
final class CoreDataStack {
    
    // MARK: - Singleton
    
    static let shared = CoreDataStack()
    
    // MARK: - Properties
    
    /// Persistent container
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "ImagineRead")
        container.loadPersistentStores { storeDescription, error in
            if let error = error as NSError? {
                print("CoreDataStack: Failed to load store: \(error), \(error.userInfo)")
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return container
    }()
    
    /// Main context for UI operations
    var mainContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }
    
    /// Background context for heavy operations
    func newBackgroundContext() -> NSManagedObjectContext {
        let context = persistentContainer.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return context
    }
    
    // MARK: - Init
    
    private init() {}
    
    // MARK: - Save
    
    /// Save main context
    func save() {
        let context = mainContext
        guard context.hasChanges else { return }
        
        do {
            try context.save()
        } catch {
            print("CoreDataStack: Failed to save: \(error)")
        }
    }
    
    /// Save a specific context
    func save(context: NSManagedObjectContext) {
        guard context.hasChanges else { return }
        
        do {
            try context.save()
        } catch {
            print("CoreDataStack: Failed to save context: \(error)")
        }
    }
}
