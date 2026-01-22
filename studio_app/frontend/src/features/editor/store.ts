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

    // --- NEW: CLEAN IMAGE STATE ---
    cleanImageUrl: string | null;
    isOriginalVisible: boolean;
    setCleanImage: (url: string | null) => void;
    toggleVisibility: () => void;
}

export const useEditorStore = create<EditorState>()(
    temporal(
        (set) => ({
            balloons: [],

            // Supports both value and functional updates
            setBalloons: (input) => set((state) => ({
                balloons: typeof input === 'function' ? input(state.balloons) : [...input]
            })),

            addBalloon: (balloon) => set((state) => ({
                balloons: [...state.balloons, balloon]
            })),

            updateBalloon: (id, updates) => set((state) => ({
                balloons: state.balloons.map(b => b.id === id ? { ...b, ...updates } : b)
            })),

            removeBalloon: (id) => set((state) => ({
                balloons: state.balloons.filter(b => b.id !== id)
            })),

            // PANELS
            panels: [],
            setPanels: (input) => set((state) => ({
                panels: typeof input === 'function' ? input(state.panels) : [...input]
            })),
            removePanel: (id) => set((state) => ({
                panels: state.panels.filter(p => p.id !== id)
            })),

            // --- NEW IMPLEMENTATION ---
            cleanImageUrl: null,
            isOriginalVisible: false, // Default to showing the processed (clean) image if available

            setCleanImage: (url) => set({
                cleanImageUrl: url,
                isOriginalVisible: false // Auto-switch to clean view when new image arrives
            }),

            toggleVisibility: () => set((state) => ({
                isOriginalVisible: !state.isOriginalVisible
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
