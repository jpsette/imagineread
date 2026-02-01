import { Maximize, Square, Type, ImageIcon, Layout, Images } from 'lucide-react';

import { useEditorUIStore } from '@features/editor/uiStore';
import { ToolRegistry } from '@features/editor/tools/ToolRegistry';
import { SidebarToolButton } from '@features/editor/components/parts/SidebarToolButton';
import { EditMenu } from '@features/editor/components/menus/EditMenu';

import { useEditorStore } from '@features/editor/store';

interface EditorSidebarProps {
    onOpenPanelGallery: () => void;
    onCenterPage?: () => void;
}

export const LeftSidebar: React.FC<EditorSidebarProps> = ({ onOpenPanelGallery, onCenterPage }) => {
    const { activeTool, setActiveTool, selectedId } = useEditorUIStore();
    const { removeBalloonUndoable, removePanelUndoable } = useEditorStore();

    const handleDelete = () => {
        if (!selectedId) return;
        if (selectedId.startsWith('panel')) removePanelUndoable(selectedId);
        else removeBalloonUndoable(selectedId);
    };

    const handleToolClick = (toolId: string) => {
        if (toolId === 'delete') {
            // Execute delete action
            handleDelete();
        } else {
            setActiveTool(toolId as any);
        }
    };

    const coreTools = ToolRegistry.getByCategory('core');


    return (
        <div className="flex flex-col gap-3 w-full h-full overflow-y-auto custom-scrollbar p-1">

            {/* 1. CORE TOOLS */}
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Essenciais</label>
                <div className="grid grid-cols-2 gap-3">
                    {coreTools.map(tool => (
                        <SidebarToolButton
                            key={tool.id}
                            tool={tool}
                            isActive={activeTool === tool.id}
                            onClick={() => handleToolClick(tool.id)}
                            disabled={tool.id === 'delete' && !selectedId}
                        />
                    ))}
                </div>

                {/* CENTER PAGE BUTTON (full width) */}
                <button
                    onClick={onCenterPage}
                    className="w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all border text-[10px] font-bold uppercase tracking-wider
                        bg-blue-500/5 hover:bg-blue-500/20 text-blue-400 border-blue-500/10 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    title="Centralizar Página (F)"
                >
                    <Maximize size={14} />
                    <span>Centralizar Página</span>
                </button>
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* 2. VISUALIZATION MENU */}
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Visualização</label>
                <div className="bg-white/5 border border-white/5 rounded-xl p-2 space-y-2">
                    {/* Toggle: Original Image */}
                    <button
                        onClick={useEditorUIStore.getState().toggleVisibility}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${useEditorUIStore(s => s.isOriginalVisible) ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <span className="flex items-center gap-2"><ImageIcon size={14} /> Ver Imagem Original</span>
                        <div className={`w-2 h-2 rounded-full ${useEditorUIStore(s => s.isOriginalVisible) ? 'bg-purple-500' : 'bg-zinc-700'}`} />
                    </button>

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

                    {/* Toggle: Panels/Frames */}
                    <button
                        onClick={() => useEditorUIStore.getState().setShowPanelsLayer(!useEditorUIStore.getState().showPanelsLayer)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${useEditorUIStore(s => s.showPanelsLayer) ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:bg-white/5'}`}
                    >
                        <span className="flex items-center gap-2"><Layout size={14} /> Quadros</span>
                        <div className={`w-2 h-2 rounded-full ${useEditorUIStore(s => s.showPanelsLayer) ? 'bg-orange-500' : 'bg-zinc-700'}`} />
                    </button>

                    {/* Button: Open Panel Gallery */}
                    <button
                        onClick={onOpenPanelGallery}
                        className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    >
                        <span className="flex items-center gap-2"><Images size={14} /> Gerenciar Quadros</span>
                        <div className="w-2 h-2" /> {/* Spacer */}
                    </button>
                </div>
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* 3. EDIT MENU - Text Controls (moved from RightSidebar) */}
            <EditMenu />

        </div>
    );
};
