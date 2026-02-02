import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Search, ChevronDown, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
import { useDictionaryStore } from '@app/store/useDictionaryStore';
import { TranslationDictionary, SUPPORTED_LANGUAGES, ENTRY_CATEGORIES } from '@shared/types/dictionary';

interface DictionaryEditorProps {
    dictionary: TranslationDictionary;
}

export const DictionaryEditor: React.FC<DictionaryEditorProps> = ({ dictionary }) => {
    const { addEntry, updateEntry, deleteEntry, addLanguage, removeLanguage } = useDictionaryStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');

    // New entry form state
    const [newEntry, setNewEntry] = useState({
        originalTerm: '',
        category: 'term',
        translations: {} as Record<string, string>
    });

    const filteredEntries = dictionary.entries
        .filter(e =>
            e.originalTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
            Object.values(e.translations).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            const comparison = a.originalTerm.localeCompare(b.originalTerm, 'pt-BR', { sensitivity: 'base' });
            return sortOrder === 'az' ? comparison : -comparison;
        });

    const handleAddEntry = () => {
        if (!newEntry.originalTerm.trim()) return;

        addEntry(dictionary.id, {
            baseKey: newEntry.originalTerm.toLowerCase().replace(/\s+/g, '_'),
            originalTerm: newEntry.originalTerm,
            category: newEntry.category,
            translations: newEntry.translations
        });

        setNewEntry({ originalTerm: '', category: 'term', translations: {} });
        setIsAddingEntry(false);
    };

    const handleUpdateTranslation = (entryId: string, langCode: string, value: string) => {
        const entry = dictionary.entries.find(e => e.id === entryId);
        if (!entry) return;

        updateEntry(dictionary.id, entryId, {
            translations: { ...entry.translations, [langCode]: value }
        });
    };

    const handleDeleteEntry = (entryId: string) => {
        if (confirm('Tem certeza que deseja excluir este termo?')) {
            deleteEntry(dictionary.id, entryId);
        }
    };

    const getLanguageFlag = (code: string) => {
        return SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag || '🌐';
    };

    const getLanguageName = (code: string) => {
        return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;
    };

    const availableLanguages = SUPPORTED_LANGUAGES.filter(
        l => !dictionary.languages.includes(l.code)
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-white">{dictionary.name}</h2>
                    <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                className="flex items-center gap-1.5 px-2 py-1 text-[11px] bg-white/5 border border-white/10 rounded-lg text-zinc-300 hover:bg-white/10 transition-colors"
                            >
                                Idiomas ({dictionary.languages.length})
                                <ChevronDown size={12} />
                            </button>

                            {showLanguageMenu && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 py-1">
                                    <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase font-semibold">
                                        Idiomas ativos
                                    </div>
                                    {dictionary.languages.map(code => (
                                        <div key={code} className="flex items-center justify-between px-2 py-1.5 hover:bg-white/5">
                                            <span className="text-[11px] text-white flex items-center gap-2">
                                                {getLanguageFlag(code)} {getLanguageName(code)}
                                            </span>
                                            <button
                                                onClick={() => removeLanguage(dictionary.id, code)}
                                                className="p-0.5 text-zinc-500 hover:text-red-400"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    {availableLanguages.length > 0 && (
                                        <>
                                            <div className="border-t border-white/10 mt-1 pt-1 px-2 py-1 text-[10px] text-zinc-500 uppercase font-semibold">
                                                Adicionar idioma
                                            </div>
                                            {availableLanguages.map(lang => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        addLanguage(dictionary.id, lang.code);
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 hover:bg-white/5 text-[11px] text-zinc-400 flex items-center gap-2"
                                                >
                                                    {lang.flag} {lang.name}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Add Language Button - More visible */}
                        {availableLanguages.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                >
                                    <Plus size={12} />
                                    Novo Idioma
                                </button>
                            </div>
                        )}

                        {/* Add Entry Button */}
                        <button
                            onClick={() => setIsAddingEntry(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                            <Plus size={12} />
                            Novo Termo
                        </button>
                    </div>
                </div>

                {/* Search and Sort */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar termo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>

                    {/* Sort Buttons */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setSortOrder('az')}
                            className={`flex items-center gap-1 px-2 py-1.5 text-[11px] transition-colors ${sortOrder === 'az'
                                    ? 'bg-blue-500/30 text-blue-400'
                                    : 'text-zinc-400 hover:bg-white/5'
                                }`}
                            title="Ordenar A-Z"
                        >
                            <ArrowDownAZ size={14} />
                        </button>
                        <button
                            onClick={() => setSortOrder('za')}
                            className={`flex items-center gap-1 px-2 py-1.5 text-[11px] transition-colors ${sortOrder === 'za'
                                    ? 'bg-blue-500/30 text-blue-400'
                                    : 'text-zinc-400 hover:bg-white/5'
                                }`}
                            title="Ordenar Z-A"
                        >
                            <ArrowUpAZ size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur">
                        <tr className="border-b border-white/10">
                            <th className="text-left px-3 py-2 text-zinc-400 font-semibold w-40">Termo</th>
                            {dictionary.languages.map(lang => (
                                <th key={lang} className="text-left px-3 py-2 text-zinc-400 font-semibold">
                                    {getLanguageFlag(lang)} {getLanguageName(lang)}
                                </th>
                            ))}
                            <th className="w-20"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* New Entry Row */}
                        {isAddingEntry && (
                            <tr className="border-b border-white/10 bg-blue-500/5">
                                <td className="px-3 py-2">
                                    <input
                                        type="text"
                                        placeholder="Termo original"
                                        value={newEntry.originalTerm}
                                        onChange={(e) => setNewEntry({ ...newEntry, originalTerm: e.target.value })}
                                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-[11px] focus:outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                </td>
                                {dictionary.languages.map(lang => (
                                    <td key={lang} className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder={`Tradução (${lang})`}
                                            value={newEntry.translations[lang] || ''}
                                            onChange={(e) => setNewEntry({
                                                ...newEntry,
                                                translations: { ...newEntry.translations, [lang]: e.target.value }
                                            })}
                                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-[11px] focus:outline-none focus:border-blue-500"
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleAddEntry}
                                            className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                        >
                                            <Save size={12} />
                                        </button>
                                        <button
                                            onClick={() => setIsAddingEntry(false)}
                                            className="p-1 rounded bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Existing Entries */}
                        {filteredEntries.map((entry) => (
                            <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 group">
                                <td className="px-3 py-2">
                                    <span className="text-white font-medium">{entry.originalTerm}</span>
                                    {entry.category && (
                                        <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-zinc-400">
                                            {ENTRY_CATEGORIES.find(c => c.value === entry.category)?.label}
                                        </span>
                                    )}
                                </td>
                                {dictionary.languages.map(lang => (
                                    <td key={lang} className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={entry.translations[lang] || ''}
                                            onChange={(e) => handleUpdateTranslation(entry.id, lang, e.target.value)}
                                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-white/20 focus:border-blue-500 focus:bg-white/5 rounded text-white text-[11px] focus:outline-none transition-all"
                                            placeholder="—"
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2">
                                    <button
                                        onClick={() => handleDeleteEntry(entry.id)}
                                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {filteredEntries.length === 0 && !isAddingEntry && (
                            <tr>
                                <td colSpan={dictionary.languages.length + 2} className="text-center py-12 text-zinc-500">
                                    {searchTerm ? 'Nenhum termo encontrado' : 'Nenhum termo cadastrado. Clique em "Novo Termo" para começar.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
