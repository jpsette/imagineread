import React from 'react';
import { Square, Circle, Cloud, Zap, Upload, MousePointer2 } from 'lucide-react';

import { EditorTool, Balloon } from '@shared/types';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';
import { parseSvgFileComplete } from '@features/editor/utils/svgParser';

interface ToolsSectionProps {
    balloons: Balloon[];
    activeTool: EditorTool;
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({ balloons, activeTool }) => {
    const { setActiveTool, setSelectedIds } = useEditorUIStore();
    const { addBalloonUndoable } = useEditorStore();

    const handleSelectAll = () => {
        const allBalloonIds = balloons.map(b => b.id);
        setSelectedIds(allBalloonIds);
    };

    const handleSvgImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { dataUrl, viewBox } = await parseSvgFileComplete(file);
            const newBalloon: Balloon = {
                id: `svg-${Date.now()}`,
                type: 'balloon-custom',
                customSvg: '',
                svgViewBox: viewBox,
                svgDataUrl: dataUrl,
                x: 100,
                y: 100,
                width: viewBox.width,
                height: viewBox.height,
                box_2d: [100, 100, 100 + viewBox.width, 100 + viewBox.height],
                shape: 'rectangle',
                text: '',
                fontSize: 14,
                fontFamily: 'Comic Neue',
                textColor: '#000000',
                color: 'transparent',
            };
            addBalloonUndoable(newBalloon);
            setSelectedIds([newBalloon.id]);
        } catch (err) {
            console.error("Failed to parse SVG:", err);
            alert("Erro ao importar SVG. Verifique se é um arquivo válido.");
        }
        e.target.value = '';
    };

    const tools = [
        { id: 'balloon-square', label: 'Quadrado', icon: <Square size={18} /> },
        { id: 'balloon-circle', label: 'Redondo', icon: <Circle size={18} /> },
        { id: 'balloon-thought', label: 'Pensamento', icon: <Cloud size={18} /> },
        { id: 'balloon-shout', label: 'Grito', icon: <Zap size={18} /> },
    ];

    return (
        <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Ferramentas</label>

            {/* Import SVG Button */}
            <label
                className="w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all border text-[10px] font-bold uppercase tracking-wider cursor-pointer
                    bg-purple-500/5 hover:bg-purple-500/20 text-purple-400 border-purple-500/10 hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]
                    active:bg-purple-500/30 active:scale-[0.98]"
                title="Importar SVG Personalizado"
            >
                <input type="file" accept=".svg" className="hidden" onChange={handleSvgImport} />
                <Upload size={14} />
                <span>Importar SVG</span>
            </label>

            {/* Select All Button */}
            <button
                onClick={handleSelectAll}
                disabled={balloons.length === 0}
                className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-colors border text-[10px] font-bold uppercase tracking-wider
                    bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700
                    disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800 disabled:cursor-not-allowed`}
                title="Selecionar Todos (Ctrl+A)"
            >
                <MousePointer2 size={14} />
                <span>Selecionar Todos</span>
            </button>

            {/* Create Balloon - Compact Buttons */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                    Criar Balão
                </label>
                <div className="grid grid-cols-4 gap-1">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id as EditorTool)}
                            className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${activeTool === tool.id ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                            title={tool.label}
                        >
                            {React.cloneElement(tool.icon, { size: 13 })}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
