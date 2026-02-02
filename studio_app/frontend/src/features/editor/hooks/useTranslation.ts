/**
 * useTranslation Hook
 * 
 * Handles translation of balloon texts via the backend API.
 * Supports multiple translations and toggling between them.
 */

import { useState, useCallback } from 'react';
import { api } from '@shared/api/api';
import { Balloon } from '@shared/types';
import { useTranslationStore } from '@app/store/useTranslationStore';
import { useDictionaryStore } from '@app/store/useDictionaryStore';
import { toast } from 'sonner';

interface UseTranslationProps {
    fileId: string;
    balloons: Balloon[];
    setBalloons: (balloons: Balloon[]) => void;
}

interface UseTranslationReturn {
    translateAll: (targetLang: string) => Promise<void>;
    switchToLanguage: (langCode: string | null) => void;
    isTranslating: boolean;
    translatingFromLang: string | null;
    translatingToLang: string | null;
    activeLanguage: string | null;
    hasTranslations: boolean;
    translations: { langCode: string }[];
    selectedGlossaryId: string | null;
    setSelectedGlossaryId: (id: string | null) => void;
}

export const useTranslation = ({
    fileId,
    balloons,
    setBalloons
}: UseTranslationProps): UseTranslationReturn => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatingFromLang, setTranslatingFromLang] = useState<string | null>(null);
    const [translatingToLang, setTranslatingToLang] = useState<string | null>(null);

    const {
        getDetectedLanguage,
        storeOriginalTexts,
        addTranslation,
        getTranslations,
        getTextsForLanguage,
        hasTranslations: checkHasTranslations,
        setActiveLanguage,
        getActiveLanguage,
        selectedGlossaryId,
        setSelectedGlossaryId
    } = useTranslationStore();

    const { dictionaries } = useDictionaryStore();

    const activeLanguage = getActiveLanguage(fileId);
    const hasTranslations = checkHasTranslations(fileId);
    const translations = getTranslations(fileId);

    const translateAll = useCallback(async (targetLang: string) => {
        const sourceLang = getDetectedLanguage(fileId);

        if (!sourceLang) {
            toast.error('Idioma de origem não detectado. Execute a vetorização primeiro.');
            return;
        }

        // Get all balloons with text
        const balloonsWithText = balloons.filter(b =>
            b.type?.startsWith('balloon') && b.text && typeof b.text === 'string' && b.text.trim()
        );

        if (balloonsWithText.length === 0) {
            toast.error('Nenhum balão com texto encontrado.');
            return;
        }

        // Store original texts BEFORE first translation
        // ALWAYS update if current balloon IDs don't match stored IDs or if empty
        const existingOriginal = getTextsForLanguage(fileId, null);
        const storedBalloonIds = existingOriginal ? new Set(Object.keys(existingOriginal)) : new Set<string>();

        // Check if we need to refresh the original texts (IDs changed or empty)
        const needsRefresh = !existingOriginal ||
            Object.keys(existingOriginal).length === 0 ||
            !balloonsWithText.every(b => storedBalloonIds.has(b.id));

        if (needsRefresh) {
            console.log('📝 Storing/refreshing original texts before translation');
            const originalTexts: Record<string, string> = {};
            balloonsWithText.forEach(b => {
                originalTexts[b.id] = b.text as string;
            });
            storeOriginalTexts(fileId, originalTexts);
        }

        // For translation, we need to use the ORIGINAL texts, not current display
        const originalTexts = getTextsForLanguage(fileId, null);
        const textsToTranslate = balloonsWithText.map(b => {
            return originalTexts?.[b.id] || (b.text as string);
        });

        // Get glossary terms if a glossary is selected
        let glossaryTerms: { original: string; translation: string }[] | undefined;
        if (selectedGlossaryId) {
            const selectedDictionary = dictionaries.find(d => d.id === selectedGlossaryId);
            if (selectedDictionary) {
                glossaryTerms = selectedDictionary.entries
                    .filter(entry => entry.translations[targetLang])
                    .map(entry => ({
                        original: entry.originalTerm,
                        translation: entry.translations[targetLang]
                    }));
                console.log(`📚 Using glossary "${selectedDictionary.name}" with ${glossaryTerms.length} terms for ${targetLang}`);
            }
        }

        setIsTranslating(true);
        setTranslatingFromLang(sourceLang);
        setTranslatingToLang(targetLang);
        console.log(`🌐 Translating ${textsToTranslate.length} texts: ${sourceLang} → ${targetLang}`);

        try {
            const result = await api.translateTexts(
                textsToTranslate,
                sourceLang,
                targetLang,
                'Comic book speech bubbles',
                glossaryTerms
            );

            if (result.status === 'success' && result.translations) {
                // Store translations
                const translatedTexts: Record<string, string> = {};
                const translationMap = new Map<string, string>();

                balloonsWithText.forEach((b, index) => {
                    if (result.translations[index]) {
                        translatedTexts[b.id] = result.translations[index];
                        translationMap.set(b.id, result.translations[index]);
                    }
                });

                addTranslation(fileId, targetLang, translatedTexts);
                setActiveLanguage(fileId, targetLang);

                // Update balloons with translations
                const updatedBalloons = balloons.map(b => {
                    if (translationMap.has(b.id)) {
                        return { ...b, text: translationMap.get(b.id)! };
                    }
                    return b;
                });

                setBalloons(updatedBalloons as Balloon[]);
                toast.success(`Traduzido para ${targetLang.toUpperCase()} com sucesso!`);
                console.log(`✅ Translation complete: ${result.translations.length} texts`);
            } else {
                toast.error(result.error || 'Erro na tradução');
                console.error('Translation failed:', result.error);
            }

        } catch (error: any) {
            console.error('Translation error:', error);
            toast.error('Erro ao traduzir: ' + error.message);
        } finally {
            setIsTranslating(false);
            setTranslatingFromLang(null);
            setTranslatingToLang(null);
        }
    }, [fileId, balloons, setBalloons, getDetectedLanguage, storeOriginalTexts, addTranslation, setActiveLanguage, getTextsForLanguage, selectedGlossaryId, dictionaries]);

    const switchToLanguage = useCallback((langCode: string | null) => {
        console.log(`🔄 switchToLanguage called with: ${langCode || 'original'}`);
        console.log(`📁 FileId: ${fileId}`);

        const textsToApply = getTextsForLanguage(fileId, langCode);
        console.log(`📝 textsToApply:`, textsToApply);

        if (!textsToApply) {
            console.error(`❌ No texts found for language: ${langCode || 'original'}`);
            toast.error(langCode === null ? 'Textos originais não encontrados' : 'Tradução não encontrada');
            return;
        }

        console.log(`✅ Found ${Object.keys(textsToApply).length} texts to apply`);
        console.log(`🎈 Current balloon IDs:`, balloons.map(b => b.id));

        // Apply texts from the selected version
        let appliedCount = 0;
        const updatedBalloons = balloons.map(b => {
            if (textsToApply[b.id]) {
                appliedCount++;
                return { ...b, text: textsToApply[b.id] };
            }
            return b;
        });

        console.log(`✅ Applied text to ${appliedCount} balloons`);
        setBalloons(updatedBalloons as Balloon[]);
        setActiveLanguage(fileId, langCode);
        console.log(`🔄 Switched to ${langCode || 'original'}`);
    }, [fileId, balloons, setBalloons, getTextsForLanguage, setActiveLanguage]);

    return {
        translateAll,
        switchToLanguage,
        isTranslating,
        translatingFromLang,
        translatingToLang,
        activeLanguage,
        hasTranslations,
        translations,
        selectedGlossaryId,
        setSelectedGlossaryId
    };
};
