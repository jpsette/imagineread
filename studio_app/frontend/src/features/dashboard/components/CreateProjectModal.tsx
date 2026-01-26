import React from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';

interface CreateProjectModalProps {
    isOpen: boolean; // isCreatingProject
    onClose: () => void;
    onCreate: () => void;
    newName: string;
    setNewName: (name: string) => void;
    newColor: string;
    setNewColor: (color: string) => void;
    projectThemes: { bg: string; text: string; lightText: string }[];
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    newName,
    setNewName,
    newColor,
    setNewColor,
    projectThemes
}) => {
    if (!isOpen) return null;

    return (
        <Card className="p-6 border-accent-blue bg-surface shadow-2xl shadow-blue-500/10 min-h-[210px] flex flex-col justify-between ring-1 ring-accent-blue/20">
            <div>
                <h3 className="text-sm font-bold mb-3 text-accent-blue uppercase tracking-wider">Novo Projeto</h3>
                <Input
                    autoFocus
                    placeholder="Nome do projeto..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onCreate();
                        if (e.key === 'Escape') onClose();
                    }}
                    className="mb-4"
                />
                <div className="grid grid-cols-8 gap-0.5">
                    {projectThemes.map(theme => (
                        <button
                            key={theme.bg}
                            onClick={() => setNewColor(theme.bg)}
                            className={`w-5 h-5 rounded-full transition-all duration-200 border border-transparent ${theme.bg} ${newColor === theme.bg ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100 hover:border-white/20'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={onCreate} className="flex-1">Criar</Button>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
        </Card>
    );
};
