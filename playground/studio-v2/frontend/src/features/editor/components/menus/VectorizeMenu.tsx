
import React from 'react';
import { WorkflowStep } from '../../hooks/useVectorization';
import { useEditorUIStore } from '@features/editor/uiStore';
import { Wand2, ScanFace, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { BTN_PRIMARY, BTN_SUCCESS_CLICKABLE, BTN_DISABLED, BTN_EYE } from './vectorize/styles';

// Sub-Components
import { Step4Cleaning } from './vectorize/Step4Cleaning';
import { Step5Structure } from './vectorize/Step5Structure';

interface VectorizeMenuProps {
    workflowStep: WorkflowStep;
    isProcessing: boolean;
    isLoading?: boolean;
    isFetching?: boolean;

    // Granular Loading
    isProcessingBalloons: boolean;
    isProcessingCleaning: boolean;
    isProcessingPanels: boolean;
    isProcessingOcr: boolean;

    // Actions
    onCreateMask: () => void; // Legacy
    onDetectBalloon: () => void; // Legacy
    onDetectText: () => void; // Legacy
    onCleanImage: (onSuccess?: (url: string) => void) => void;

    // NEW ACTION
    handleDetectAll?: () => void;

    // Flags
    canDetectBalloons: boolean;
    canDetectText: boolean;
    canDetectPanels?: boolean;
    hasBalloons: boolean;
    hasText: boolean;
    hasPanels?: boolean;
    onDetectPanels?: () => void;
    isPanelsConfirmed?: boolean;
    onConfirmPanels?: () => void;
    onOpenPanelGallery?: () => void;
    initialCleanUrl?: string | null;
    isCleaned?: boolean;
}

export const VectorizeMenu: React.FC<VectorizeMenuProps> = ({
    isProcessing,
    isLoading = false,
    isFetching = false,
    isProcessingBalloons,
    isProcessingCleaning,
    isProcessingPanels,
    isProcessingOcr,
    handleDetectAll, // The new Hero Function
    onCleanImage,
    initialCleanUrl,
    isCleaned,
    hasBalloons,
    hasText,

    // Structure Props
    hasPanels,
    canDetectPanels,
    isPanelsConfirmed,
    onDetectPanels,
    onConfirmPanels,
    onOpenPanelGallery
}) => {

    // Removed unused showBalloons/toggleBalloons from destructuring if they aren't passed prop? 
    // ERROR: The user code in Step 397 used `toggleBalloons` and `showBalloons` BUT they are NOT in VectorizeMenuProps above.
    // I need to check where `showBalloons` comes from. 
    // In previous file content it wasn't there. 
    // Ah, Step 397 attempted to use `toggleBalloons` inside the component but it wasn't defined.
    // Wait, `useEditorUIStore` usually has `showBalloons`.
    // Let's check `useEditorUIStore` usage locally.
    const { cleanImageUrl, showMasks, toggleMasks, showBalloons, toggleBalloons, showText, toggleText } = useEditorUIStore();

    const hasCleanImage = !!(isCleaned || cleanImageUrl || initialCleanUrl);
    const isBusy = isProcessing || isLoading || isFetching;

    // Logic: Has Detection happened?
    const isDetected = hasBalloons || hasText;

    const handleToggleEverything = () => {
        // Simple Logic: If balloons are OFF, turn everything ON. Otherwise turn everything OFF.
        // Or just toggle independent of state?
        // Better: Sync them.
        if (!showBalloons) {
            if (!showBalloons) toggleBalloons();
            if (!showText) toggleText();
        } else {
            if (showBalloons) toggleBalloons();
            if (showText) toggleText();
        }
    };

    return (
        <div className={`flex flex-col gap-4 p-1 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>

            {/* HEADER */}
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Fluxo de Trabalho
                </span>
                {isBusy && <Loader2 className="animate-spin text-blue-500" size={14} />}
            </div>

            {/* STEP 1: DETECT EVERYTHING */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${isDetected ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-blue-500/20 text-blue-500 border-blue-500/30'}`}>1</div>
                        Detectar Elementos
                    </label>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleDetectAll}
                        disabled={isBusy}
                        title={isDetected ? "Detectado (Refazer)" : "Detectar Balões e Texto"}
                        className={isBusy ? BTN_DISABLED : (isDetected ? BTN_SUCCESS_CLICKABLE : BTN_PRIMARY)}
                    >
                        {isProcessingBalloons || isProcessingOcr ? (
                            <>
                                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full min-w-[16px]"></span>
                                <span>Processando...</span>
                            </>
                        ) : isDetected ? (
                            <>
                                <Check className="w-5 h-5 min-w-[20px]" />
                                <span>Detectado (Refazer)</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5 min-w-[20px]" />
                                <span>Detectar Balões e Texto</span>
                            </>
                        )}
                    </button>

                    {isDetected && (
                        <button
                            onClick={handleToggleEverything}
                            className={BTN_EYE(!showBalloons)}
                            title={showBalloons ? "Esconder Tudo" : "Mostrar Tudo"}
                        >
                            {showBalloons ? (
                                <Eye className="w-4 h-4" />
                            ) : (
                                <EyeOff className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            {/* STEP 2: EDIT MASKS (TOGGLE) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[10px] font-bold border border-red-500/30">2</div>
                        Refinar Máscaras
                    </label>
                </div>

                <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${showMasks
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-zinc-900 border-zinc-800 opacity-60'
                    }`}>
                    <div className="flex items-center gap-3">
                        <ScanFace size={20} className={showMasks ? "text-red-400" : "text-zinc-600"} />
                        <span className={`text-xs font-bold ${showMasks ? "text-red-200" : "text-zinc-500"}`}>
                            Modo de Edição
                        </span>
                    </div>

                    <button
                        onClick={toggleMasks}
                        className={`text-[10px] px-2 py-1 rounded border transition-all ${showMasks
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                            }`}
                    >
                        {showMasks ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            {/* STEP 3: CLEANING */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[10px] font-bold border border-green-500/30">3</div>
                        Limpeza
                    </label>
                </div>
                <Step4Cleaning
                    hasCleanImage={hasCleanImage}
                    isProcessingCleaning={isProcessingCleaning}
                    isProcessing={isBusy}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    onCleanImage={onCleanImage}
                />
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            {/* STEP 4: STRUCTURE */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-[10px] font-bold border border-yellow-500/30">4</div>
                        Estrutura
                    </label>
                </div>
                <Step5Structure
                    hasPanels={hasPanels}
                    canDetectPanels={canDetectPanels}
                    isPanelsConfirmed={isPanelsConfirmed}
                    isProcessingPanels={isProcessingPanels}
                    onDetectPanels={onDetectPanels}
                    onConfirmPanels={onConfirmPanels}
                    onOpenPanelGallery={onOpenPanelGallery}
                />
            </div>

        </div>
    );
};
