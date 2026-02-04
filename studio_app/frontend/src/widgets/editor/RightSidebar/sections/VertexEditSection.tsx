import React from 'react';
import { PenTool, Circle } from 'lucide-react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';
import { Balloon } from '@shared/types';

interface VertexEditSectionProps {
    selectedBalloon: Balloon | undefined;
    hasSelectedBalloon: boolean;
}

// =============================================================================
// VECTOR EDIT MODE (Single unified mode - Figma style)
// =============================================================================
// 
// This implements a unified vector editing mode similar to Figma:
// - Single toggle to enter/exit vector edit mode
// - Vertices shown as squares (can be moved)
// - Handles appear only when clicking on a vertex (on-demand)
// - Alt+drag to break handle symmetry
// - Shift+drag to constrain 45°
//

export const VertexEditSection: React.FC<VertexEditSectionProps> = ({
    selectedBalloon,
    hasSelectedBalloon
}) => {
    const {
        setActiveTool,
        vertexEditingEnabled,
        setVertexEditingEnabled,
        setCurveEditingEnabled
    } = useEditorUIStore();

    const { updateBalloonUndoable } = useEditorStore();

    // Single unified mode
    const isVectorEditMode = vertexEditingEnabled;

    // Toggle vector edit mode
    const handleToggleVectorEdit = () => {
        if (isVectorEditMode) {
            // Exit vector edit mode
            setVertexEditingEnabled(false);
            setCurveEditingEnabled(false);
            setActiveTool('select');
        } else {
            // Enter vector edit mode (both vertex and curve enabled)
            setVertexEditingEnabled(true);
            setCurveEditingEnabled(true);
            setActiveTool('pointer');
        }
    };

    // Border radius handler
    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedBalloon) {
            const newRadius = Number(e.target.value);
            updateBalloonUndoable(selectedBalloon.id, {
                borderRadius: newRadius
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
    const hasCustomPoints = selectedBalloon?.points && selectedBalloon.points.length > 0;

    return (
        <div className="mt-4 pt-3 border-t border-white/10">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-zinc-300 font-semibold uppercase tracking-wide">
                    Edição Vetorial
                </span>
            </div>

            {/* Single Vector Edit Button - Figma style */}
            <button
                onClick={handleToggleVectorEdit}
                disabled={!hasSelectedBalloon}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isVectorEditMode
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                        : hasSelectedBalloon
                            ? 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-zinc-300 hover:border-white/20'
                            : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
                    }`}
            >
                <PenTool size={18} className={isVectorEditMode ? 'text-blue-400' : ''} />
                <div className="flex-1 text-left">
                    <span className="text-[12px] font-medium block">
                        {isVectorEditMode ? 'Editando Vetores' : 'Editar Vetores'}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                        {isVectorEditMode
                            ? 'ESC para sair • Clique em vértice para handles'
                            : 'Mover vértices e editar curvas'}
                    </span>
                </div>
                {isVectorEditMode && (
                    <span className="text-[9px] bg-blue-500/30 text-blue-300 px-2 py-1 rounded font-medium">
                        ATIVO
                    </span>
                )}
            </button>

            {/* Help Panel when active */}
            {isVectorEditMode && (
                <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-white/5 space-y-2">
                    <div className="text-[10px] text-zinc-300 font-medium mb-2 flex items-center gap-2">
                        <span className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
                            <span className="text-[8px]">?</span>
                        </span>
                        Atalhos
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px]">
                        <div className="text-zinc-500">Arrastar ■ vértice</div>
                        <div className="text-zinc-300">Mover ponto</div>

                        <div className="text-zinc-500">Clique em ■ vértice</div>
                        <div className="text-zinc-300">Mostrar handles</div>

                        <div className="text-zinc-500">Arrastar ● handle</div>
                        <div className="text-zinc-300">Ajustar curva</div>

                        <div className="text-zinc-500">Alt + arrastar</div>
                        <div className="text-zinc-300">Handles independentes</div>

                        <div className="text-zinc-500">Duplo-clique em linha</div>
                        <div className="text-zinc-300">Adicionar vértice</div>
                    </div>
                </div>
            )}

            {/* Border Radius Slider - Only for rect balloons without custom points */}
            {!hasCustomPoints && (
                <div className={`mt-4 pt-3 border-t border-white/10 space-y-1.5 transition-opacity ${hasSelectedBalloon ? 'opacity-100' : 'opacity-40 pointer-events-none'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Circle size={12} className="text-zinc-400" />
                        <span className="text-[10px] text-zinc-400 font-medium">Arredondamento</span>
                        <span className="text-[10px] font-bold text-white ml-auto">{currentRadius}px</span>
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
            )}

            {/* Info when balloon has custom points */}
            {hasCustomPoints && hasSelectedBalloon && (
                <div className="mt-3 p-2 bg-white/5 rounded-lg">
                    <p className="text-[9px] text-zinc-500">
                        ℹ️ Forma personalizada. O arredondamento não se aplica.
                    </p>
                </div>
            )}
        </div>
    );
};
