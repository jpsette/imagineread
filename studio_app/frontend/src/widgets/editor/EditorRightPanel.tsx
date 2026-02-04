import React from 'react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { RightSidebar } from './RightSidebar';
import { EditMenu } from '@features/editor/components/menus/EditMenu';
import { FloatingPanel } from '@shared/components/FloatingPanel';

export const EditorRightPanel: React.FC = () => {
    const { activeMode } = useEditorUIStore();

    // Calculate default X position (right side of screen, with 16px margin)
    // We use a reasonable default that works for most screens
    const defaultX = typeof window !== 'undefined' ? window.innerWidth - 316 : 1000;

    // Show panel for edit and translate modes
    if (activeMode !== 'edit' && activeMode !== 'translate') return null;

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
                    {/* Edit mode: show full RightSidebar */}
                    {activeMode === 'edit' && <RightSidebar />}
                    {/* Translate mode: show EditMenu (text tools) */}
                    {activeMode === 'translate' && <EditMenu />}
                </div>
            </div>
        </FloatingPanel>
    );
};
