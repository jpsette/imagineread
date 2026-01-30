import React from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Folder } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;

    // Updated Signature: Now accepts mode and path
    onCreate: (mode?: 'cloud' | 'local', path?: string) => void;

    newName: string;
    setNewName: (name: string) => void;
    newColor: string;
    setNewColor: (color: string) => void;

    // We ignore the passed themes in favor of the full static palette to match RenameItemModal
    projectThemes?: any[];
}

const COLORS = [
    { name: 'Zinc', bg: 'bg-zinc-500', text: 'text-zinc-500' },
    { name: 'Red', bg: 'bg-red-500', text: 'text-red-500' },
    { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500' },
    { name: 'Amber', bg: 'bg-amber-500', text: 'text-amber-500' },
    { name: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-500' },
    { name: 'Lime', bg: 'bg-lime-500', text: 'text-lime-500' },
    { name: 'Green', bg: 'bg-green-500', text: 'text-green-500' },
    { name: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-500' },
    { name: 'Teal', bg: 'bg-teal-500', text: 'text-teal-500' },
    { name: 'Cyan', bg: 'bg-cyan-500', text: 'text-cyan-500' },
    { name: 'Sky', bg: 'bg-sky-500', text: 'text-sky-500' },
    { name: 'Blue', bg: 'bg-blue-500', text: 'text-blue-500' },
    { name: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-500' },
    { name: 'Violet', bg: 'bg-violet-500', text: 'text-violet-500' },
    { name: 'Purple', bg: 'bg-purple-500', text: 'text-purple-500' },
    { name: 'Fuchsia', bg: 'bg-fuchsia-500', text: 'text-fuchsia-500' },
    { name: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500' },
    { name: 'Rose', bg: 'bg-rose-500', text: 'text-rose-500' },
    { name: 'Slate', bg: 'bg-slate-500', text: 'text-slate-500' },
    { name: 'Stone', bg: 'bg-stone-500', text: 'text-stone-500' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen, onClose, onCreate,
    newName, setNewName,
    newColor, setNewColor,
}) => {
    // Local UI State for this modal
    const [storageMode, setStorageMode] = React.useState<'cloud' | 'local'>('local'); // Default to LOCAL as requested
    const [localPath, setLocalPath] = React.useState<string>('');

    if (!isOpen) return null;

    const handleCreate = () => {
        if (!newName.trim()) return;
        if (storageMode === 'local' && !localPath) {
            alert("Por favor, selecione uma pasta para salvar o projeto.");
            return;
        }
        onCreate(storageMode, localPath);
    };

    const handleBrowse = async () => {
        if (!window.electron?.local) {
            alert("Modo Local não disponível neste ambiente.");
            return;
        }
        const path = await window.electron.local.selectDirectory();
        if (path) {
            setLocalPath(path);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg overflow-hidden border border-white/10 bg-[#09090b] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

                {/* HEADER */}
                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                        Novo Projeto
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* STORAGE MODE TOGGLE */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Local de Salvamento</label>
                        <div className="flex gap-2 p-1 bg-black/50 rounded-lg border border-white/5">
                            <button
                                onClick={() => setStorageMode('cloud')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${storageMode === 'cloud' ? 'bg-accent-blue text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                            >
                                ☁️ Nuvem
                            </button>
                            <button
                                onClick={() => setStorageMode('local')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${storageMode === 'local' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                            >
                                💻 Computador
                            </button>
                        </div>
                    </div>

                    {/* INPUT */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Nome</label>
                        <Input
                            autoFocus
                            placeholder="Nome do projeto..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                                if (e.key === 'Escape') onClose();
                            }}
                            className="bg-black/50 border-white/10 text-lg px-4 py-3 h-12"
                        />
                    </div>

                    {/* LOCAL PATH SELECTION (Only in Local Mode) */}
                    {storageMode === 'local' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pasta de Destino</label>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleBrowse}
                                    className="w-full justify-start text-left border-white/10 bg-black/50 hover:bg-white/5 h-12 px-4 shadow-sm"
                                >
                                    <Folder size={18} className="mr-3 text-zinc-400" />
                                    <span className={localPath ? "text-white" : "text-zinc-500"}>
                                        {localPath ? "Alterar Pasta Selecionada..." : "Selecionar Pasta do Computador..."}
                                    </span>
                                </Button>

                                <div className="px-1 min-h-[20px]">
                                    {localPath && (
                                        <p className="font-mono text-[10px] text-zinc-500 break-all px-1">
                                            {localPath}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COLORS */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cor de Destaque</label>
                        <div className="grid grid-cols-10 gap-2">
                            {COLORS.map(theme => (
                                <button
                                    key={theme.name}
                                    onClick={() => setNewColor(theme.bg)}
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center
                                        transition-all duration-200 border border-transparent
                                        ${theme.bg} 
                                        ${newColor === theme.bg ? 'ring-2 ring-offset-2 ring-offset-[#09090b] ring-white scale-110' : 'hover:scale-110 opacity-60 hover:opacity-100 hover:border-white/20'}
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
                        className={`px-8 text-white ${storageMode === 'local' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {storageMode === 'local' ? 'Criar Localmente' : 'Criar na Nuvem'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
