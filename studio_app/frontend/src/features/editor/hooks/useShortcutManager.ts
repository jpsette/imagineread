import { useEffect } from 'react';
import { useEditorUIStore } from '../uiStore';
import { ToolRegistry } from '../tools/ToolRegistry';

export const useShortcutManager = () => {
    const { setActiveTool } = useEditorUIStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input/textarea is focused
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const key = e.key.toUpperCase();

            // Find tool with this shortcut
            const tools = ToolRegistry.getAll();
            const tool = tools.find(t => t.shortcut === key);

            if (tool) {
                e.preventDefault();
                setActiveTool(tool.id);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool]);
};
