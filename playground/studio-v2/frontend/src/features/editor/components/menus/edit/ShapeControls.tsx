import React from 'react';
import { Square, Circle, Cloud, MessageCircle, Upload, Shapes } from 'lucide-react';
import { Balloon } from '@shared/types';

interface ShapeControlsProps {
    selectedBalloon: Balloon | undefined;
    isDisabled: boolean;
    handleShapeChange: (type: Balloon['type']) => void;
    handleSvgImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ShapeControls: React.FC<ShapeControlsProps> = ({
    selectedBalloon,
    isDisabled,
    handleShapeChange,
    handleSvgImport
}) => {
    return (
        <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                <Shapes size={12} /> Formato
            </label>
            <div className="grid grid-cols-5 gap-1">
                <button
                    onClick={() => handleShapeChange('balloon-square')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-square' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Quadrado"
                    disabled={isDisabled}
                ><Square size={13} /></button>
                <button
                    onClick={() => handleShapeChange('balloon-circle')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-circle' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Redondo"
                    disabled={isDisabled}
                ><Circle size={13} /></button>
                <button
                    onClick={() => handleShapeChange('balloon-thought')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-thought' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Pensamento"
                    disabled={isDisabled}
                ><Cloud size={13} /></button>
                <button
                    onClick={() => handleShapeChange('balloon-shout')}
                    className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-shout' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                    title="Grito"
                    disabled={isDisabled}
                ><MessageCircle size={13} /></button>

                {/* SVG Import Button */}
                <label className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer ${selectedBalloon?.type === 'balloon-custom' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`} title="Importar SVG">
                    <input type="file" accept=".svg" className="hidden" onChange={handleSvgImport} disabled={isDisabled} />
                    <Upload size={13} />
                </label>
            </div>
        </div>
    );
};
