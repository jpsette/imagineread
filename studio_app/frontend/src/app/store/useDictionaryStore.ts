import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranslationDictionary, DictionaryEntry } from '@shared/types/dictionary';

interface DictionaryState {
    // Data
    dictionaries: TranslationDictionary[];

    // Actions
    addDictionary: (dictionary: Omit<TranslationDictionary, 'id' | 'createdAt' | 'updatedAt'>) => TranslationDictionary;
    updateDictionary: (id: string, updates: Partial<TranslationDictionary>) => void;
    deleteDictionary: (id: string) => void;

    // Entry actions
    addEntry: (dictionaryId: string, entry: Omit<DictionaryEntry, 'id'>) => void;
    updateEntry: (dictionaryId: string, entryId: string, updates: Partial<DictionaryEntry>) => void;
    deleteEntry: (dictionaryId: string, entryId: string) => void;

    // Language actions
    addLanguage: (dictionaryId: string, languageCode: string) => void;
    removeLanguage: (dictionaryId: string, languageCode: string) => void;
}

const generateId = () => `dict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateEntryId = () => `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useDictionaryStore = create<DictionaryState>()(
    persist(
        (set) => ({
            dictionaries: [],

            addDictionary: (data) => {
                const now = new Date().toISOString();
                const newDict: TranslationDictionary = {
                    ...data,
                    id: generateId(),
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({
                    dictionaries: [...state.dictionaries, newDict]
                }));
                return newDict;
            },

            updateDictionary: (id, updates) => {
                set((state) => ({
                    dictionaries: state.dictionaries.map((d) =>
                        d.id === id
                            ? { ...d, ...updates, updatedAt: new Date().toISOString() }
                            : d
                    )
                }));
            },

            deleteDictionary: (id) => {
                set((state) => ({
                    dictionaries: state.dictionaries.filter((d) => d.id !== id)
                }));
            },

            addEntry: (dictionaryId, entryData) => {
                const newEntry: DictionaryEntry = {
                    ...entryData,
                    id: generateEntryId(),
                };
                set((state) => ({
                    dictionaries: state.dictionaries.map((d) =>
                        d.id === dictionaryId
                            ? {
                                ...d,
                                entries: [...d.entries, newEntry],
                                updatedAt: new Date().toISOString()
                            }
                            : d
                    )
                }));
            },

            updateEntry: (dictionaryId, entryId, updates) => {
                set((state) => ({
                    dictionaries: state.dictionaries.map((d) =>
                        d.id === dictionaryId
                            ? {
                                ...d,
                                entries: d.entries.map((e) =>
                                    e.id === entryId ? { ...e, ...updates } : e
                                ),
                                updatedAt: new Date().toISOString()
                            }
                            : d
                    )
                }));
            },

            deleteEntry: (dictionaryId, entryId) => {
                set((state) => ({
                    dictionaries: state.dictionaries.map((d) =>
                        d.id === dictionaryId
                            ? {
                                ...d,
                                entries: d.entries.filter((e) => e.id !== entryId),
                                updatedAt: new Date().toISOString()
                            }
                            : d
                    )
                }));
            },

            addLanguage: (dictionaryId, languageCode) => {
                set((state) => ({
                    dictionaries: state.dictionaries.map((d) =>
                        d.id === dictionaryId && !d.languages.includes(languageCode)
                            ? {
                                ...d,
                                languages: [...d.languages, languageCode],
                                updatedAt: new Date().toISOString()
                            }
                            : d
                    )
                }));
            },

            removeLanguage: (dictionaryId, languageCode) => {
                set((state) => ({
                    dictionaries: state.dictionaries.map((d) =>
                        d.id === dictionaryId
                            ? {
                                ...d,
                                languages: d.languages.filter((l) => l !== languageCode),
                                // Also remove this language from all entries
                                entries: d.entries.map((e) => {
                                    const { [languageCode]: _, ...rest } = e.translations;
                                    return { ...e, translations: rest };
                                }),
                                updatedAt: new Date().toISOString()
                            }
                            : d
                    )
                }));
            },
        }),
        {
            name: 'translation-dictionary-storage',
        }
    )
);
