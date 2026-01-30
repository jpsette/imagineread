import React from 'react';
import { History, RotateCcw, RotateCw, CheckCircle2 } from 'lucide-react';
import { Balloon } from '../../types';

interface HistoryPanelProps {
    onClose: () => void;
    currentBalloons: Balloon[];
    // History arrays passed from parent (EditorView) which has local history source
    historyPast: Balloon[][];
    historyFuture: Balloon[][];

    // Actions
    onRestore: (balloons: Balloon[]) => void;
    onUndo: () => void;
    onRedo: () => void;
    onJumpToPast: (index: number) => void;
    onJumpToFuture: (index: number) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    currentBalloons,
    historyPast = [],
    historyFuture = [],
    onRestore,
    onUndo,
    onRedo,
    onJumpToPast,
    onJumpToFuture
}) => {

    // Helper to get a label for a state (assuming the LAST action pushed created this state)
    // In a real implementation we might store `[{ state, label }]` tuples. 
    // For now, since our local history in EditorView is just `Balloon[][]`, we might not have labels yet.
    // If EditorView doesn't store labels, we can just show "Step X".
    // EDIT: The prompt asked for "Readable labels". 
    // If the local history is just arrays, we might need to assume labels or update local history structure.
    // Let's assume for now we just show "Ação {i}" or generic, unless we change EditorView to store objects.
    // Looking at useAppStore, it stored objects `{ label, state }`.
    // EditorView's local history I implemented before was `setHistoryPast(prev => [...prev, newBalloons])`.
    // I should update EditorView to store `{ label, state }` to be consistent and readable.
    // But first let's implement the Panel to EXPECT objects if possible, or handle raw state.
    // I'll implementation defensively: check if item has label, else "Alteração".

    const getLabel = (item: any, index: number) => {
        if (item && typeof item === 'object' && 'label' in item) return item.label;
        return `Alteração ${index + 1}`;
    };

    const getState = (item: any) => {
        if (item && typeof item === 'object' && 'state' in item) return item.state;
        return item; // Raw balloon array
    };

    return (
        <div className="flex flex-col h-full bg-[#141416] text-xs">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">

                {/* Initial State (Implicit) */}
                <div className="px-3 py-2 text-gray-500 italic flex items-center gap-2">
                    <History size={12} /> Início
                </div>

                {/* PAST */}
                {historyPast.map((item, idx) => (
                    <button
                        key={`past-${idx}`}
                        onClick={() => onJumpToPast(idx)}
                        className="w-full text-left px-3 py-2 hover:bg-[#27272a] text-gray-400 flex items-center gap-2 rounded select-none transition-colors group"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-gray-400" />
                        {getLabel(item, idx)}
                    </button>
                ))}

                {/* CURRENT (Active) */}
                <div className="w-full text-left px-3 py-2 bg-[#27272a] text-white font-bold flex items-center gap-2 rounded border-l-2 border-purple-500 shadow-sm">
                    <CheckCircle2 size={12} className="text-purple-500" />
                    Atual
                </div>

                {/* FUTURE */}
                {historyFuture.map((item, idx) => (
                    <button
                        key={`future-${idx}`}
                        onClick={() => onJumpToFuture(idx)}
                        className="w-full text-left px-3 py-2 text-gray-500 flex items-center gap-2 rounded select-none hover:bg-[#27272a] hover:text-gray-300 cursor-pointer transition-colors opacity-60 hover:opacity-100 group"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 group-hover:bg-gray-400" />
                        {getLabel(item, idx)}
                    </button>
                ))}

            </div>

            {/* Quick Undo/Redo Footer */}
            <div className="p-2 border-t border-[#27272a] grid grid-cols-2 gap-2 bg-[#18181b]">
                <button
                    onClick={onUndo}
                    disabled={historyPast.length === 0}
                    className="flex items-center justify-center gap-2 py-2 rounded bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RotateCcw size={14} /> Undo
                </button>
                <button
                    onClick={onRedo}
                    disabled={historyFuture.length === 0}
                    className="flex items-center justify-center gap-2 py-2 rounded bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RotateCw size={14} /> Redo
                </button>
            </div>
        </div>
    );
};
