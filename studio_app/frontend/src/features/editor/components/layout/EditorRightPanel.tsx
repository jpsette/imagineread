import React from 'react';
import { useEditorUIStore } from '../../uiStore';
import { RightSidebar } from '../RightSidebar';

export const EditorRightPanel: React.FC = () => {
    const { activeMode } = useEditorUIStore();

    return (
        <aside className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col z-10 shrink-0 transition-all duration-300 ease-in-out">
            {activeMode === 'edit' && (
                <div className="h-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4">
                    <RightSidebar width={300} />
                </div>
            )}
        </aside>
    );
};
