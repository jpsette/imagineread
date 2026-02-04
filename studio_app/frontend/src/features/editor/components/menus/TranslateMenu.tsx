import React, { useState } from 'react';
import { ImageIcon, Square, Type, Layout, Plus, Loader2, Maximize, BookOpen, ChevronDown, X } from 'lucide-react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useTranslationStore, getLanguageDisplay } from '@app/store/useTranslationStore';
import { useDictionaryStore } from '@app/store/useDictionaryStore';
import { TranslateModal } from '../TranslateModal';
import { Balloon } from '@shared/types';

interface TranslateMenuProps {
    fileId?: string;
    balloons?: Balloon[];
    isTranslating?: boolean;
    onStartTranslate?: (targetLang: string) => void;
    onSwitchLanguage?: (langCode: string | null) => void;
    onCenterPage?: () => void;
    activeLanguage?: string | null;
    hasTranslations?: boolean;
    translations?: { langCode: string }[];
    selectedGlossaryId?: string | null;
    onSelectGlossary?: (id: string | null) => void;
}

export const TranslateMenu: React.FC<TranslateMenuProps> = ({
    fileId,
    balloons = [],
    isTranslating = false,
    onStartTranslate,
    onSwitchLanguage,
    onCenterPage,
    activeLanguage = null,
    hasTranslations = false,
    translations = [],
    selectedGlossaryId = null,
    onSelectGlossary
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showGlossaryDropdown, setShowGlossaryDropdown] = useState(false);

    const { dictionaries } = useDictionaryStore();

    const {
        isOriginalVisible,
        toggleVisibility,
        showBalloons,
        toggleBalloons,
        showText,
        toggleText,
        showPanelsLayer,
        setShowPanelsLayer
    } = useEditorUIStore();

    const { getDetectedLanguage } = useTranslationStore();

    // Get detected language for current file
    const detectedLanguageCode = fileId ? getDetectedLanguage(fileId) : null;
    const originalDisplay = getLanguageDisplay(detectedLanguageCode);

    const handleOpenModal = () => {
        if (!detectedLanguageCode) return;
        setIsModalOpen(true);
    };

    const handleTranslateConfirm = (targetLang: string) => {
        setIsModalOpen(false);
        if (onStartTranslate) {
            onStartTranslate(targetLang);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-3 p-1 pt-4">
                {/* CENTER PAGE BUTTON */}
                <button
                    onClick={onCenterPage}
                    className="w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all border text-[10px] font-bold uppercase tracking-wider
                        bg-blue-500/5 hover:bg-blue-500/20 text-blue-400 border-blue-500/10 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    title="Centralizar Página (F)"
                >
                    <Maximize size={14} />
                    <span>Centralizar Página</span>
                </button>

                <div className="h-px bg-white/5 mx-2" />

                {/* VISUALIZATION SECTION */}
                <div className="space-y-3">
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest px-1">Visualização</label>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-2 space-y-2">
                        {/* Toggle: Original Image */}
                        <button
                            onClick={toggleVisibility}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${isOriginalVisible ? 'bg-purple-500/20 text-purple-400' : 'text-text-muted hover:bg-white/5'}`}
                        >
                            <span className="flex items-center gap-2"><ImageIcon size={14} /> Ver Imagem Original</span>
                            <div className={`w-2 h-2 rounded-full ${isOriginalVisible ? 'bg-purple-500' : 'bg-border-color'}`} />
                        </button>

                        {/* Toggle: Balloons */}
                        <button
                            onClick={toggleBalloons}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${showBalloons ? 'bg-blue-500/20 text-blue-400' : 'text-text-muted hover:bg-white/5'}`}
                        >
                            <span className="flex items-center gap-2"><Square size={14} /> Balões</span>
                            <div className={`w-2 h-2 rounded-full ${showBalloons ? 'bg-blue-500' : 'bg-border-color'}`} />
                        </button>

                        {/* Toggle: Text */}
                        <button
                            onClick={toggleText}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${showText ? 'bg-green-500/20 text-green-400' : 'text-text-muted hover:bg-white/5'}`}
                        >
                            <span className="flex items-center gap-2"><Type size={14} /> Texto</span>
                            <div className={`w-2 h-2 rounded-full ${showText ? 'bg-green-500' : 'bg-border-color'}`} />
                        </button>

                        {/* Toggle: Panels/Frames */}
                        <button
                            onClick={() => setShowPanelsLayer(!showPanelsLayer)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${showPanelsLayer ? 'bg-orange-500/20 text-orange-400' : 'text-text-muted hover:bg-white/5'}`}
                        >
                            <span className="flex items-center gap-2"><Layout size={14} /> Quadros</span>
                            <div className={`w-2 h-2 rounded-full ${showPanelsLayer ? 'bg-orange-500' : 'bg-border-color'}`} />
                        </button>
                    </div>
                </div>

                <div className="h-px bg-white/5 mx-2" />

                {/* TRANSLATION SECTION */}
                <div className="space-y-3">
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest px-1">Tradução</label>

                    {/* Glossary Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowGlossaryDropdown(!showGlossaryDropdown)}
                            className={`w-full h-9 rounded-xl flex items-center justify-between px-3 transition-all border text-[10px] font-medium ${selectedGlossaryId
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                    : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <BookOpen size={14} />
                                {selectedGlossaryId
                                    ? dictionaries.find(d => d.id === selectedGlossaryId)?.name || 'Glossário'
                                    : 'Selecionar Glossário...'
                                }
                            </span>
                            {selectedGlossaryId ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectGlossary?.(null);
                                    }}
                                    className="hover:text-red-400"
                                >
                                    <X size={12} />
                                </button>
                            ) : (
                                <ChevronDown size={14} className={`transition-transform ${showGlossaryDropdown ? 'rotate-180' : ''}`} />
                            )}
                        </button>

                        {/* Dropdown */}
                        {showGlossaryDropdown && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-panel-bg border border-white/10 rounded-xl shadow-xl overflow-hidden">
                                {dictionaries.length === 0 ? (
                                    <p className="p-3 text-xs text-text-muted text-center">Nenhum glossário criado</p>
                                ) : (
                                    dictionaries.map(dict => (
                                        <button
                                            key={dict.id}
                                            onClick={() => {
                                                onSelectGlossary?.(dict.id);
                                                setShowGlossaryDropdown(false);
                                            }}
                                            className={`w-full p-2.5 text-left text-xs hover:bg-white/5 flex items-center justify-between ${selectedGlossaryId === dict.id ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-300'
                                                }`}
                                        >
                                            <span>{dict.name}</span>
                                            <span className="text-text-muted">{dict.entries.length} termos</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Translate Button */}
                    <button
                        onClick={handleOpenModal}
                        disabled={!detectedLanguageCode || isTranslating || balloons.length === 0}
                        className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all border text-[10px] font-bold uppercase tracking-wider ${detectedLanguageCode && !isTranslating && balloons.length > 0
                            ? 'bg-cyan-500/5 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : 'bg-surface/50 text-text-muted border-zinc-700/50 cursor-not-allowed'
                            }`}
                    >
                        {isTranslating ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Traduzindo...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={14} />
                                <span>Adicionar Tradução</span>
                            </>
                        )}
                    </button>

                    {/* Language Status Cards */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-2 space-y-2">
                        {/* Original Language - Clickable */}
                        <button
                            onClick={() => hasTranslations && activeLanguage !== null && onSwitchLanguage?.(null)}
                            disabled={!hasTranslations || activeLanguage === null}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${activeLanguage === null && hasTranslations
                                ? 'bg-cyan-500/20 border border-cyan-500/50'
                                : hasTranslations
                                    ? 'hover:bg-white/5 cursor-pointer border border-transparent'
                                    : 'border border-transparent cursor-default'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{originalDisplay.flag}</span>
                                <div className="text-left">
                                    <p className="text-[10px] text-text-muted">Original</p>
                                    <p className="text-xs font-medium text-white">{originalDisplay.name}</p>
                                </div>
                            </div>
                            {activeLanguage === null && hasTranslations && (
                                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            )}
                        </button>

                        {/* All Translated Languages - Clickable */}
                        {translations.map((translation) => {
                            const display = getLanguageDisplay(translation.langCode);
                            const isActive = activeLanguage === translation.langCode;

                            return (
                                <button
                                    key={translation.langCode}
                                    onClick={() => !isActive && onSwitchLanguage?.(translation.langCode)}
                                    disabled={isActive}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${isActive
                                        ? 'bg-green-500/20 border border-green-500/50'
                                        : 'hover:bg-white/5 cursor-pointer border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{display.flag}</span>
                                        <div className="text-left">
                                            <p className="text-[10px] text-text-muted">Traduzido</p>
                                            <p className="text-xs font-medium text-white">{display.name}</p>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                    )}
                                </button>
                            );
                        })}

                        {!detectedLanguageCode && (
                            <p className="text-[10px] text-zinc-600 px-2">
                                Execute a vetorização para detectar o idioma automaticamente.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Translation Modal */}
            <TranslateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleTranslateConfirm}
                sourceLang={detectedLanguageCode}
                isTranslating={isTranslating}
            />
        </>
    );
};
