import React from 'react';
import { Square, Circle, Cloud, Zap, MessageCircle, Shapes, Upload, MousePointer2 } from 'lucide-react';

import { EditorTool, Balloon } from '@shared/types';

import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';
import { parseSvgFileComplete } from '@features/editor/utils/svgParser';
import { ColorPicker } from '@features/editor/components/ui/ColorPicker';

interface RightSidebarProps {
}

// Toggle button for vertex editing mode
const VertexToggleButton: React.FC = () => {
    const { vertexEditingEnabled, toggleVertexEditing } = useEditorUIStore();

    return (
        <button
            onClick={toggleVertexEditing}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${vertexEditingEnabled
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-white/10 text-zinc-400 border border-white/10 hover:bg-white/20'
                }`}
        >
            {vertexEditingEnabled ? 'ON' : 'OFF'}
        </button>
    );
};

// Toggle button for curve editing mode
const CurveToggleButton: React.FC = () => {
    const { curveEditingEnabled, toggleCurveEditing } = useEditorUIStore();

    return (
        <button
            onClick={toggleCurveEditing}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${curveEditingEnabled
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/10 text-zinc-400 border border-white/10 hover:bg-white/20'
                }`}
        >
            {curveEditingEnabled ? 'ON' : 'OFF'}
        </button>
    );
};

export const RightSidebar: React.FC<RightSidebarProps> = () => {
    const { activeTool, setActiveTool, selectedId, setSelectedIds } = useEditorUIStore();
    const { balloons, updateBalloonUndoable, addBalloonUndoable } = useEditorStore();

    // Find selected balloon
    const selectedBalloon = balloons.find(b => b.id === selectedId);
    const hasSelectedBalloon = !!selectedBalloon;

    // Handle Select All - selects all balloons
    const handleSelectAll = () => {
        const allBalloonIds = balloons.map(b => b.id);
        setSelectedIds(allBalloonIds);
    };

    // Handle shape change for selected balloon
    const handleShapeChange = (type: Balloon['type']) => {
        if (selectedBalloon) {
            updateBalloonUndoable(selectedBalloon.id, { type });
        }
    };

    // Handle SVG Import - Creates a new element with the COMPLETE imported SVG
    const handleSvgImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Use the complete SVG parser to preserve all details
            const { dataUrl, viewBox } = await parseSvgFileComplete(file);

            // Create a new balloon with the complete SVG as image
            const newBalloon: Balloon = {
                id: `svg-${Date.now()}`,
                type: 'balloon-custom',
                customSvg: '', // Not using path anymore
                svgViewBox: viewBox,
                svgDataUrl: dataUrl, // Store the complete SVG as data URL
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
                color: 'transparent', // Transparent background for SVG
            };

            // Add the new element
            addBalloonUndoable(newBalloon);

            // Select the new element
            setSelectedIds([newBalloon.id]);

        } catch (err) {
            console.error("Failed to parse SVG:", err);
            alert("Erro ao importar SVG. Verifique se é um arquivo válido.");
        }

        // Reset input
        e.target.value = '';
    };

    const tools = [
        { id: 'balloon-square', label: 'Quadrado', icon: <Square size={18} /> },
        { id: 'balloon-circle', label: 'Redondo', icon: <Circle size={18} /> },
        { id: 'balloon-thought', label: 'Pensamento', icon: <Cloud size={18} /> },
        { id: 'balloon-shout', label: 'Grito', icon: <Zap size={18} /> },
    ];

    return (
        <div className="flex flex-col gap-3 w-full h-full overflow-y-auto custom-scrollbar p-1">

            {/* BALLOON TOOLS */}
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

            {/* Separator */}
            <div className="h-px bg-white/5 mx-2" />

            {/* BALLOON FORMAT - Only visible when a balloon is selected */}
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

                {/* Line Style Control */}
                <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium flex-1">Estilo da Linha</span>
                    <div className="flex gap-1">
                        {[
                            { value: 'solid', label: '━━━', title: 'Lisa' },
                            { value: 'dashed', label: '╍╍╍', title: 'Tracejada' },
                            { value: 'dotted', label: '•••', title: 'Pontilhada' }
                        ].map((style) => (
                            <button
                                key={style.value}
                                onClick={() => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, {
                                    borderStyle: style.value as any,
                                    // Reset dash values when changing style so each style uses its defaults
                                    dashSize: undefined,
                                    dashGap: undefined
                                })}
                                disabled={!hasSelectedBalloon}
                                title={style.title}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${(selectedBalloon?.borderStyle || 'solid') === style.value
                                    ? 'bg-neon-blue/30 text-white border border-neon-blue/50'
                                    : 'bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Line Customization Sliders - Always visible */}
                <div className="mt-2 space-y-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2">
                    {/* Line Width */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-medium flex-1">Espessura</span>
                        <input
                            type="range"
                            min="0" max="20" step="1"
                            value={selectedBalloon?.borderWidth ?? 1}
                            onChange={(e) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { borderWidth: Number(e.target.value) })}
                            className="w-24 h-1 accent-neon-blue"
                            disabled={!hasSelectedBalloon}
                        />
                        <span className="text-[10px] text-white font-bold w-6 text-center">
                            {selectedBalloon?.borderWidth ?? 1}
                        </span>
                    </div>
                    {/* Dash Size */}
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium flex-1 ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-zinc-400' : 'text-zinc-600'}`}>Tamanho</span>
                        <input
                            type="range"
                            min="0" max="20" step="1"
                            value={selectedBalloon?.dashSize ?? (selectedBalloon?.borderStyle === 'dotted' ? 2 : 8)}
                            onChange={(e) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { dashSize: Number(e.target.value) })}
                            className="w-24 h-1 accent-neon-blue disabled:opacity-30"
                            disabled={!hasSelectedBalloon || !selectedBalloon?.borderStyle || selectedBalloon.borderStyle === 'solid'}
                        />
                        <span className={`text-[10px] font-bold w-6 text-center ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-white' : 'text-zinc-600'}`}>
                            {selectedBalloon?.dashSize ?? (selectedBalloon?.borderStyle === 'dotted' ? 2 : 8)}
                        </span>
                    </div>
                    {/* Dash Gap */}
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium flex-1 ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-zinc-400' : 'text-zinc-600'}`}>Espaçamento</span>
                        <input
                            type="range"
                            min="0" max="20" step="1"
                            value={selectedBalloon?.dashGap ?? (selectedBalloon?.borderStyle === 'dotted' ? 4 : 4)}
                            onChange={(e) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { dashGap: Number(e.target.value) })}
                            className="w-24 h-1 accent-neon-blue disabled:opacity-30"
                            disabled={!hasSelectedBalloon || !selectedBalloon?.borderStyle || selectedBalloon.borderStyle === 'solid'}
                        />
                        <span className={`text-[10px] font-bold w-6 text-center ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-white' : 'text-zinc-600'}`}>
                            {selectedBalloon?.dashGap ?? (selectedBalloon?.borderStyle === 'dotted' ? 4 : 4)}
                        </span>
                    </div>
                </div>

                {/* Stroke Alignment Control */}
                <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium flex-1">Expansão da Linha</span>
                    <div className="flex gap-1">
                        {[
                            { value: 'inner', label: 'Int', title: 'Interno - Linha expande para dentro' },
                            { value: 'center', label: 'Cen', title: 'Central - Linha expande para dentro e fora' },
                            { value: 'outer', label: 'Ext', title: 'Externo - Linha expande para fora' }
                        ].map((align) => (
                            <button
                                key={align.value}
                                onClick={() => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { strokeAlign: align.value as any })}
                                disabled={!hasSelectedBalloon}
                                title={align.title}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${(selectedBalloon?.strokeAlign || 'center') === align.value
                                    ? 'bg-neon-blue/30 text-white border border-neon-blue/50'
                                    : 'bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                {align.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vertex Editing Section */}
                <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-zinc-300 font-semibold uppercase tracking-wide">Vértices</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2">
                        <span className="text-[10px] text-zinc-400 font-medium flex-1">Editar Vértices</span>
                        <VertexToggleButton />
                    </div>
                    <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2">
                        <span className="text-[10px] text-zinc-400 font-medium flex-1">Curvar Arestas</span>
                        <CurveToggleButton />
                    </div>
                </div>
            </div>
        </div>
    );
};
