/**
 * MobilePreview Component
 * 
 * iPhone frame container for previewing comic panels with animated balloons.
 * Designed to fit in the Animation Menu sidebar.
 */

import React, { useState, useCallback } from 'react';
import { Smartphone } from 'lucide-react';
import { Balloon, Panel } from '@shared/types';
import { PageViewer } from './PageViewer';
import { PreviewControls } from './PreviewControls';

interface MobilePreviewProps {
    /** Current panel image URL */
    currentImage: string | null;
    /** Current panel data */
    currentPanel: Panel | null;
    /** All balloons from the page */
    balloons: Balloon[];
    /** Current panel index */
    currentIndex: number;
    /** Total number of panels */
    totalPanels: number;
    /** Auto-play balloon animations */
    autoPlay?: boolean;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({
    currentImage,
    currentPanel,
    balloons,
    currentIndex,
    totalPanels,
    autoPlay = true,
}) => {
    // Animation key to trigger replay
    const [animationKey, setAnimationKey] = useState(0);

    const handleReplay = useCallback(() => {
        setAnimationKey(prev => prev + 1);
    }, []);

    // Reset animation when panel changes
    React.useEffect(() => {
        setAnimationKey(prev => prev + 1);
    }, [currentIndex]);

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Label */}
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Smartphone size={14} />
                <span>Mobile Preview</span>
            </div>

            {/* iPhone Frame */}
            <div className="relative">
                {/* Phone outer shell */}
                <div
                    className="bg-zinc-900 rounded-[2rem] p-1.5 shadow-xl"
                    style={{
                        width: 200,
                        height: 430,
                        boxShadow: '0 0 0 2px #333, 0 8px 24px rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Notch / Dynamic Island */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10" />

                    {/* Screen */}
                    <div className="relative bg-black rounded-[1.5rem] overflow-hidden h-full flex flex-col">
                        {/* Content Area */}
                        <div className="flex-1 relative">
                            {currentImage ? (
                                <PageViewer
                                    imageUrl={currentImage}
                                    balloons={balloons}
                                    currentPanel={currentPanel}
                                    autoPlay={autoPlay}
                                    animationKey={animationKey}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-xs text-center px-4">
                                    <Smartphone size={28} className="mb-2 opacity-40" />
                                    <p className="font-medium">Nenhum quadro</p>
                                    <p className="text-[10px] text-zinc-700 mt-1">
                                        Detecte quadros no Vetorizar
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Controls (bottom) */}
                        <PreviewControls
                            currentIndex={currentIndex}
                            totalPanels={totalPanels}
                            onReplay={handleReplay}
                        />

                        {/* Home Indicator */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
