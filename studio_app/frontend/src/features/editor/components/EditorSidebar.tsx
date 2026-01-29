import React from 'react';
import { Trash2, Square, Type, ScanFace } from 'lucide-react';
import { EditMenu } from './menus/EditMenu';
import { useEditorUIStore } from '../uiStore';
import { ToolRegistry } from '../tools/ToolRegistry';
import { SidebarToolButton } from './parts/SidebarToolButton';

import { useEditorStore } from '../store';

interface EditorSidebarProps {
    // No more props needed!
}

export const EditorSidebar: React.FC<EditorSidebarProps> = () => {
    const { activeTool, setActiveTool, selectedId } = useEditorUIStore();
    const { removeBalloon, removePanel } = useEditorStore();

    const handleDelete = () => {
        if (!selectedId) return;
        if (selectedId.startsWith('panel')) removePanel(selectedId);
        else removeBalloon(selectedId);
    };

    const coreTools = ToolRegistry.getByCategory('core');
    const shapeTools = ToolRegistry.getByCategory('shape');

    return (
        <div className="flex flex-col gap-6 w-full h-full overflow-y-auto custom-scrollbar pt-2 pb-6">

            {/* 1. CORE TOOLS */}
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Ferramentas</label>
                <div className="grid grid-cols-2 gap-3">
                    {coreTools.map(tool => (
                        <SidebarToolButton
                            key={tool.id}
                            tool={tool}
                            isActive={activeTool === tool.id}
                            onClick={() => setActiveTool(tool.id)}
                        // We might need to update SidebarToolButton component if it has hardcoded styles. 
                        // Assuming it accepts className or we wrap it. 
                        // Actually, looking at the file list, SidebarToolButton is in parts/. 
                        // I should probably check if I need to refactor that too. 
                        // For now, I'll rely on global class overrides or assume it passes props down well.
                        // But to be safe, I'm wrapping it or expecting it to use standard classes.
                        // Let's refector the styles passed here if possible, or just the container.
                        />
                    ))}
                </div>

                {/* EXTRA ACTIONS (Delete) - Styled as a danger zone item */}
                <button
                    onClick={handleDelete}
                    disabled={!selectedId}
                    className="w-full h-10 rounded-xl flex items-center justify-center gap-2 transition-all border text-xs font-bold uppercase tracking-wider
                        bg-red-500/5 hover:bg-red-500/20 text-red-500 border-red-500/10 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]
                        disabled:border-transparent disabled:bg-white/5 disabled:text-zinc-600 disabled:cursor-not-allowed disabled:shadow-none"
                    title="Excluir Selecionado (Del)"
                >
                    <Trash2 size={16} />
                    <span>Excluir</span>
                </button>
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* 2. SHAPE TOOLS (Balloons) */}
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Balões</label>
                <div className="grid grid-cols-2 gap-3">
                    {shapeTools.map(tool => (
                        <SidebarToolButton
                            key={tool.id}
                            tool={tool}
                            isActive={activeTool === tool.id}
                            onClick={() => setActiveTool(tool.id)}
                        />
                    ))}
                </div>
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* 3. VISUALIZATION MENU (NEW) */}
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Visualização</label>
                <div className="bg-white/5 border border-white/5 rounded-xl p-2 space-y-2">
                    {/* Toggle: Balloons */}
                    <button
                        onClick={useEditorUIStore.getState().toggleBalloons}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${useEditorUIStore(s => s.showBalloons) ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <span className="flex items-center gap-2"><Square size={14} /> Balões</span>
                        <div className={`w-2 h-2 rounded-full ${useEditorUIStore(s => s.showBalloons) ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                    </button>

                    {/* Toggle: Text */}
                    <button
                        onClick={useEditorUIStore.getState().toggleText}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${useEditorUIStore(s => s.showText) ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <span className="flex items-center gap-2"><Type size={14} /> Texto</span>
                        <div className={`w-2 h-2 rounded-full ${useEditorUIStore(s => s.showText) ? 'bg-green-500' : 'bg-zinc-700'}`} />
                    </button>

                    {/* Toggle: Masks (THE OLHINHO FOR EDITING) */}
                    <button
                        onClick={useEditorUIStore.getState().toggleMasks}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${useEditorUIStore(s => s.showMasks) ? 'bg-red-500/20 text-red-500' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <span className="flex items-center gap-2"><ScanFace size={14} /> Máscaras (Editar)</span>
                        <div className={`w-2 h-2 rounded-full ${useEditorUIStore(s => s.showMasks) ? 'bg-red-500' : 'bg-zinc-700'}`} />
                    </button>
                </div>
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* 4. PROPERTIES MENU */}
            <EditMenu />
        </div>
    );
};
