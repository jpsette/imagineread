import React, { useState } from 'react';
import { Plus, Book, Trash2, Search, Languages } from 'lucide-react';
import { useDictionaryStore } from '@app/store/useDictionaryStore';
import { SUPPORTED_LANGUAGES } from '@shared/types/dictionary';
import { DictionaryEditor } from './DictionaryEditor';
import { CreateDictionaryModal } from './CreateDictionaryModal';

export const DictionaryManager: React.FC = () => {
    const { dictionaries, deleteDictionary } = useDictionaryStore();
    const [selectedDictionaryId, setSelectedDictionaryId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedDictionary = dictionaries.find(d => d.id === selectedDictionaryId);

    const filteredDictionaries = dictionaries.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir o glossário "${name}"?`)) {
            deleteDictionary(id);
            if (selectedDictionaryId === id) {
                setSelectedDictionaryId(null);
            }
        }
    };

    // Get language flag by code
    const getLanguageFlag = (code: string) => {
        return SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag || '🌐';
    };

    return (
        <div className="flex h-full">
            {/* Sidebar - Dictionary List */}
            <div className="w-64 border-r border-white/10 flex flex-col">
                {/* Header */}
                <div className="p-3 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Book size={14} />
                            Glossários
                        </h3>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            title="Novo Glossário"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar glossário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                {/* Dictionary List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredDictionaries.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-[11px]">
                            {searchTerm ? 'Nenhum glossário encontrado' : 'Nenhum glossário criado'}
                        </div>
                    ) : (
                        filteredDictionaries.map((dict) => (
                            <div
                                key={dict.id}
                                onClick={() => setSelectedDictionaryId(dict.id)}
                                className={`group p-2.5 rounded-lg cursor-pointer transition-all ${selectedDictionaryId === dict.id
                                    ? 'bg-blue-500/20 border border-blue-500/30'
                                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-medium text-white truncate">
                                        {dict.name}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(dict.id, dict.name);
                                        }}
                                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    {dict.languages.slice(0, 4).map((lang) => (
                                        <span key={lang} className="text-[10px]" title={lang}>
                                            {getLanguageFlag(lang)}
                                        </span>
                                    ))}
                                    {dict.languages.length > 4 && (
                                        <span className="text-[9px] text-zinc-500">+{dict.languages.length - 4}</span>
                                    )}
                                    <span className="ml-auto text-[9px] text-zinc-500">
                                        {dict.entries.length} termos
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Dictionary Editor */}
            <div className="flex-1 flex flex-col">
                {selectedDictionary ? (
                    <DictionaryEditor dictionary={selectedDictionary} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                        <Languages size={48} className="mb-4 opacity-30" />
                        <p className="text-[13px]">Selecione um glossário para editar</p>
                        <p className="text-[11px] mt-1">ou crie um novo clicando em +</p>
                    </div>
                )}
            </div>

            {/* Create Dictionary Modal */}
            <CreateDictionaryModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
            />
        </div>
    );
};
