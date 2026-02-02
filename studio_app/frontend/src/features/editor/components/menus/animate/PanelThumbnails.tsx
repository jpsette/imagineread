/**
 * PanelThumbnails
 * 
 * Grid of panel thumbnails for quick navigation.
 * Shows all detected panels with order numbers.
 */

import React from 'react';
import { Grid3X3 } from 'lucide-react';

interface PanelThumbnailsProps {
    images: string[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

export const PanelThumbnails: React.FC<PanelThumbnailsProps> = ({
    images,
    selectedIndex,
    onSelect
}) => {
    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
                <Grid3X3 size={24} className="mb-2 opacity-50" />
                <p className="text-xs">Nenhum quadro detectado</p>
                <p className="text-[10px] mt-1 text-zinc-600">
                    Execute a detecção de quadros no menu Vetorizar
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                    <Grid3X3 size={12} />
                    Quadros
                </h3>
                <span className="text-zinc-600 text-[10px]">{images.length} quadros</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(idx)}
                        className={`relative aspect-[3/4] rounded overflow-hidden transition-all group ${idx === selectedIndex
                                ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900'
                                : 'hover:ring-1 hover:ring-zinc-600'
                            }`}
                    >
                        <img
                            src={img}
                            alt={`Quadro ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />

                        {/* Order badge */}
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${idx === selectedIndex
                                ? 'bg-blue-500 text-white'
                                : 'bg-black/70 text-white'
                            }`}>
                            {idx + 1}
                        </div>

                        {/* Hover overlay */}
                        <div className={`absolute inset-0 transition-opacity ${idx === selectedIndex
                                ? 'bg-blue-500/10'
                                : 'bg-black/0 group-hover:bg-black/20'
                            }`} />
                    </button>
                ))}
            </div>
        </div>
    );
};
