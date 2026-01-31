import React from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { FolderOpen } from 'lucide-react';

interface CreateLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, color: string) => void;
}

const COLORS = [
    { name: 'Zinc', bg: 'bg-zinc-500' },
    { name: 'Red', bg: 'bg-red-500' },
    { name: 'Orange', bg: 'bg-orange-500' },
    { name: 'Amber', bg: 'bg-amber-500' },
    { name: 'Yellow', bg: 'bg-yellow-500' },
    { name: 'Lime', bg: 'bg-lime-500' },
    { name: 'Green', bg: 'bg-green-500' },
    { name: 'Emerald', bg: 'bg-emerald-500' },
    { name: 'Teal', bg: 'bg-teal-500' },
    { name: 'Cyan', bg: 'bg-cyan-500' },
    { name: 'Sky', bg: 'bg-sky-500' },
    { name: 'Blue', bg: 'bg-blue-500' },
    { name: 'Indigo', bg: 'bg-indigo-500' },
    { name: 'Violet', bg: 'bg-violet-500' },
    { name: 'Purple', bg: 'bg-purple-500' },
    { name: 'Fuchsia', bg: 'bg-fuchsia-500' },
    { name: 'Pink', bg: 'bg-pink-500' },
    { name: 'Rose', bg: 'bg-rose-500' },
    { name: 'Slate', bg: 'bg-slate-500' },
    { name: 'Stone', bg: 'bg-stone-500' },
];

export const CreateLibraryModal: React.FC<CreateLibraryModalProps> = ({
    isOpen, onClose, onCreate
}) => {
    const [name, setName] = React.useState('');
    const [color, setColor] = React.useState(COLORS[0].bg);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setName('');
            setColor(COLORS[0].bg);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCreate = () => {
        if (!name.trim()) {
            alert('Por favor, digite um nome para a biblioteca.');
            return;
        }
        onCreate(name.trim(), color);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <Card
                className="w-full max-w-md overflow-hidden border border-white/10 bg-[#09090b] shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                        <FolderOpen size={16} className="text-accent-blue" />
                        Nova Biblioteca
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* NAME INPUT */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Nome da Biblioteca</label>
                        <Input
                            autoFocus
                            placeholder="Ex: Saga Darth Vader..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                                if (e.key === 'Escape') onClose();
                            }}
                            className="bg-black/50 border-white/10 text-lg px-4 py-3 h-12"
                        />
                    </div>

                    {/* COLORS */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cor de Destaque</label>
                        <div className="grid grid-cols-10 gap-2">
                            {COLORS.map(theme => (
                                <button
                                    key={theme.name}
                                    onClick={() => setColor(theme.bg)}
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center
                                        transition-all duration-200 border border-transparent
                                        ${theme.bg} 
                                        ${color === theme.bg ? 'ring-2 ring-offset-2 ring-offset-[#09090b] ring-white scale-110' : 'hover:scale-110 opacity-60 hover:opacity-100 hover:border-white/20'}
                                    `}
                                    title={theme.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="bg-white/5 px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose} className="px-6">Cancelar</Button>
                    <Button
                        onClick={handleCreate}
                        className="px-8 text-white bg-accent-blue hover:bg-blue-500"
                    >
                        Criar Biblioteca
                    </Button>
                </div>
            </Card>
        </div>
    );
};
