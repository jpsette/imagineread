/**
 * MobileSimulator
 * 
 * Simulates a mobile phone screen for previewing comic panels.
 * Shows how the reading experience will look on the ImagineRead app.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';

interface MobileSimulatorProps {
    currentImage: string | null;
    currentIndex: number;
    totalPanels: number;
    onPrevious: () => void;
    onNext: () => void;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
    currentImage,
    currentIndex,
    totalPanels,
    onPrevious,
    onNext
}) => {
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < totalPanels - 1;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Phone Label */}
            <div className="flex items-center gap-2 text-text-muted text-xs">
                <Smartphone size={14} />
                <span>Preview Mobile</span>
            </div>

            {/* Phone Frame */}
            <div className="relative">
                {/* Phone outer frame */}
                <div
                    className="bg-panel-bg rounded-[2.5rem] p-2 shadow-2xl"
                    style={{
                        width: 220,
                        aspectRatio: '9/19.5'
                    }}
                >
                    {/* Notch/Dynamic Island */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />

                    {/* Screen */}
                    <div
                        className="bg-black rounded-[2rem] overflow-hidden h-full flex items-center justify-center"
                    >
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt={`Panel ${currentIndex + 1}`}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-zinc-600 text-xs text-center p-4">
                                <Smartphone size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Nenhum quadro selecionado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Arrows - Outside phone */}
                <button
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className={`absolute left-[-40px] top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${hasPrevious
                            ? 'bg-surface hover:bg-border-color text-white'
                            : 'bg-panel-bg text-zinc-700 cursor-not-allowed'
                        }`}
                >
                    <ChevronLeft size={20} />
                </button>

                <button
                    onClick={onNext}
                    disabled={!hasNext}
                    className={`absolute right-[-40px] top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${hasNext
                            ? 'bg-surface hover:bg-border-color text-white'
                            : 'bg-panel-bg text-zinc-700 cursor-not-allowed'
                        }`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Panel Counter */}
            {totalPanels > 0 && (
                <div className="text-text-secondary text-xs font-medium">
                    {currentIndex + 1} / {totalPanels}
                </div>
            )}
        </div>
    );
};
