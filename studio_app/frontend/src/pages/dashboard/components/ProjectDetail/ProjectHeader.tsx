import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';

interface ProjectHeaderProps {
    onBack: () => void;
    breadcrumbs: { id: string; name: string }[];
    onBreadcrumbClick: (id: string) => void;
    totalItems: number;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    onBack,
    breadcrumbs,
    onBreadcrumbClick,
    totalItems
}) => {
    return (
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-app-bg shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-text-secondary hover:text-text-primary">
                    <ArrowLeft size={20} />
                </Button>

                <div className="flex items-center text-sm font-medium">
                    <span className="text-text-muted mr-2 hover:text-text-secondary transition-colors cursor-pointer" onClick={onBack}>Projetos</span>
                    <ChevronRight size={14} className="text-text-muted/50 mx-1" />

                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return (
                            <div key={crumb.id} className="flex items-center animate-in fade-in slide-in-from-left-2 duration-300">
                                <button
                                    onClick={() => onBreadcrumbClick(crumb.id)}
                                    className={`hover:text-white transition-colors ${isLast ? 'text-text-primary font-bold cursor-default' : 'text-text-secondary hover:underline'}`}
                                    disabled={isLast}
                                >
                                    {crumb.name}
                                </button>
                                {!isLast && <ChevronRight size={14} className="text-text-muted/50 mx-1" />}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="text-xs text-text-muted font-mono bg-surface px-2 py-1 rounded border border-white/5">
                {totalItems} itens
            </div>
        </div>
    );
};
