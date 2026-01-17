import React from 'react';
import {
    MousePointer2, Type as TypeIcon, Trash2, // Edit Icons
} from 'lucide-react';
import { EditMenu } from './menus/EditMenu';

interface EditorSidebarProps {
    editProps: any;
    activeTool: 'select' | 'text';
    setActiveTool: (tool: 'text' | 'select') => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
    editProps,
    activeTool,
    setActiveTool
}) => {
    return (
        <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4">

            {/* COMPACT TOOLBAR */}
            <div>
                <div className="flex gap-1.5 mb-1.5">
                    <button
                        onClick={() => setActiveTool('select')}
                        className={`flex-1 h-9 rounded flex items-center justify-center gap-2 transition-all border text-xs font-medium ${activeTool === 'select'
                            ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                            }`}
                        title="Selecionar e Mover (V)"
                    >
                        <MousePointer2 size={16} />
                        <span>Mover</span>
                    </button>

                    <button
                        onClick={() => editProps.onDelete(editProps.selectedId)}
                        disabled={!editProps.selectedId}
                        className="flex-1 h-9 rounded flex items-center justify-center gap-2 transition-all border text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20 disabled:border-transparent disabled:bg-[#333] disabled:text-zinc-600 disabled:cursor-not-allowed"
                        title="Excluir Selecionado (Del)"
                    >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                    </button>
                </div>

                <button
                    onClick={() => setActiveTool('text')}
                    className={`w-full h-9 rounded flex items-center justify-center gap-2 transition-all border text-xs font-medium ${activeTool === 'text'
                        ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                        }`}
                    title="Adicionar Texto (T)"
                >
                    <TypeIcon size={16} />
                    <span>Novo Texto</span>
                </button>
            </div>

            <div className="h-px bg-[#333]" />

            {/* 2. PROPERTIES MENU */}
            <EditMenu {...editProps} />
        </div>
    );
};
