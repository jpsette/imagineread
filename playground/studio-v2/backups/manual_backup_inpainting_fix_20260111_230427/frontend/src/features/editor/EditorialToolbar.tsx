import React from 'react';
import { Undo2, Redo2, History, Palette, Type, MessageSquare, Eye, EyeOff } from 'lucide-react';

interface EditorialToolbarProps {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    isHidden: boolean;
    onToggleHidden: () => void;

    windowsState: {
        history: boolean;
        style: boolean;
        text: boolean;
        shape: boolean;
    };
    toggleWindow: (key: 'history' | 'style' | 'text' | 'shape') => void;
}

export const EditorialToolbar: React.FC<EditorialToolbarProps> = ({
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isHidden,
    onToggleHidden,
    windowsState,
    toggleWindow
}) => {
    return (
        <div className="h-16 w-full border-b border-[#27272a] bg-[#141416] flex items-center justify-center gap-4 px-4 shrink-0 animate-slideDown origin-top">

            {/* Group 1: History Actions */}
            <div className="flex items-center gap-1 bg-[#27272a] rounded-lg p-1">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-1.5 rounded transition-colors ${!canUndo ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}`}
                    title="Desfazer (Ctrl+Z)"
                >
                    <Undo2 size={16} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-1.5 rounded transition-colors ${!canRedo ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-[#3f3f46]'}`}
                    title="Refazer (Ctrl+Shift+Z)"
                >
                    <Redo2 size={16} />
                </button>
            </div>

            <div className="w-px h-6 bg-[#27272a]" />

            {/* Group 2: Visibility Toggle */}
            <button
                onClick={onToggleHidden}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isHidden ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-300 hover:bg-[#27272a] hover:text-white'}`}
            >
                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                {isHidden ? 'Oculto' : 'Visível'}
            </button>

            <div className="w-px h-6 bg-[#27272a]" />

            {/* Group 3: Window Toggles */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => toggleWindow('history')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${windowsState.history ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#27272a]'}`}
                >
                    <History size={14} /> Histórico
                </button>

                <button
                    onClick={() => toggleWindow('style')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${windowsState.style ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#27272a]'}`}
                >
                    <Palette size={14} /> Estilo
                </button>

                <button
                    onClick={() => toggleWindow('text')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${windowsState.text ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#27272a]'}`}
                >
                    <Type size={14} /> Texto
                </button>

                <button
                    onClick={() => toggleWindow('shape')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${windowsState.shape ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#27272a]'}`}
                >
                    <MessageSquare size={14} /> Forma
                </button>
            </div>

        </div>
    );
};
