import { useState, useEffect } from 'react';
import { commandManager } from '../commands/CommandManager';

/**
 * Hook to subscribe to command history changes.
 * 
 * Provides reactive access to undo/redo state and actions.
 * 
 * @example
 * const { canUndo, canRedo, undo, redo, history } = useHistory();
 * 
 * <button disabled={!canUndo} onClick={undo}>Undo</button>
 * <button disabled={!canRedo} onClick={redo}>Redo</button>
 */
export function useHistory() {
    const [canUndo, setCanUndo] = useState(commandManager.canUndo);
    const [canRedo, setCanRedo] = useState(commandManager.canRedo);
    const [history, setHistory] = useState(commandManager.history);

    useEffect(() => {
        // Subscribe to command manager changes
        const unsubscribe = commandManager.subscribe((manager) => {
            setCanUndo(manager.canUndo);
            setCanRedo(manager.canRedo);
            setHistory(manager.history);
        });

        return () => { unsubscribe(); };
    }, []);

    return {
        canUndo,
        canRedo,
        history,
        undo: () => commandManager.undo(),
        redo: () => commandManager.redo(),
        clear: () => commandManager.clear()
    };
}
