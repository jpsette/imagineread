import React, { useEffect, useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { FileEntry } from '@shared/types';
import {
    Folder, Star, Bookmark, Flag, Tag, Heart, Briefcase,
    Cloud, Zap,
    Gift, Coffee, Rocket, Smile, Crown, AlertCircle, Layout
} from 'lucide-react';

interface RenameItemModalProps {
    item: FileEntry | null;
    onClose: () => void;
    onRename: (id: string, newName: string, newColor: string, newIcon?: string) => void;
    projectThemes?: any[]; // Legacy themes (optional fallback)
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

const ICONS = [
    { name: 'Folder', icon: Folder },
    { name: 'Star', icon: Star },
    { name: 'Heart', icon: Heart },
    { name: 'Bookmark', icon: Bookmark },
    { name: 'Flag', icon: Flag },
    { name: 'Tag', icon: Tag },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Work', icon: Layout },
    { name: 'Cloud', icon: Cloud },
    { name: 'Zap', icon: Zap }, // 10
    { name: 'Crown', icon: Crown },
    { name: 'Gift', icon: Gift },
    { name: 'Rocket', icon: Rocket },
    { name: 'Coffee', icon: Coffee },
    { name: 'Smile', icon: Smile },
    { name: 'Alert', icon: AlertCircle },
];

export const RenameItemModal: React.FC<RenameItemModalProps> = ({
    item,
    onClose,
    onRename
}) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Folder');

    useEffect(() => {
        if (item) {
            setName(item.name);
            setColor(item.color || 'bg-blue-500');
            // Logic to restore icon if we persist it later
        }
    }, [item]);

    if (!item) return null;

    const handleSubmit = () => {
        if (!name.trim()) return;
        onRename(item.id, name, color, selectedIcon);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg overflow-hidden border border-white/10 bg-[#09090b] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

                {/* HEADER */}
                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                        Renomear {item.type === 'project' ? 'Projeto' : (item.type === 'folder' ? 'Biblioteca' : 'Arquivo')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* INPUT */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Nome</label>
                        <Input
                            autoFocus
                            placeholder="Nome..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit();
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

                    {/* ICONS (Visible only for Folders/Projects) */}
                    {(item.type === 'folder' || item.type === 'project') && (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Ícone</label>
                            <div className="grid grid-cols-8 gap-2">
                                {ICONS.map(({ name: iconName, icon: Icon }) => (
                                    <button
                                        key={iconName}
                                        onClick={() => setSelectedIcon(iconName)}
                                        className={`
                                            h-10 w-10 gap-2 rounded-lg flex items-center justify-center
                                            transition-all duration-200 border 
                                            ${selectedIcon === iconName
                                                ? `bg-white/10 border-white/40 text-white shadow-lg shadow-white/5`
                                                : 'bg-white/5 border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/10'}
                                        `}
                                        title={iconName}
                                    >
                                        <Icon size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="bg-white/5 px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose} className="px-6">Cancelar</Button>
                    <Button onClick={handleSubmit} className="px-8 bg-blue-600 hover:bg-blue-500 text-white">Salvar Alterações</Button>
                </div>
            </Card>
        </div>
    );
};
