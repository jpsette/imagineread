import React from 'react';
import { X, Save, AlertTriangle, LogOut } from 'lucide-react';
// Button removed

interface UnsavedChangesModalProps {
    isOpen: boolean;
    isSaving: boolean;
    onCancel: () => void;
    onDiscard: () => void;
    onSaveAndExit: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    isOpen,
    isSaving,
    onCancel,
    onDiscard,
    onSaveAndExit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">Alterações não salvas</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Você tem alterações pendentes neste arquivo. Se sair agora, todo o progresso não salvo será perdido permanentemente.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-2">
                    {/* Primary Safe Action: Save and Exit */}
                    <button
                        onClick={onSaveAndExit}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 border border-emerald-500/50"
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                <span>Salvando e Saindo...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Salvar Alterações e Sair</span>
                            </>
                        )}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Destructive Action: Discard */}
                        <button
                            onClick={onDiscard}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 font-medium py-2.5 rounded-lg transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Descartar (Sair)</span>
                        </button>

                        {/* Neutral Action: Cancel */}
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 font-medium py-2.5 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
