import React, { useState, useEffect, useRef } from 'react';
import { Save, ArrowLeft, X, Undo, Redo, Check, Loader2 } from 'lucide-react';
import { useEditorUIStore } from '../../uiStore';
import { useEditorStore } from '../../store';
import { editorModes } from '../../tools/definitions/editorModes';
import { EditorMode } from '../../../../types';

interface EditorHeaderProps {
    onBack: () => void;
    onSave: () => Promise<void>;
    onClose: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
    onBack,
    onSave,
    onClose
}) => {
    const { activeMode, setActiveMode } = useEditorUIStore();
    const tabs = editorModes;

    // --- SMART SAVE STATE ---
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Subscribe to Store Changes to detect "Dirty" state
    const balloons = useEditorStore(state => state.balloons);
    const panels = useEditorStore(state => state.panels);
    // Track first run to avoid setting dirty on mount
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        // If content changes and we are 'saved', revert to 'idle' (dirty)
        if (saveStatus === 'saved') {
            setSaveStatus('idle');
        }
    }, [balloons, panels]);

    const handleSmartSave = async () => {
        if (saveStatus === 'saving') return;

        setSaveStatus('saving');
        // Retrieve promise from prop
        await onSave();

        // Transition to Saved
        setSaveStatus('saved');
    };

    return (
        <header className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none">

            {/* ISLAND CONTAINER */}
            <div className="flex items-center gap-1 p-1.5 rounded-full border border-glass-border bg-black/60 backdrop-blur-md shadow-glow-sm pointer-events-auto transition-all duration-300">

                {/* LEFT: Back Button (Mini Pill) */}
                <button
                    onClick={onBack}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 mr-1"
                    title="Voltar para a Galeria"
                >
                    <ArrowLeft size={16} />
                </button>

                {/* DIVIDER */}
                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* CENTER: Navigation Tabs (The Core Tabs) */}
                <nav className="flex items-center gap-1">
                    {tabs.map((tab) => {
                        const isActive = activeMode === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveMode(tab.key as EditorMode)}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 ${isActive
                                    ? 'bg-zinc-800 text-neon-blue shadow-glow-sm ring-1 ring-white/5'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* DIVIDER */}
                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* UNDO / REDO (Integrated into Island) */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => useEditorStore.temporal.getState().undo()}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title="Desfazer (Ctrl+Z)"
                    >
                        <Undo size={14} />
                    </button>
                    <button
                        onClick={() => useEditorStore.temporal.getState().redo()}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                        title="Refazer (Ctrl+Shift+Z)"
                    >
                        <Redo size={14} />
                    </button>
                </div>

                {/* DIVIDER */}
                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* ACTIONS GROUP (Integrated) */}
                <div className="flex items-center gap-2 pl-1">
                    <button
                        onClick={handleSmartSave}
                        disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 ${saveStatus === 'saved'
                                ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                                : saveStatus === 'saving'
                                    ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 cursor-wait'
                                    : 'bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-white hover:shadow-glow-md'
                            }`}
                    >
                        {saveStatus === 'saved' ? (
                            <Check size={14} className="animate-in zoom-in spin-in-50 duration-300" />
                        ) : saveStatus === 'saving' ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Save size={14} className="group-hover:scale-110 transition-transform" />
                        )}

                        <span className="hidden sm:inline w-12 text-center">
                            {saveStatus === 'saved' ? 'Salvo' : saveStatus === 'saving' ? '...' : 'Salvar'}
                        </span>
                    </button>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-95"
                        title="Fechar Editor"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

        </header>
    );
};
