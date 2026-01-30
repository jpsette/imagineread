import { Command } from './types';

type Listener = (manager: CommandManager) => void;

export class CommandManager {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private listeners: Set<Listener> = new Set();
    private maxHistory = 50;

    constructor() { }

    /** Execute a new command and push to history */
    async execute(command: Command) {
        console.log(`[CommandManager] Execute: ${command.label} (${command.id})`);

        try {
            await command.execute();

            this.undoStack.push(command);
            this.redoStack = []; // Clear redo on new action

            // Limit history
            if (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }

            this.notify();
        } catch (e) {
            console.error(`[CommandManager] Error executing ${command.label}:`, e);
            // TODO: Rollback if partial execution?
        }
    }

    /** Undo the last command */
    async undo() {
        if (this.undoStack.length === 0) {
            console.warn("[DEBUG] CommandManager: Undo Stack Empty!");
            return;
        }
        const command = this.undoStack.pop();
        if (!command) return;

        console.log(`[DEBUG] CommandManager: Undo: ${command.label}`, command);
        try {
            await command.undo();
            this.redoStack.push(command);
            this.notify();
        } catch (e) {
            console.error(`[CommandManager] Error undoing ${command.label}:`, e);
            // Push back to undo stack? Or drop?
            // For now, allow dropping corrupt commands to unblock user.
        }
    }

    /** Redo the previously undone command */
    async redo() {
        const command = this.redoStack.pop();
        if (!command) return;

        console.log(`[CommandManager] Redo: ${command.label}`);
        try {
            // Use specialized redo if available, else execute
            if (command.redo) {
                await command.redo();
            } else {
                await command.execute();
            }
            this.undoStack.push(command);
            this.notify();
        } catch (e) {
            console.error(`[CommandManager] Error redoing ${command.label}:`, e);
        }
    }

    // --- UTILS ---

    get canUndo() { return this.undoStack.length > 0; }
    get canRedo() { return this.redoStack.length > 0; }

    get history() {
        return {
            undo: this.undoStack.map(c => c.label),
            redo: this.redoStack.map(c => c.label)
        };
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(l => l(this));
    }

    /** Clear all history (e.g. on new file load) */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.notify();
    }
}

// Global Instance
export const commandManager = new CommandManager();
