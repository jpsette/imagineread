import React from 'react';
import { useEditorUIStore } from '@features/editor/uiStore';

/**
 * Toggle button for curve editing mode
 * Shows purple accent when active
 */
export const CurveToggleButton: React.FC = () => {
    const { curveEditingEnabled, toggleCurveEditing } = useEditorUIStore();

    return (
        <button
            onClick={toggleCurveEditing}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${curveEditingEnabled
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-white/10 text-zinc-400 border border-white/10 hover:bg-white/20'
                }`}
        >
            {curveEditingEnabled ? 'ON' : 'OFF'}
        </button>
    );
};
