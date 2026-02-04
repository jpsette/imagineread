import React from 'react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { RightSidebar } from './RightSidebar';
import { FloatingPanel } from '@shared/components/FloatingPanel';

export const EditorRightPanel: React.FC = () => {
    const { activeMode } = useEditorUIStore();

    // Calculate default X position (right side of screen, with 16px margin)
    // We use a reasonable default that works for most screens
    const defaultX = typeof window !== 'undefined' ? window.innerWidth - 316 : 1000;

    if (activeMode !== 'edit') return null;

    return (
        <FloatingPanel
            defaultPosition={{ x: defaultX, y: 96 }}
            defaultSize={{ width: 300, height: 800 }}
            minWidth={250}
            maxWidth={350}
            minHeight={250}
        >
            <div className="w-full h-full bg-panel-bg rounded-2xl border border-border-color shadow-xl overflow-hidden pointer-events-auto flex flex-col">
                <div className="w-full h-full px-4 pt-2 overflow-y-auto custom-scrollbar">
                    <RightSidebar />
                </div>
            </div>
        </FloatingPanel>
    );
};
