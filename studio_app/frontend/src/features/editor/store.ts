import { create } from 'zustand';
import { Balloon, Panel } from '@shared/types';
import { commandManager } from './commands/CommandManager';
import { UpdateBalloonCommand, RemoveBalloonCommand, AddBalloonCommand } from './commands/balloonCommands';
import { RemovePanelCommand } from './commands/panelCommands';

interface EditorState {
    balloons: Balloon[];
    setBalloons: (balloons: Balloon[] | ((prev: Balloon[]) => Balloon[])) => void;
    addBalloon: (balloon: Balloon) => void;
    updateBalloon: (id: string, updates: Partial<Balloon>) => void;
    removeBalloon: (id: string) => void;

    // Undoable versions (use these for user actions)
    addBalloonUndoable: (balloon: Balloon) => void;
    updateBalloonUndoable: (id: string, updates: Partial<Balloon>) => void;
    removeBalloonUndoable: (id: string) => void;
    removePanelUndoable: (id: string) => void;

    panels: Panel[];
    setPanels: (panels: Panel[] | ((prev: Panel[]) => Panel[])) => void;
    removePanel: (id: string) => void;

    // State Tracking
    isDirty: boolean;
    isSaved: boolean;
    setIsDirty: (v: boolean) => void;
    setIsSaved: (v: boolean) => void;

    // Command Actions (Proxies)
    undo: () => void;
    redo: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    balloons: [],

    // --- STATE TRACKING ---
    isDirty: false,
    isSaved: false,
    setIsDirty: (v) => set({ isDirty: v }),
    setIsSaved: (v) => set({ isSaved: v }),

    // --- LOW LEVEL MUTATORS (Used by Commands) ---
    // These do NOT push to history directly. The Command does that.

    setBalloons: (input) => set((state) => ({
        balloons: typeof input === 'function' ? input(state.balloons) : [...input],
        isDirty: true,
        isSaved: false
    })),

    addBalloon: (balloon) => set((state) => ({
        balloons: [...state.balloons, balloon],
        isDirty: true,
        isSaved: false
    })),

    updateBalloon: (id, updates) => set((state) => ({
        balloons: state.balloons.map(b => b.id === id ? { ...b, ...updates } : b),
        isDirty: true,
        isSaved: false
    })),

    removeBalloon: (id) => set((state) => ({
        balloons: state.balloons.filter(b => b.id !== id),
        isDirty: true,
        isSaved: false
    })),

    // --- UNDOABLE ACTIONS (Use these for user actions) ---
    addBalloonUndoable: (balloon) => {
        commandManager.execute(new AddBalloonCommand(balloon));
    },

    updateBalloonUndoable: (id, updates) => {
        commandManager.execute(new UpdateBalloonCommand(id, updates));
    },

    removeBalloonUndoable: (id) => {
        commandManager.execute(new RemoveBalloonCommand(id));
    },

    removePanelUndoable: (id) => {
        commandManager.execute(new RemovePanelCommand(id));
    },

    // PANELS
    panels: [],
    setPanels: (input) => set((state) => ({
        panels: typeof input === 'function' ? input(state.panels) : [...input],
        isDirty: true,
        isSaved: false
    })),
    removePanel: (id) => set((state) => ({
        panels: state.panels.filter(p => p.id !== id),
        isDirty: true,
        isSaved: false
    })),

    // --- COMMAND PROXIES ---
    undo: () => commandManager.undo(),
    redo: () => commandManager.redo(),
}));
