import { create } from 'zustand';
import { Balloon } from '../../types';

interface EditorState {
    balloons: Balloon[];
    setBalloons: (balloons: Balloon[]) => void;
    addBalloon: (balloon: Balloon) => void;
    updateBalloon: (id: string, updates: Partial<Balloon>) => void;
    removeBalloon: (id: string) => void;

    // Optional: We might want these later if migrating fully
    // selectedId: string | null;
    // setSelectedId: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    balloons: [],

    // The critical action for batch replacement
    setBalloons: (balloons) => {
        // Ensure we create a new array reference
        set({ balloons: [...balloons] });
    },

    addBalloon: (balloon) => set((state) => ({
        balloons: [...state.balloons, balloon]
    })),

    updateBalloon: (id, updates) => set((state) => ({
        balloons: state.balloons.map(b => b.id === id ? { ...b, ...updates } : b)
    })),

    removeBalloon: (id) => set((state) => ({
        balloons: state.balloons.filter(b => b.id !== id)
    }))
}));
