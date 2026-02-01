//
//  LoggerService.swift
//  ImagineRead
//
//  Centralized logging service
//

import Foundation
import os.log

/// Centralized logging service
final class LoggerService {
    
    private let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "ImagineRead", category: "App")
    
    enum Level: String {
        case debug = "🔍"
        case info = "ℹ️"
        case warning = "⚠️"
        case error = "❌"
    }
    
    func debug(_ message: String, file: String = #file, function: String = #function) {
        log(level: .debug, message: message, file: file, function: function)
    }
    
    func info(_ message: String, file: String = #file, function: String = #function) {
        log(level: .info, message: message, file: file, function: function)
    }
    
    func warning(_ message: String, file: String = #file, function: String = #function) {
        log(level: .warning, message: message, file: file, function: function)
    }
    
    func error(_ error: Error, file: String = #file, function: String = #function) {
        log(level: .error, message: error.localizedDescription, file: file, function: function)
    }
    
    func error(_ message: String, file: String = #file, function: String = #function) {
        log(level: .error, message: message, file: file, function: function)
    }
    
    private func log(level: Level, message: String, file: String, function: String) {
        let fileName = (file as NSString).lastPathComponent
        let logMessage = "\(level.rawValue) [\(fileName):\(function)] \(message)"
        
        #if DEBUG
        print(logMessage)
        #endif
        
        switch level {
        case .debug:
            logger.debug("\(logMessage)")
        case .info:
            logger.info("\(logMessage)")
        case .warning:
            logger.warning("\(logMessage)")
        case .error:
            logger.error("\(logMessage)")
        }
    }
}
