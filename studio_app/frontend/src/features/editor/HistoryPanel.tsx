import React from 'react';
import { DraggableWindow } from '../../ui/DraggableWindow';
import { useAppStore, HistoryItem } from '../../store/useAppStore';
import { History, RotateCcw, RotateCw, CheckCircle2 } from 'lucide-react';
import { Balloon } from '../../types';

interface HistoryPanelProps {
    onClose: () => void;
    currentBalloons: Balloon[];
    // We need a way to restore history. The store has the function, but it returns the state.
    // The parent/hook needs to handle the state update.
    // Ideally, we pass a callback "onRestore(balloons)"
    onRestore: (balloons: Balloon[]) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onClose, currentBalloons, onRestore }) => {
    const { historyPast, historyFuture, jumpToHistory, undo, redo } = useAppStore();

    const handleJump = (index: number) => {
        const newState = jumpToHistory(index, currentBalloons);
        if (newState) onRestore(newState);
    };

    const handleJumpFuture = (index: number) => {
        // "Jump" to future by redoing N times sequentially
        // This ensures the states are correctly moved from Future to Past
        let state = currentBalloons;
        for (let i = 0; i <= index; i++) {
            const next = redo(state);
            if (next) state = next;
            else break;
        }
        if (state !== currentBalloons) onRestore(state);
    };

    // Flatten list for display: [...past, CURRENT, ...future]
    // But UI usually shows:
    // Step 1
    // Step 2
    // Step 3 (Active)
    // Step 4 (Gray)

    // Step 4 (Gray)

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
                        onClick={() => handleJump(idx)}
                        className="w-full text-left px-3 py-2 hover:bg-[#27272a] text-gray-400 flex items-center gap-2 rounded select-none transition-colors"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        {item.label}
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
                        onClick={() => handleJumpFuture(idx)}
                        className="w-full text-left px-3 py-2 text-gray-500 flex items-center gap-2 rounded select-none hover:bg-[#27272a] hover:text-gray-300 cursor-pointer transition-colors opacity-60 hover:opacity-100"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        {item.label}
                    </button>
                ))}

            </div>

            {/* Quick Undo/Redo Footer */}
            <div className="p-2 border-t border-[#27272a] grid grid-cols-2 gap-2 bg-[#18181b]">
                <button
                    onClick={() => {
                        const state = undo(currentBalloons);
                        if (state) onRestore(state);
                    }}
                    disabled={historyPast.length === 0}
                    className="flex items-center justify-center gap-2 py-2 rounded bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RotateCcw size={14} /> Undo
                </button>
                <button
                    onClick={() => {
                        const state = redo(currentBalloons);
                        if (state) onRestore(state);
                    }}
                    disabled={historyFuture.length === 0}
                    className="flex items-center justify-center gap-2 py-2 rounded bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RotateCw size={14} /> Redo
                </button>
            </div>
        </div>
    );
};
