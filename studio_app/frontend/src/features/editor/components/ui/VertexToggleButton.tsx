import React from 'react';
import { useEditorUIStore } from '@features/editor/uiStore';

/**
 * Toggle button for vertex editing mode
 * Shows red accent when active
 */
export const VertexToggleButton: React.FC = () => {
    const { vertexEditingEnabled, toggleVertexEditing } = useEditorUIStore();

    return (
        <button
            onClick={toggleVertexEditing}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${vertexEditingEnabled
                    ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                    : 'bg-white/10 text-zinc-400 border border-white/10 hover:bg-white/20'
                }`}
        >
            {vertexEditingEnabled ? 'ON' : 'OFF'}
        </button>
    );
};
