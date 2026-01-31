import React from 'react';
import { Square, Circle, Cloud, Zap } from 'lucide-react';

import { EditorTool } from '@shared/types';

import { useEditorUIStore } from '@features/editor/uiStore';
import { EditMenu } from '@features/editor/components/menus/EditMenu';

interface RightSidebarProps {
}

export const RightSidebar: React.FC<RightSidebarProps> = () => {
    const { activeTool, setActiveTool } = useEditorUIStore();

    const tools = [
        { id: 'balloon-square', label: 'Quadrado', icon: <Square size={18} /> },
        { id: 'balloon-circle', label: 'Redondo', icon: <Circle size={18} /> },
        { id: 'balloon-thought', label: 'Pensamento', icon: <Cloud size={18} /> },
        { id: 'balloon-shout', label: 'Grito', icon: <Zap size={18} /> },
    ];

    return (
        <div className="h-full flex flex-col p-1">
            {/* Header */}
            <div className="h-10 border-b border-glass-border flex items-center px-4 shrink-0">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    BALÕES
                </span>
            </div>

            <div className="flex-1 p-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar">

                <div className="space-y-3">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block px-1">Formatos</span>
                    <div className="grid grid-cols-2 gap-3">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id as EditorTool)}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden ${activeTool === tool.id
                                    ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/50 shadow-glow-sm ring-1 ring-neon-blue/20'
                                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200 hover:border-white/10'
                                    }`}
                            >
                                <div className={`relative z-10 transition-transform duration-300 ${activeTool === tool.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {tool.icon}
                                </div>
                                <span className="text-[10px] font-medium z-10">{tool.label}</span>

                                {/* Hover Glow Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advice Card */}
                <div className="mt-2 p-3 bg-neon-blue/5 border border-neon-blue/10 rounded-xl flex items-start gap-2">
                    <div className="w-1 h-full min-h-[1.5rem] rounded-full bg-neon-blue/50" />
                    <p className="text-[10px] text-blue-200/80 leading-relaxed font-medium">
                        Selecione um formato acima e clique na imagem para criar um novo balão.
                    </p>
                </div>
            </div>

            {/* EDIT MENU (Contextual props) */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <EditMenu />
            </div>
        </div>
    );
};
