import React from 'react';
import { Trash2 } from 'lucide-react';
import { EditMenu } from './menus/EditMenu';
import { useEditorUIStore } from '../uiStore';
import { ToolRegistry } from '../tools/ToolRegistry';
import { SidebarToolButton } from './parts/SidebarToolButton';

interface EditorSidebarProps {
    editProps: any;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
    editProps
}) => {
    const { activeTool, setActiveTool } = useEditorUIStore();

    const coreTools = ToolRegistry.getByCategory('core');
    const shapeTools = ToolRegistry.getByCategory('shape');

    return (
        <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4">

            {/* 1. CORE TOOLS */}
            <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Ferramentas</label>
                <div className="grid grid-cols-2 gap-2">
                    {coreTools.map(tool => (
                        <SidebarToolButton
                            key={tool.id}
                            tool={tool}
                            isActive={activeTool === tool.id}
                            onClick={() => setActiveTool(tool.id)}
                        />
                    ))}
                </div>

                {/* EXTRA ACTIONS (Delete) */}
                <button
                    onClick={() => editProps.onDelete(editProps.selectedId)}
                    disabled={!editProps.selectedId}
                    className="w-full h-9 rounded flex items-center justify-center gap-2 transition-all border text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 disabled:border-transparent disabled:bg-[#333] disabled:text-zinc-600 disabled:cursor-not-allowed"
                    title="Excluir Selecionado (Del)"
                >
                    <Trash2 size={16} />
                    <span>Excluir</span>
                </button>
            </div>

            <div className="h-px bg-[#333]" />

            {/* 2. SHAPE TOOLS (Balloons) */}
            <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Balões</label>
                <div className="grid grid-cols-2 gap-2">
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

            <div className="h-px bg-[#333]" />

            {/* 3. PROPERTIES MENU */}
            <EditMenu {...editProps} />
        </div>
    );
};
