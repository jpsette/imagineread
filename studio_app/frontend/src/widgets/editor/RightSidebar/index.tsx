import React from 'react';

import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';

import { ToolsSection } from './sections/ToolsSection';
import { ShapeFormatSection } from './sections/ShapeFormatSection';
import { LineStyleSection } from './sections/LineStyleSection';
import { VertexEditSection } from './sections/VertexEditSection';

interface RightSidebarProps {
}

export const RightSidebar: React.FC<RightSidebarProps> = () => {
    const { activeTool, selectedId } = useEditorUIStore();
    const { balloons } = useEditorStore();

    // Find selected balloon
    const selectedBalloon = balloons.find(b => b.id === selectedId);
    const hasSelectedBalloon = !!selectedBalloon;

    return (
        <div className="flex flex-col gap-3 w-full h-full overflow-y-auto custom-scrollbar p-1">

            {/* BALLOON TOOLS */}
            <ToolsSection balloons={balloons} activeTool={activeTool} />

            {/* Separator */}
            <div className="h-px bg-white/5 mx-2" />

            {/* BALLOON FORMAT - Only visible when a balloon is selected */}
            <div className={`space-y-3 transition-opacity duration-200 ${hasSelectedBalloon ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <ShapeFormatSection selectedBalloon={selectedBalloon} hasSelectedBalloon={hasSelectedBalloon} />
                <LineStyleSection selectedBalloon={selectedBalloon} hasSelectedBalloon={hasSelectedBalloon} />
                <VertexEditSection selectedBalloon={selectedBalloon} hasSelectedBalloon={hasSelectedBalloon} />
            </div>
        </div>
    );
};
