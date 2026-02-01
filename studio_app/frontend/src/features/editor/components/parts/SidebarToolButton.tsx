import React from 'react';

import { ToolDefinition } from '../../tools/ToolRegistry';

interface SidebarToolButtonProps {
    tool: ToolDefinition;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export const SidebarToolButton: React.FC<SidebarToolButtonProps> = ({
    tool,
    isActive,
    onClick,
    disabled = false
}) => {
    const Icon = tool.icon;
    const isDeleteTool = tool.id === 'delete';

    // Special styling for delete button (always red-tinted, even when disabled)
    const getButtonClasses = () => {
        if (isDeleteTool) {
            if (disabled) {
                // Disabled: faded red but still red
                return 'bg-red-500/5 text-red-500/40 border-red-500/10 cursor-not-allowed';
            }
            return isActive
                ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-1 ring-red-500/30'
                : 'bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500/15 hover:border-red-500/30';
        }
        return isActive
            ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white border-neon-blue/50 shadow-glow-sm ring-1 ring-neon-blue/30'
            : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200 hover:border-white/10';
    };

    const getIconClasses = () => {
        if (isDeleteTool) {
            if (disabled) {
                return 'bg-red-500/5 text-red-500/40';
            }
            return isActive ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-red-500/10 text-red-400';
        }
        return isActive ? 'bg-neon-blue text-white shadow-glow-sm' : 'bg-black/20 text-zinc-500 group-hover:text-zinc-300';
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full h-9 rounded-xl flex items-center justify-start px-3 gap-2 transition-all duration-200 border text-[10px] font-bold uppercase tracking-wider group relative overflow-hidden ${getButtonClasses()}`}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
        >
            {/* Active Indicator Glow */}
            {isActive && !disabled && <div className={`absolute inset-0 ${isDeleteTool ? 'bg-red-500/10' : 'bg-neon-blue/10'} blur-xl`} />}

            {/* Icon Container with subtle glow */}
            <div className={`relative z-10 p-1 rounded-lg transition-colors ${getIconClasses()}`}>
                <Icon size={14} />
            </div>

            {/* Label */}
            <span className="relative z-10">{tool.label}</span>

            {/* Hover Shine Effect */}
            {!disabled && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />}
        </button>
    );
};
