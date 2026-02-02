/**
 * AnimateMenu
 * 
 * Main container for the animation preparation workflow.
 * Always shows the floating mobile simulator when this menu is active.
 */

import React, { useState, useMemo } from 'react';
import { Play, Settings, Layers, Smartphone, X } from 'lucide-react';

// Components
import { PanelThumbnails } from './animate/PanelThumbnails';
import { AnimationWorkspace } from './animate/AnimationWorkspace';
import { MobilePreview } from '../mobile-preview';

// Stores
import { useEditorStore } from '@features/editor/store';
import { useEditorUIStore } from '@features/editor/uiStore';

export const AnimateMenu: React.FC = () => {
    const { panels, balloons } = useEditorStore();
    const { previewImages } = useEditorUIStore();

    const [selectedPanelIndex, setSelectedPanelIndex] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    // Get sorted panels with their images
    const sortedPanels = useMemo(() => {
        return [...panels].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [panels]);

    // Current panel
    const currentPanel = sortedPanels[selectedPanelIndex] || null;

    // Current panel image
    const currentImage = previewImages[selectedPanelIndex] || null;

    // Navigation handlers
    const handlePrevious = () => {
        if (selectedPanelIndex > 0) {
            setSelectedPanelIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (selectedPanelIndex < previewImages.length - 1) {
            setSelectedPanelIndex(prev => prev + 1);
        }
    };

    const handleSelectPanel = (index: number) => {
        setSelectedPanelIndex(index);
    };

    // Check if we have panels
    const hasPanels = sortedPanels.length > 0 && previewImages.length > 0;

    return (
        <>
            {/* Sidebar Content */}
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Play size={14} className="text-blue-400" />
                            <h2 className="text-sm font-semibold text-white">Animação</h2>
                        </div>
                        {/* Preview Button */}
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs"
                            title="Mobile Preview"
                        >
                            <Smartphone size={12} />
                            <span>Preview</span>
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                        Prepare a sequência de leitura para o app
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="flex flex-col gap-4">
                        {/* Panel Thumbnails or Empty State */}
                        {hasPanels ? (
                            <>
                                <PanelThumbnails
                                    images={previewImages}
                                    selectedIndex={selectedPanelIndex}
                                    onSelect={handleSelectPanel}
                                />

                                {/* Future: Timeline placeholder */}
                                <div className="border-t border-zinc-800 pt-4">
                                    <div className="flex items-center gap-2 text-zinc-600 text-xs">
                                        <Settings size={12} />
                                        <span>Timeline de animação (em breve)</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-6">
                                <Layers size={28} className="text-zinc-700 mb-2" />
                                <p className="text-zinc-400 text-xs font-medium mb-1">
                                    Nenhum quadro detectado
                                </p>
                                <p className="text-zinc-600 text-[10px] max-w-[180px]">
                                    Execute a detecção no menu <strong>Vetorizar</strong>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Animation Workspace - Full canvas via Portal */}
            <AnimationWorkspace
                currentImage={currentImage}
                currentIndex={selectedPanelIndex}
                totalPanels={previewImages.length}
                currentPanel={currentPanel}
                balloons={balloons}
                onPrevious={handlePrevious}
                onNext={handleNext}
            />

            {/* Preview Popup Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowPreview(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative z-10 bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-[280px]">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >
                            <X size={14} />
                        </button>

                        <MobilePreview
                            currentImage={currentImage}
                            currentPanel={currentPanel}
                            balloons={balloons}
                            currentIndex={selectedPanelIndex}
                            totalPanels={previewImages.length}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

