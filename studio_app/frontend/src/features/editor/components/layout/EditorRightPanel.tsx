import React from 'react';
import { useEditorUIStore } from '../../uiStore';
import { RightSidebar } from '../RightSidebar';

export const EditorRightPanel: React.FC = () => {
    const { activeMode } = useEditorUIStore();

    return (
        <aside className="absolute right-4 top-24 bottom-24 w-fit z-40 bg-transparent flex flex-col pointer-events-none">
            {activeMode === 'edit' && (
                <div className="w-72 h-full bg-black/60 backdrop-blur-md rounded-2xl border border-glass-border shadow-glow-sm overflow-hidden pointer-events-auto flex flex-col">
                    <RightSidebar />
                </div>
            )}
        </aside>
    );
};
