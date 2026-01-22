import React from 'react';
import { Square, Circle, Cloud, Zap } from 'lucide-react';

import { EditorTool } from '../../../../types';

import { useEditorUIStore } from '../uiStore';

interface RightSidebarProps {
    width: number;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ width }) => {
    const { activeTool, setActiveTool } = useEditorUIStore();

    const tools = [
        { id: 'balloon-square', label: 'Quadrado', icon: <Square size={18} /> },
        { id: 'balloon-circle', label: 'Redondo', icon: <Circle size={18} /> },
        { id: 'balloon-thought', label: 'Pensamento', icon: <Cloud size={18} /> },
        { id: 'balloon-shout', label: 'Grito', icon: <Zap size={18} /> },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-12 border-b border-[#333] flex items-center px-4 shrink-0 bg-[#2d2d2d]">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    BALÕES
                </span>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Formatos</span>

                <div className="grid grid-cols-2 gap-3">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all ${activeTool === tool.id
                                ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50 shadow-md'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
                                }`}
                        >
                            {tool.icon}
                            <span className="text-[10px] font-medium">{tool.label}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-200 leading-relaxed">
                    <strong>Dica:</strong> Selecione um formato e clique na imagem para criar.
                </div>
            </div>
        </div>
    );
};
