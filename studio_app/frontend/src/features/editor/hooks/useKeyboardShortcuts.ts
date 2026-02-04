import { useEffect, useCallback } from 'react';
import { commandManager } from '../commands/CommandManager';

interface KeyboardShortcutsOptions {
    enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts for the editor.
 * 
 * Shortcuts implemented:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 * - Ctrl+Y / Cmd+Y: Redo (Windows/Linux alternative)
 * - Delete / Backspace: Delete selected item
 * 
 * @param options - Configuration options
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
    const { enabled = true } = options;

    // Note: Delete functionality requires selectedId from uiStore
    // This is a simplified hook - use useShortcutManager for full functionality

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't handle shortcuts if typing in an input
        if (e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            (e.target as HTMLElement)?.contentEditable === 'true') {
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? e.metaKey : e.ctrlKey;

        // Undo: Ctrl/Cmd + Z (without Shift)
        if (modKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            commandManager.undo();
            return;
        }

        // Redo: Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y
        if (modKey && e.key.toLowerCase() === 'z' && e.shiftKey) {
            e.preventDefault();
            commandManager.redo();
            return;
        }

        if (modKey && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            commandManager.redo();
            return;
        }

        // Delete: Delete or Backspace key (when an item is selected)
        // Note: This requires selectedId from uiStore, implement later
        // if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        //     e.preventDefault();
        //     removeBalloonUndoable(selectedId);
        // }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, handleKeyDown]);
}

/**
 * Standalone hook just for undo/redo shortcuts.
 * Lighter weight if you don't need other shortcuts.
 */
export function useUndoRedoShortcuts(enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if typing
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? e.metaKey : e.ctrlKey;

            if (modKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                commandManager.undo();
            } else if (modKey && e.key.toLowerCase() === 'z' && e.shiftKey) {
                e.preventDefault();
                commandManager.redo();
            } else if (modKey && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                commandManager.redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled]);
}
