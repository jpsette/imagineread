import React from 'react';
import { Pen } from 'lucide-react';
import { VertexToggleButton } from '@features/editor/components/ui/VertexToggleButton';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';
import { Balloon } from '@shared/types';

interface VertexEditSectionProps {
    selectedBalloon: Balloon | undefined;
    hasSelectedBalloon: boolean;
}

export const VertexEditSection: React.FC<VertexEditSectionProps> = ({
    selectedBalloon,
    hasSelectedBalloon
}) => {
    const { activeTool, setActiveTool } = useEditorUIStore();
    const { updateBalloonUndoable } = useEditorStore();
    const isPenActive = activeTool === 'pen';

    const handlePenClick = () => {
        setActiveTool(isPenActive ? 'select' : 'pen');
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedBalloon) {
            const newRadius = Number(e.target.value);
            // Clear custom points when changing radius so the balloon uses Rect with borderRadius
            updateBalloonUndoable(selectedBalloon.id, {
                borderRadius: newRadius,
                points: undefined,
                curveControlPoints: undefined
            });
        }
    };

    // Calculate max radius based on balloon dimensions
    const getMaxRadius = () => {
        if (!selectedBalloon) return 100;
        const width = selectedBalloon.box_2d[3] - selectedBalloon.box_2d[1];
        const height = selectedBalloon.box_2d[2] - selectedBalloon.box_2d[0];
        return Math.floor(Math.min(width, height) / 2);
    };

    const currentRadius = selectedBalloon?.borderRadius || 0;
    const maxRadius = getMaxRadius();

    return (
        <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-300 font-semibold uppercase tracking-wide">Vértices</span>
            </div>

            {/* Original vertex toggle */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2">
                <span className="text-[10px] text-zinc-400 font-medium flex-1">Editar Vértices</span>
                <VertexToggleButton />
            </div>

            {/* Pen tool for bezier curves */}
            <button
                onClick={handlePenClick}
                className={`mt-2 w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all ${isPenActive
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-zinc-300'
                    }`}
            >
                <Pen size={12} />
                <span className="text-[10px] font-medium">Curvar Arestas</span>
            </button>

            {/* Border Radius Slider */}
            <div className={`mt-3 space-y-1.5 transition-opacity ${hasSelectedBalloon ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-medium">Arredondamento</span>
                    <span className="text-[10px] font-bold text-white w-8 text-right">{currentRadius}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max={maxRadius}
                    value={currentRadius}
                    onChange={handleRadiusChange}
                    disabled={!hasSelectedBalloon}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer 
                               accent-blue-500 
                               [&::-webkit-slider-thumb]:appearance-none 
                               [&::-webkit-slider-thumb]:w-3 
                               [&::-webkit-slider-thumb]:h-3 
                               [&::-webkit-slider-thumb]:bg-blue-500 
                               [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-webkit-slider-thumb]:shadow-md"
                />
                <div className="flex justify-between text-[8px] text-zinc-500">
                    <span>0</span>
                    <span>{maxRadius}</span>
                </div>
            </div>
        </div>
    );
};
