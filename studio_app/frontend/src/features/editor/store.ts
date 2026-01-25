import { create } from 'zustand';
import { temporal } from 'zundo';
import { Balloon, Panel } from '../../types';

interface EditorState {
    balloons: Balloon[];
    setBalloons: (balloons: Balloon[] | ((prev: Balloon[]) => Balloon[])) => void;
    addBalloon: (balloon: Balloon) => void;
    updateBalloon: (id: string, updates: Partial<Balloon>) => void;
    removeBalloon: (id: string) => void;
    panels: Panel[];
    setPanels: (panels: Panel[] | ((prev: Panel[]) => Panel[])) => void;
    removePanel: (id: string) => void;


    // State Tracking
    isDirty: boolean; // Needs Save?
    isSaved: boolean; // Just Saved?
    setIsDirty: (v: boolean) => void;
    setIsSaved: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
    temporal(
        (set) => ({
            balloons: [],

            // --- STATE TRACKING ---
            isDirty: false,
            isSaved: false, // NEW: Track explicit save success
            setIsDirty: (v) => set({ isDirty: v }),
            setIsSaved: (v) => set({ isSaved: v }),

            // Supports both value and functional updates
            setBalloons: (input) => set((state) => ({
                balloons: typeof input === 'function' ? input(state.balloons) : [...input],
                isDirty: true, // Mutation = Dirty
                isSaved: false // Mutation = Not Saved
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

        }),
        {
            limit: 50, // Limit history
            partialize: (state) => ({
                balloons: state.balloons,
                panels: state.panels,
                // Removed cleanImageUrl to prevent "ghost" state on reload
            }),
        }
    )
);
