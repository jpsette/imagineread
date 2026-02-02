import React, { useState } from 'react';
import { X, Globe, Loader2, Check } from 'lucide-react';
import { LANGUAGE_INFO } from '@app/store/useTranslationStore';

interface TranslateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetLang: string) => void;
    sourceLang: string | null;
    isTranslating: boolean;
}

// Extended language list with full names
const AVAILABLE_LANGUAGES = [
    { code: 'en', name: 'Inglês', flag: '🇺🇸' },
    { code: 'pt-br', name: 'Português (BR)', flag: '🇧🇷' },
    { code: 'ja', name: 'Japonês', flag: '🇯🇵' },
    { code: 'ko', name: 'Coreano', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinês', flag: '🇨🇳' },
    { code: 'es', name: 'Espanhol', flag: '🇪🇸' },
    { code: 'fr', name: 'Francês', flag: '🇫🇷' },
    { code: 'de', name: 'Alemão', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ar', name: 'Árabe', flag: '🇦🇪' },
];

export const TranslateModal: React.FC<TranslateModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    sourceLang,
    isTranslating
}) => {
    const [selectedLang, setSelectedLang] = useState<string | null>(null);

    if (!isOpen) return null;

    const sourceInfo = LANGUAGE_INFO[sourceLang || ''] || { name: 'Desconhecido', flag: '❓' };

    // Filter out source language from options
    const availableOptions = AVAILABLE_LANGUAGES.filter(lang => lang.code !== sourceLang);

    const handleConfirm = () => {
        if (selectedLang) {
            onConfirm(selectedLang);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-[400px] max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Globe className="text-cyan-400" size={20} />
                        <h2 className="text-white font-semibold">Traduzir Página</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        disabled={isTranslating}
                    >
                        <X size={18} className="text-zinc-400" />
                    </button>
                </div>

                {/* Source Language Info */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
                    <p className="text-xs text-zinc-500 mb-1">Idioma Detectado</p>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{sourceInfo.flag}</span>
                        <span className="text-white font-medium">{sourceInfo.name}</span>
                    </div>
                </div>

                {/* Language Selection */}
                <div className="p-4">
                    <p className="text-xs text-zinc-500 mb-3">Traduzir para:</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {availableOptions.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                disabled={isTranslating}
                                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${selectedLang === lang.code
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                                    } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span className="text-sm font-medium">{lang.name}</span>
                                {selectedLang === lang.code && (
                                    <Check size={14} className="ml-auto text-cyan-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isTranslating}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedLang || isTranslating}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedLang && !isTranslating
                                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                            }`}
                    >
                        {isTranslating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Traduzindo...
                            </>
                        ) : (
                            <>
                                <Globe size={16} />
                                Traduzir
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
