import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ToolDefinition } from '../../tools/ToolRegistry';

interface SidebarToolButtonProps {
    tool: ToolDefinition;
    isActive: boolean;
    onClick: () => void;
}

export const SidebarToolButton: React.FC<SidebarToolButtonProps> = ({
    tool,
    isActive,
    onClick
}) => {
    const Icon = tool.icon;

    return (
        <button
            onClick={onClick}
            className={`w-full h-12 rounded-xl flex items-center justify-start px-4 gap-3 transition-all duration-200 border text-xs font-bold uppercase tracking-wider group relative overflow-hidden ${isActive
                ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white border-neon-blue/50 shadow-glow-sm ring-1 ring-neon-blue/30'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200 hover:border-white/10'
                }`}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
        >
            {/* Active Indicator Glow */}
            {isActive && <div className="absolute inset-0 bg-neon-blue/10 blur-xl" />}

            {/* Icon Container with subtle glow */}
            <div className={`relative z-10 p-1.5 rounded-lg transition-colors ${isActive ? 'bg-neon-blue text-white shadow-glow-sm' : 'bg-black/20 text-zinc-500 group-hover:text-zinc-300'}`}>
                <Icon size={18} />
            </div>

            {/* Label */}
            <span className="relative z-10">{tool.label}</span>

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </button>
    );
};
