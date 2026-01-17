import React from 'react';
import {
    Scan,
    Check,
    Eye,
    EyeOff,
    MessageCircle,
    Type,
    Eraser,
    Layout,
    Scissors,
    RotateCcw,
    Images
} from 'lucide-react';
import { WorkflowStep } from '../../hooks/useVectorization';
import { useEditorStore } from '../../store'; // Store Import

interface VectorizeMenuProps {
    // State from Hook
    workflowStep: WorkflowStep;
    isProcessing: boolean;
    // localCleanUrl removed

    // Actions from Hook
    onCreateMask: () => void;
    onConfirmMask: () => void;
    onDetectBalloon: () => void;
    onDetectText: () => void;
    onCleanImage: (onSuccess?: (url: string) => void) => void;

    // Local Editor State (Toggles)
    showMasks: boolean;
    setShowMasks: (v: boolean) => void;
    showBalloons: boolean;
    setShowBalloons: (v: boolean) => void;
    showText: boolean;
    setShowText: (v: boolean) => void;
    // isOriginalImage removed
    // setIsOriginalImage removed

    // Flags
    canDetectBalloons: boolean;
    canDetectText: boolean;
    canDetectPanels?: boolean;
    hasBalloons: boolean;
    hasText: boolean;
    hasPanels?: boolean;
    onDetectPanels?: () => void;

    // Panel Logic
    onSeparatePanels?: () => void;
    isPanelsConfirmed?: boolean;
    onConfirmPanels?: () => void;
    showPanelsLayer?: boolean;
    setShowPanelsLayer?: (v: boolean) => void;

    // Gallery
    previewImages?: string[];
    onOpenPanelGallery?: () => void;
}

export const VectorizeMenu: React.FC<VectorizeMenuProps> = ({
    workflowStep,
    isProcessing,
    // localCleanUrl removed
    onCreateMask,
    onConfirmMask,
    onDetectBalloon,
    onDetectText,
    onCleanImage,
    showMasks,
    setShowMasks,
    showBalloons,
    setShowBalloons,
    showText,
    setShowText,
    // isOriginalImage removed
    // setIsOriginalImage removed
    canDetectBalloons,
    canDetectText,
    canDetectPanels,
    hasBalloons,
    hasText,
    hasPanels,
    onDetectPanels,
    onSeparatePanels,
    showPanelsLayer,
    setShowPanelsLayer,
    isPanelsConfirmed,
    onConfirmPanels,
    previewImages = [],
    onOpenPanelGallery
}) => {

    // --- STORE HOOKS ---
    const cleanImageUrl = useEditorStore(state => state.cleanImageUrl);
    const isOriginalVisible = useEditorStore(state => state.isOriginalVisible);
    const toggleVisibility = useEditorStore(state => state.toggleVisibility);
    const setCleanImage = useEditorStore(state => state.setCleanImage);

    // --- HANDLERS ---
    const handleCleanClick = () => {
        onCleanImage((url: string) => {
            console.log("✨ Updating Editor with Clean Image:", url);
            if (setCleanImage) {
                setCleanImage(url);
            }
        });
    };

    // Helper for consistency
    const getButtonStyle = (disabled: boolean, variant: 'default' | 'blue' = 'default') => {
        const base = `w-full py-2 px-4 mb-2 text-left rounded-md text-sm font-medium transition-all flex items-center gap-3 select-none border border-transparent`;

        if (disabled) return `${base} bg-[#333] text-gray-500 cursor-not-allowed opacity-50`;

        if (variant === 'blue') {
            return `${base} bg-blue-600 hover:bg-blue-500 text-white shadow-sm active:transform active:scale-[0.98]`;
        }

        return `${base} bg-[#3f3f46] hover:bg-[#52525b] text-white shadow-sm active:transform active:scale-[0.98]`;
    };

    return (
        <div className="flex flex-col gap-1">

            {/* 1. MASCARA */}
            <div className="mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">1. Máscara</label>

                {workflowStep === 'idle' || isProcessing ? (
                    // STATE 1: IDLE / PROCESSING
                    <button
                        onClick={onCreateMask}
                        disabled={isProcessing}
                        className={getButtonStyle(isProcessing, 'blue')}
                    >
                        {isProcessing ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> <span>Processando...</span></>
                        ) : (
                            <><Scan className="w-5 h-5" /> <span>Gerar Máscaras</span></>
                        )}
                    </button>
                ) : workflowStep === 'mask' ? (
                    // STATE 2: REVIEW (Confirm + Redo)
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onConfirmMask}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm"
                        >
                            <Check className="w-4 h-4" /> Confirmar
                        </button>
                        <button
                            onClick={onCreateMask} // Redo
                            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                            title="Refazer Máscara"
                        >
                            <RotateCcw className="w-4 h-4" /> Refazer
                        </button>
                    </div>
                ) : (
                    // STATE 3: DONE (Status + Eye)
                    <div className="flex gap-2 h-[38px]">
                        <div className="flex-1 bg-emerald-600/20 text-emerald-500 border border-emerald-600/30 rounded flex items-center justify-center gap-2 text-sm font-medium cursor-default">
                            <Check className="w-4 h-4" /> <span>Máscara Confirmada</span>
                        </div>
                        <button
                            onClick={() => setShowMasks(!showMasks)}
                            className={`w-12 flex items-center justify-center rounded border transition-colors ${showMasks ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                            title={showMasks ? 'Esconder' : 'Mostrar'}
                        >
                            {showMasks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>

            <div className="h-px bg-[#333] w-full my-2"></div>

            {/* 2. BALÕES */}
            <div className="mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">2. Balões</label>
                {hasBalloons ? (
                    <div className="flex gap-2 h-[38px]">
                        <div className="flex-1 bg-emerald-600/20 text-emerald-500 border border-emerald-600/30 rounded flex items-center justify-center gap-2 text-sm font-medium cursor-default">
                            <Check className="w-4 h-4" /> <span>Detectados</span>
                        </div>
                        <button
                            onClick={() => setShowBalloons(!showBalloons)}
                            className={`w-12 flex items-center justify-center rounded border transition-colors ${showBalloons ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                            title={showBalloons ? 'Esconder' : 'Mostrar'}
                        >
                            {showBalloons ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                ) : (
                    <button
                        className={getButtonStyle(!canDetectBalloons)}
                        disabled={!canDetectBalloons}
                        onClick={onDetectBalloon}
                    >
                        <MessageCircle className="w-5 h-5" /> <span>Detectar Balão</span>
                    </button>
                )}
            </div>

            {/* 3. TEXTO */}
            <div className="mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">3. Texto</label>
                {hasText ? (
                    <div className="flex gap-2 h-[38px]">
                        <div className="flex-1 bg-emerald-600/20 text-emerald-500 border border-emerald-600/30 rounded flex items-center justify-center gap-2 text-sm font-medium cursor-default">
                            <Check className="w-4 h-4" /> <span>Detectado</span>
                        </div>
                        <button
                            onClick={() => setShowText(!showText)}
                            className={`w-12 flex items-center justify-center rounded border transition-colors ${showText ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                            title={showText ? 'Esconder' : 'Mostrar'}
                        >
                            {showText ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                ) : (
                    <button
                        className={getButtonStyle(!canDetectText)}
                        disabled={!canDetectText}
                        onClick={onDetectText}
                    >
                        <Type className="w-5 h-5" /> <span>Detectar Texto</span>
                    </button>
                )}
            </div>

            <div className="h-px bg-[#333] w-full my-2"></div>

            {/* 4. LIMPEZA (INPAINTING) */}
            <div className="flex flex-col gap-2 mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">4. Limpeza</label>

                <div className="flex gap-2"> {/* Flex Row container */}

                    {/* 1. Main Clean Button (Grow to fill space) */}
                    <button
                        onClick={handleCleanClick}
                        disabled={isProcessing}
                        className={`flex-1 rounded-md py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${cleanImageUrl
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isProcessing ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> <span>Limpando...</span></>
                        ) : cleanImageUrl ? (
                            <>
                                <Check className="w-5 h-5" /> <span>Imagem Limpa</span>
                            </>
                        ) : (
                            <>
                                <Eraser className="w-5 h-5" /> <span>Limpar Imagem</span>
                            </>
                        )}
                    </button>

                    {/* 2. The Specific Eye Button (User Requested Style) */}
                    {/* Only show if we actually have a clean image in store */}
                    {cleanImageUrl && (
                        <button
                            onClick={toggleVisibility}
                            className="w-12 flex items-center justify-center rounded border transition-colors bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white hover:border-zinc-500"
                            title={isOriginalVisible ? "Ver Imagem Limpa" : "Ver Original"}
                        >
                            {/* Toggle Icon based on state */}
                            {/* isOriginalVisible = TRUE -> User sees original -> Button should show "Eye Off" symbol or "Eye Open"? 
                                Usually:
                                Seeing Original -> Click to see Clean -> Icon: Eye (to show clean?) or EyeOff (to hide original?)
                                Let's follow user snippet logic:
                                isOriginalVisible ? EyeOff : Eye
                            */}
                            {isOriginalVisible ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="h-px bg-[#333] w-full my-2"></div>

            {/* 5. ESTRUTURA */}
            <div className="mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">5. Estrutura</label>

                {!hasPanels ? (
                    // STATE 1: IDLE
                    <button
                        className={getButtonStyle(!canDetectPanels)}
                        disabled={!canDetectPanels}
                        onClick={onDetectPanels}
                    >
                        <Layout className="w-5 h-5" /> <span>Detectar Quadros</span>
                    </button>
                ) : !isPanelsConfirmed ? (
                    // STATE 2: REVIEW (Confirm + Redo) - VERTICAL STACK
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onConfirmPanels}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                        >
                            <Check className="w-4 h-4" /> <span>Confirmar</span>
                        </button>
                        <button
                            onClick={onDetectPanels} // Reload/Refazer
                            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                            title="Refazer Detecção"
                        >
                            <RotateCcw className="w-4 h-4" /> <span>Refazer</span>
                        </button>
                    </div>
                ) : (
                    // STATE 3: DONE (Separate + Eye)
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 h-[38px]">
                            <button
                                onClick={onSeparatePanels}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-colors"
                            >
                                <Scissors className="w-4 h-4" /> <span>Separar Quadros</span>
                            </button>
                            <button
                                onClick={() => setShowPanelsLayer && setShowPanelsLayer(!showPanelsLayer)}
                                className={`w-12 flex items-center justify-center rounded border transition-colors ${showPanelsLayer ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}
                                title={showPanelsLayer ? 'Esconder' : 'Mostrar'}
                            >
                                {showPanelsLayer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* PERSISTENT GALLERY BUTTON */}
                        {previewImages && previewImages.length > 0 && (
                            <button
                                onClick={onOpenPanelGallery}
                                className="w-full py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                            >
                                <Images className="w-4 h-4" /> Ver Galeria
                            </button>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};
