/**
 * PreviewControls Component
 * 
 * Controls for the mobile preview: replay button, panel counter.
 */

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface PreviewControlsProps {
    currentIndex: number;
    totalPanels: number;
    onReplay: () => void;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
    currentIndex,
    totalPanels,
    onReplay,
}) => {
    return (
        <div className="flex items-center justify-between px-3 py-2 bg-black/60 backdrop-blur-sm">
            {/* Panel Counter */}
            <span className="text-[10px] text-white/60 font-mono">
                {totalPanels > 0 ? `${currentIndex + 1}/${totalPanels}` : '—'}
            </span>

            {/* Replay Button */}
            <button
                onClick={onReplay}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Replay animations"
            >
                <RotateCcw size={10} />
                <span>Replay</span>
            </button>
        </div>
    );
};
