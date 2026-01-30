import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { FileEntry } from '@shared/types';

interface PageCardProps {
    page: FileEntry;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onEdit: () => void;
}

export const PageCard = React.memo<PageCardProps>(({ page, isSelected, onClick, onEdit }) => {
    // Skeleton / Placeholder logic can be enhanced here
    // Currently using img loading="lazy"
    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer relative w-full h-full rounded-xl border overflow-hidden transition-all bg-[#121214] ${isSelected
                ? 'border-accent-blue ring-2 ring-accent-blue/50 scale-[1.02] z-10'
                : 'border-border-color hover:border-accent-blue/50 hover:shadow-lg'
                }`}
        >
            <img
                src={page.url}
                alt={page.name}
                className="w-full h-full object-cover select-none"
                loading="lazy"
                draggable={false}
                onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    e.currentTarget.parentElement?.classList.add('bg-red-900/20');
                }}
            />
            
            {/* Fallback for broken image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 bg-black/50">
               {/* Just a hover effect */}
            </div>
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center shadow-lg">
                    <Check size={14} className="text-white" strokeWidth={3} />
                </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-white/80 font-mono">
                {page.name}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 transition-all translate-y-full group-hover:translate-y-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate flex-1">{page.name}</span>
                    <Button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        variant="primary"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                    >
                        Editar
                    </Button>
                </div>
            </div>
        </div>
    );
});

PageCard.displayName = 'PageCard';
