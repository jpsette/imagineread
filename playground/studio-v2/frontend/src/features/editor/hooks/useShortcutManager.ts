import { useEffect } from 'react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '../store';
import { ToolRegistry } from '../tools/ToolRegistry';

export const useShortcutManager = (editor?: any) => {
    const { setActiveTool } = useEditorUIStore();
    const { removeBalloon, removePanel } = useEditorStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input/textarea is focused or content editable
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable) {
                return;
            }

            const key = e.key.toUpperCase();

            // --- 1. GLOBAL ACTIONS (Undo/Redo/Delete) ---

            // DELETE
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (editor && editor.selectedBubbleId) {
                    if (editor.selectedBubbleId.startsWith('panel')) {
                        removePanel(editor.selectedBubbleId);
                        editor.setSelectedBubbleId(null);
                    } else {
                        removeBalloon(editor.selectedBubbleId);
                        editor.setSelectedBubbleId(null);
                    }
                }
            }

            // UNDO / REDO
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
                console.log("[DEBUG] ShortcutManager: Undo/Redo Detected", { shift: e.shiftKey, meta: e.metaKey });
                e.preventDefault();
                const { undo, redo } = useEditorStore.getState();
                e.shiftKey ? redo() : undo();
            }

            // --- 2. TOOL SWITCHING ---
            const tools = ToolRegistry.getAll();
            const tool = tools.find(t => t.shortcut === key);

            if (tool) {
                e.preventDefault();
                setActiveTool(tool.id);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool, editor, removeBalloon, removePanel]);
};
