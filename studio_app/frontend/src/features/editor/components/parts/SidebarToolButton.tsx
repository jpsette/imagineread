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
            className={`w-full h-9 rounded flex items-center justify-center gap-2 transition-all border text-xs font-medium ${isActive
                ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                }`}
            title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
        >
            <Icon size={16} />
            <span>{tool.label}</span>
        </button>
    );
};
