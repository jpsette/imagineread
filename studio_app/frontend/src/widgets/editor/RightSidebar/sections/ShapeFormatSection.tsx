import React from 'react';
import { Square, Circle, Cloud, MessageCircle, Shapes } from 'lucide-react';

import { Balloon } from '@shared/types';
import { useEditorStore } from '@features/editor/store';
import { ColorPicker } from '@features/editor/components/ui/ColorPicker';

interface ShapeFormatSectionProps {
    selectedBalloon: Balloon | undefined;
    hasSelectedBalloon: boolean;
}

export const ShapeFormatSection: React.FC<ShapeFormatSectionProps> = ({ selectedBalloon, hasSelectedBalloon }) => {
    const { updateBalloonUndoable } = useEditorStore();

    const handleShapeChange = (type: Balloon['type']) => {
        if (selectedBalloon) {
            updateBalloonUndoable(selectedBalloon.id, { type });
        }
    };

    return (
        <div className={`space-y-3 transition-opacity duration-200 ${hasSelectedBalloon ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Shapes size={12} /> Formato do Balão
            </label>
            <div className="grid grid-cols-4 gap-1">
                <button
                    onClick={() => handleShapeChange('balloon-square')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-square' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Quadrado"
                    disabled={!hasSelectedBalloon}
                ><Square size={13} /></button>
                <button
                    onClick={() => handleShapeChange('balloon-circle')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-circle' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Redondo"
                    disabled={!hasSelectedBalloon}
                ><Circle size={13} /></button>
                <button
                    onClick={() => handleShapeChange('balloon-thought')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-thought' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Pensamento"
                    disabled={!hasSelectedBalloon}
                ><Cloud size={13} /></button>
                <button
                    onClick={() => handleShapeChange('balloon-shout')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-shout' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Grito"
                    disabled={!hasSelectedBalloon}
                ><MessageCircle size={13} /></button>
            </div>

            {/* Balloon & Line Colors (Side by Side) */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                <ColorPicker
                    label="Cor do Balão"
                    value={selectedBalloon?.color || '#FFFFFF'}
                    onChange={(color) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { color: color || '#FFFFFF' })}
                    disabled={!hasSelectedBalloon}
                />
                <ColorPicker
                    label="Cor da Linha"
                    value={selectedBalloon?.borderColor || '#000000'}
                    onChange={(color) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { borderColor: color || '#000000' })}
                    disabled={!hasSelectedBalloon}
                />
            </div>

            {/* Opacity Control */}
            <div className="mt-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1 flex items-center justify-between">
                    <span>Transparência</span>
                    <span className="text-zinc-400">{Math.round((selectedBalloon?.opacity ?? 1) * 100)}%</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((selectedBalloon?.opacity ?? 1) * 100)}
                    onChange={(e) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { opacity: Number(e.target.value) / 100 })}
                    disabled={!hasSelectedBalloon}
                    className="w-full h-1.5 mt-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
                />
            </div>
        </div>
    );
};
