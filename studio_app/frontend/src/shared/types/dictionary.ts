/**
 * Translation Dictionary Types
 * Multi-language dictionary system for consistent translations
 */

export interface TranslationDictionary {
    id: string;
    name: string;                    // e.g., "Senhor dos Anéis"
    description?: string;            // Optional description
    languages: string[];             // e.g., ["en", "pt-br", "de", "es"]
    entries: DictionaryEntry[];
    createdAt: string;               // ISO date string
    updatedAt: string;               // ISO date string
}

export interface DictionaryEntry {
    id: string;
    baseKey: string;                 // Normalized key (lowercase, no spaces)
    originalTerm: string;            // Original term as entered (e.g., "Rivendell")
    translations: Record<string, string>; // { "en": "Rivendell", "pt-br": "Valfenda" }
    category?: string;               // Optional: "name", "place", "sfx", etc.
    notes?: string;                  // Optional notes for translators
}

// Supported language codes
export const SUPPORTED_LANGUAGES = [
    { code: 'ja', name: 'Japonês', flag: '🇯🇵' },
    { code: 'en', name: 'Inglês', flag: '🇺🇸' },
    { code: 'pt-br', name: 'Português (BR)', flag: '🇧🇷' },
    { code: 'es', name: 'Espanhol', flag: '🇪🇸' },
    { code: 'de', name: 'Alemão', flag: '🇩🇪' },
    { code: 'fr', name: 'Francês', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ko', name: 'Coreano', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinês', flag: '🇨🇳' },
    { code: 'ar-ae', name: 'Árabe (EAU)', flag: '🇦🇪' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Entry categories
export const ENTRY_CATEGORIES = [
    { value: 'name', label: 'Nome' },
    { value: 'place', label: 'Local' },
    { value: 'sfx', label: 'SFX/Onomatopeia' },
    { value: 'term', label: 'Termo' },
    { value: 'other', label: 'Outro' },
] as const;
