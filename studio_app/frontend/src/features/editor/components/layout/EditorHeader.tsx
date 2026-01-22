import React from 'react';
import { Save, ArrowLeft, X, Undo, Redo } from 'lucide-react';
import { useEditorUIStore } from '../../uiStore';
import { useEditorStore } from '../../store';
import { editorModes } from '../../tools/definitions/editorModes';
import { EditorMode } from '../../../../types';

interface EditorHeaderProps {
    onBack: () => void;
    onSave: () => void;
    onClose: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
    onBack,
    onSave,
    onClose
}) => {
    const { activeMode, setActiveMode } = useEditorUIStore();
    const tabs = editorModes;

    return (
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900 shrink-0 z-50 relative">
            {/* LEFT: Back Button */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    <ArrowLeft size={16} />
                    <span>Voltar</span>
                </button>
            </div>

            {/* CENTER: Navigation Tabs */}
            <nav
                className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800"
                style={{ WebkitAppRegion: 'no-drag' } as any}
            >
                {tabs.map((tab) => {
                    const isActive = activeMode === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveMode(tab.key as EditorMode)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${isActive
                                ? 'bg-zinc-800 text-blue-400 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-3">

                {/* UNDO / REDO */}
                <div className="flex items-center gap-1 mr-2 border-r border-zinc-800 pr-4 h-6">
                    <button
                        onClick={() => useEditorStore.temporal.getState().undo()}
                        className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-1.5 transition-colors"
                        title="Desfazer (Ctrl+Z)"
                    >
                        <Undo size={18} />
                    </button>
                    <button
                        onClick={() => useEditorStore.temporal.getState().redo()}
                        className="text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-1.5 transition-colors"
                        title="Refazer (Ctrl+Shift+Z)"
                    >
                        <Redo size={18} />
                    </button>
                </div>

                <button
                    onClick={() => {
                        console.log("🖱️ [UI] Botão Salvar Clicado");
                        onSave();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    <Save size={16} />
                    <span>Salvar</span>
                </button>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-white p-2 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-800"
                    title="Fechar Editor"
                    style={{ WebkitAppRegion: 'no-drag', cursor: 'pointer' } as any}
                >
                    <X size={20} />
                </button>
            </div>
        </header>
    );
};
