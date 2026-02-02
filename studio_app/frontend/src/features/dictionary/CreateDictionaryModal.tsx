import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useDictionaryStore } from '@app/store/useDictionaryStore';
import { SUPPORTED_LANGUAGES } from '@shared/types/dictionary';

interface CreateDictionaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateDictionaryModal: React.FC<CreateDictionaryModalProps> = ({ isOpen, onClose }) => {
    const { addDictionary } = useDictionaryStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['pt-br', 'en']);

    const handleCreate = () => {
        if (!name.trim() || selectedLanguages.length === 0) return;

        addDictionary({
            name: name.trim(),
            description: description.trim() || undefined,
            languages: selectedLanguages,
            entries: []
        });

        setName('');
        setDescription('');
        setSelectedLanguages(['pt-br', 'en']);
        onClose();
    };

    const toggleLanguage = (code: string) => {
        setSelectedLanguages(prev =>
            prev.includes(code)
                ? prev.filter(l => l !== code)
                : [...prev, code]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-[400px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white">Novo Glossário</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1.5">
                            Nome do Glossário
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Senhor dos Anéis"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[12px] placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1.5">
                            Descrição (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descrição do glossário..."
                            rows={2}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[12px] placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 resize-none"
                        />
                    </div>

                    {/* Languages */}
                    <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1.5">
                            Idiomas
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => toggleLanguage(lang.code)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${selectedLanguages.includes(lang.code)
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.name}</span>
                                </button>
                            ))}
                        </div>
                        {selectedLanguages.length === 0 && (
                            <p className="text-[10px] text-red-400 mt-1">Selecione pelo menos um idioma</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 bg-white/5">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || selectedLanguages.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={12} />
                        Criar Glossário
                    </button>
                </div>
            </div>
        </div>
    );
};
