/**
 * Translation Store
 * 
 * Manages translation-related state including:
 * - Detected original language
 * - Multiple translations per file
 * - Active language selection
 * - Translation settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// A single translation entry
interface TranslationEntry {
    langCode: string;                    // Target language code (e.g., 'en', 'es')
    texts: Record<string, string>;       // balloonId -> translated text
}

// All translations for a file
interface FileTranslations {
    original: Record<string, string>;    // balloonId -> original text
    translations: TranslationEntry[];    // Array of translations
}

interface TranslationState {
    // The detected language of the current page (per file)
    detectedLanguages: Record<string, string>; // fileId -> language code

    // Currently active language code: null = original, string = translated lang code
    activeLanguage: Record<string, string | null>; // fileId -> active langCode (null = original)

    // All translations per file
    fileTranslations: Record<string, FileTranslations>; // fileId -> { original, translations[] }

    // Target languages for translation
    targetLanguages: string[];

    // Selected glossary ID
    selectedGlossaryId: string | null;

    // Actions
    setDetectedLanguage: (fileId: string, languageCode: string) => void;
    getDetectedLanguage: (fileId: string) => string | null;
    storeOriginalTexts: (fileId: string, texts: Record<string, string>) => void;
    addTranslation: (fileId: string, langCode: string, texts: Record<string, string>) => void;
    getTranslations: (fileId: string) => TranslationEntry[];
    getTextsForLanguage: (fileId: string, langCode: string | null) => Record<string, string> | null;
    setActiveLanguage: (fileId: string, langCode: string | null) => void;
    getActiveLanguage: (fileId: string) => string | null;
    hasTranslations: (fileId: string) => boolean;
    hasTranslationFor: (fileId: string, langCode: string) => boolean;
    setTargetLanguages: (languages: string[]) => void;
    addTargetLanguage: (language: string) => void;
    removeTargetLanguage: (language: string) => void;
    setSelectedGlossaryId: (id: string | null) => void;
    clearDetectedLanguage: (fileId: string) => void;
    clearTranslations: (fileId: string) => void;
}

// Language display info (synced with backend)
export const LANGUAGE_INFO: Record<string, { name: string; flag: string }> = {
    'ja': { name: 'Japonês', flag: '🇯🇵' },
    'en': { name: 'Inglês', flag: '🇺🇸' },
    'pt': { name: 'Português', flag: '🇵🇹' },
    'pt-br': { name: 'Português (BR)', flag: '🇧🇷' },
    'es': { name: 'Espanhol', flag: '🇪🇸' },
    'de': { name: 'Alemão', flag: '🇩🇪' },
    'fr': { name: 'Francês', flag: '🇫🇷' },
    'it': { name: 'Italiano', flag: '🇮🇹' },
    'ko': { name: 'Coreano', flag: '🇰🇷' },
    'zh': { name: 'Chinês', flag: '🇨🇳' },
    'ar': { name: 'Árabe', flag: '🇸🇦' },
    'ar-ae': { name: 'Árabe (EAU)', flag: '🇦🇪' },
};

export const getLanguageDisplay = (code: string | null): { name: string; flag: string } => {
    if (!code) return { name: 'Não detectado', flag: '❓' };
    return LANGUAGE_INFO[code] || { name: code.toUpperCase(), flag: '🌐' };
};

export const useTranslationStore = create<TranslationState>()(
    persist(
        (set, get) => ({
            detectedLanguages: {},
            activeLanguage: {},
            fileTranslations: {},
            targetLanguages: [],
            selectedGlossaryId: null,

            setDetectedLanguage: (fileId, languageCode) => {
                console.log(`🌐 [TranslationStore] Saving detected language: ${languageCode} for file: ${fileId}`);
                set((state) => ({
                    detectedLanguages: {
                        ...state.detectedLanguages,
                        [fileId]: languageCode
                    }
                }));
            },

            getDetectedLanguage: (fileId) => {
                return get().detectedLanguages[fileId] || null;
            },

            storeOriginalTexts: (fileId, texts) => {
                set((state) => ({
                    fileTranslations: {
                        ...state.fileTranslations,
                        [fileId]: {
                            ...state.fileTranslations[fileId],
                            original: texts,
                            translations: state.fileTranslations[fileId]?.translations || []
                        }
                    }
                }));
            },

            addTranslation: (fileId, langCode, texts) => {
                console.log(`🌐 [TranslationStore] Adding translation: ${langCode} for file: ${fileId}`);
                set((state) => {
                    const existing = state.fileTranslations[fileId] || { original: {}, translations: [] };
                    // Check if translation for this lang already exists
                    const existingIndex = existing.translations.findIndex(t => t.langCode === langCode);

                    let newTranslations: TranslationEntry[];
                    if (existingIndex >= 0) {
                        // Replace existing translation for same language
                        newTranslations = [...existing.translations];
                        newTranslations[existingIndex] = { langCode, texts };
                    } else {
                        // Add new translation
                        newTranslations = [...existing.translations, { langCode, texts }];
                    }

                    return {
                        fileTranslations: {
                            ...state.fileTranslations,
                            [fileId]: {
                                ...existing,
                                translations: newTranslations
                            }
                        }
                    };
                });
            },

            getTranslations: (fileId) => {
                return get().fileTranslations[fileId]?.translations || [];
            },

            getTextsForLanguage: (fileId, langCode) => {
                const fileData = get().fileTranslations[fileId];
                if (!fileData) return null;

                if (langCode === null) {
                    return fileData.original;
                }

                const translation = fileData.translations.find(t => t.langCode === langCode);
                return translation?.texts || null;
            },

            setActiveLanguage: (fileId, langCode) => {
                console.log(`🔄 [TranslationStore] Setting active language: ${langCode || 'original'} for file: ${fileId}`);
                set((state) => ({
                    activeLanguage: {
                        ...state.activeLanguage,
                        [fileId]: langCode
                    }
                }));
            },

            getActiveLanguage: (fileId) => {
                return get().activeLanguage[fileId] ?? null;
            },

            hasTranslations: (fileId) => {
                const translations = get().fileTranslations[fileId]?.translations;
                return !!translations && translations.length > 0;
            },

            hasTranslationFor: (fileId, langCode) => {
                const translations = get().fileTranslations[fileId]?.translations || [];
                return translations.some(t => t.langCode === langCode);
            },

            clearDetectedLanguage: (fileId) => {
                set((state) => {
                    const updated = { ...state.detectedLanguages };
                    delete updated[fileId];
                    return { detectedLanguages: updated };
                });
            },

            clearTranslations: (fileId) => {
                set((state) => {
                    const { [fileId]: _, ...remainingActive } = state.activeLanguage;
                    const { [fileId]: __, ...remainingTranslations } = state.fileTranslations;
                    const { [fileId]: ___, ...remainingDetected } = state.detectedLanguages;
                    return {
                        activeLanguage: remainingActive,
                        fileTranslations: remainingTranslations,
                        detectedLanguages: remainingDetected
                    };
                });
            },

            setTargetLanguages: (languages) => {
                set({ targetLanguages: languages });
            },

            addTargetLanguage: (language) => {
                set((state) => ({
                    targetLanguages: state.targetLanguages.includes(language)
                        ? state.targetLanguages
                        : [...state.targetLanguages, language]
                }));
            },

            removeTargetLanguage: (language) => {
                set((state) => ({
                    targetLanguages: state.targetLanguages.filter(l => l !== language)
                }));
            },

            setSelectedGlossaryId: (id) => {
                set({ selectedGlossaryId: id });
            }
        }),
        {
            name: 'translation-store',
            version: 4, // Increment to force fresh migration
            partialize: (state) => ({
                // Persist target languages preferences
                targetLanguages: state.targetLanguages,
                // Persist detected languages for each file so it survives page reload
                detectedLanguages: state.detectedLanguages,
                // Persist translations cache so they survive page reload
                fileTranslations: state.fileTranslations,
                // DO NOT persist: selectedGlossaryId (session-only), activeLanguage (derived)
            }),
            migrate: (persistedState: any, version: number) => {
                // Migration from v3 or earlier to v4
                if (version < 4) {
                    console.log('🔄 Migrating translation store to v4: restoring persistence');
                    return {
                        targetLanguages: persistedState?.targetLanguages || [],
                        detectedLanguages: persistedState?.detectedLanguages || {},
                        fileTranslations: persistedState?.fileTranslations || {},
                        // Clear session-only state
                        selectedGlossaryId: null,
                        activeLanguage: {},
                    };
                }
                return persistedState;
            }
        }
    )
);
