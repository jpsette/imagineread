/**
 * WorkspaceHeader
 * 
 * Header component for the AnimationWorkspace with drag handle and controls.
 */

import React from 'react';
import { Move, Minimize2, Maximize2, Eye, EyeOff } from 'lucide-react';

interface WorkspaceHeaderProps {
    currentIndex: number;
    totalPanels: number;
    showBalloons: boolean;
    isMinimized: boolean;
    onToggleBalloons: () => void;
    onToggleMinimize: () => void;
}

export const WorkspaceHeader = React.memo<WorkspaceHeaderProps>(({
    currentIndex,
    totalPanels,
    showBalloons,
    isMinimized,
    onToggleBalloons,
    onToggleMinimize
}) => {
    return (
        <div className="drag-handle flex items-center justify-between bg-panel-bg rounded-t-xl px-4 py-2.5 cursor-move border border-zinc-700 border-b-0">
            <div className="flex items-center gap-2 text-text-secondary text-xs">
                <Move size={14} />
                <span className="font-medium">Workspace de Animação</span>
                {totalPanels > 0 && <span className="text-zinc-600">• Quadro {currentIndex + 1}/{totalPanels}</span>}
            </div>
            <div className="flex items-center gap-1">
                {/* Balloon Toggle */}
                <button
                    onClick={onToggleBalloons}
                    className={`p-1.5 rounded transition-colors ${showBalloons ? 'bg-blue-600 text-white' : 'hover:bg-surface text-text-secondary'}`}
                    title={showBalloons ? 'Ocultar balões' : 'Mostrar balões'}
                >
                    {showBalloons ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={onToggleMinimize} className="p-1.5 hover:bg-surface rounded transition-colors">
                    {isMinimized ? <Maximize2 size={14} className="text-text-secondary" /> : <Minimize2 size={14} className="text-text-secondary" />}
                </button>
            </div>
        </div>
    );
});

WorkspaceHeader.displayName = 'WorkspaceHeader';
