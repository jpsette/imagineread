import React from 'react';
import { Search, ArrowDownAZ, ArrowUpZA, LayoutGrid, List } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';

interface ProjectFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortOrder: 'az' | 'za';
    setSortOrder: (order: 'az' | 'za') => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
    searchTerm, setSearchTerm,
    sortOrder, setSortOrder,
    viewMode, setViewMode
}) => {
    return (
        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border-color shadow-sm">
            <Input
                icon={Search}
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 !bg-transparent !border-none !text-xs !pl-9 !py-1 placeholder:text-text-muted text-text-primary"
            />
            <div className="w-[1px] h-4 bg-border-color mx-1" />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'az' ? 'za' : 'az')}
                icon={sortOrder === 'az' ? ArrowDownAZ : ArrowUpZA}
                className={sortOrder === 'za' ? 'text-accent-blue bg-white/5' : ''}
            />
            <div className="w-[1px] h-4 bg-border-color mx-1" />
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    icon={LayoutGrid}
                    className={viewMode === 'grid' ? 'text-accent-blue bg-white/5' : 'text-zinc-500'}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    icon={List}
                    className={viewMode === 'list' ? 'text-accent-blue bg-white/5' : 'text-zinc-500'}
                />
            </div>
        </div>
    );
};
