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
    RotateCcw,
    Images
} from 'lucide-react';
import { WorkflowStep } from '../../hooks/useVectorization';
import { useEditorStore } from '../../store'; // Store Import

import { useEditorUIStore } from '../../uiStore';

interface VectorizeMenuProps {
    // State from Hook (Logic)
    workflowStep: WorkflowStep;
    isProcessing: boolean;
    // Granular Loading
    isProcessingBalloons: boolean;
    isProcessingCleaning: boolean;
    isProcessingPanels: boolean;
    isProcessingOcr: boolean;

    // Actions from Hook (Logic)
    onCreateMask: () => void;
    onConfirmMask: () => void;
    onDetectBalloon: () => void;
    onDetectText: () => void;
    onCleanImage: (onSuccess?: (url: string) => void) => void;

    // Flags
    canDetectBalloons: boolean;
    canDetectText: boolean;
    canDetectPanels?: boolean;
    hasBalloons: boolean;
    hasText: boolean;
    hasPanels?: boolean;
    onDetectPanels?: () => void;

    // Panel Logic
    isPanelsConfirmed?: boolean;
    onConfirmPanels?: () => void;

    // Gallery
    onOpenPanelGallery?: () => void;
    initialCleanUrl?: string | null;
}

export const VectorizeMenu: React.FC<VectorizeMenuProps> = ({
    workflowStep,
    isProcessing,
    // Destructure Granular Flags
    isProcessingBalloons,
    isProcessingCleaning,
    isProcessingPanels,
    isProcessingOcr,

    onCreateMask,
    onConfirmMask,
    onDetectBalloon,
    onDetectText,
    onCleanImage,
    canDetectBalloons,
    canDetectText,
    canDetectPanels,
    hasBalloons,
    hasText,
    hasPanels,
    onDetectPanels,
    isPanelsConfirmed,
    onConfirmPanels,
    onOpenPanelGallery,
    initialCleanUrl
}) => {

    // --- STORE HOOKS ---
    const {
        showMasks, setShowMasks,
        showBalloons, setShowBalloons,
        showText, setShowText,
        showPanelsLayer, setShowPanelsLayer
    } = useEditorUIStore();

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

    // --- DERIVED STATE (Optimistic) ---
    // Use Store (Reactive) OR Prop (Stable) to prevent flicker
    const hasCleanImage = !!(cleanImageUrl || initialCleanUrl);

    // --- STYLES CONSTANTS ---
    const H_HEIGHT = "h-[38px]"; // Standard Height

    const BTN_BASE = `w-full ${H_HEIGHT} px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 select-none border`;

    const BTN_PRIMARY = `${BTN_BASE} bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-sm active:transform active:scale-[0.98]`;
    const BTN_DISABLED = `${BTN_BASE} bg-[#333] text-gray-500 border-transparent cursor-not-allowed opacity-50`;

    // Success/Done State (Ghost Green) - Standardized for all sections
    const BTN_SUCCESS = `flex-1 ${H_HEIGHT} bg-emerald-600/20 text-emerald-500 border-emerald-600/30 rounded flex items-center justify-center gap-2 text-sm font-medium cursor-default border`;
    const BTN_SUCCESS_CLICKABLE = `${BTN_SUCCESS} cursor-pointer hover:bg-emerald-600/30 active:scale-[0.99] transition-all`;

    // Secondary Actions (Gray)
    const BTN_SECONDARY = `${BTN_BASE} bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border-zinc-600`;

    // Eye Button
    const BTN_EYE = (active: boolean) => `w-12 ${H_HEIGHT} flex items-center justify-center rounded border transition-colors ${active ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-zinc-800 text-zinc-500 border-zinc-700'} hover:text-white`;

    return (
        <div className="flex flex-col gap-1">

            {/* 1. MASCARA */}
            <div className="mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">1. Máscara</label>

                {workflowStep === 'idle' || isProcessingBalloons ? (
                    // STATE 1: IDLE / PROCESSING
                    <button
                        onClick={onCreateMask}
                        disabled={isProcessingBalloons || isProcessing}
                        className={isProcessingBalloons || isProcessing ? BTN_DISABLED : BTN_PRIMARY}
                    >
                        {isProcessingBalloons ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> <span>Processando...</span></>
                        ) : (
                            <><Scan className="w-5 h-5" /> <span>Gerar Máscaras</span></>
                        )}
                    </button>
                ) : workflowStep === 'mask' ? (
                    // STATE 2: REVIEW
                    <div className="flex flex-col gap-2">
                        <button onClick={onConfirmMask} className={`${BTN_BASE} bg-emerald-600 hover:bg-emerald-500 text-white border-transparent`}>
                            <Check className="w-4 h-4" /> Confirmar
                        </button>
                        <button onClick={onCreateMask} className={BTN_SECONDARY} title="Refazer Máscara">
                            <RotateCcw className="w-4 h-4" /> Refazer
                        </button>
                    </div>
                ) : (
                    // STATE 3: DONE
                    <div className="flex gap-2">
                        <div className={BTN_SUCCESS}>
                            <Check className="w-4 h-4" /> <span>Máscara Confirmada</span>
                        </div>
                        <button onClick={() => setShowMasks(!showMasks)} className={BTN_EYE(showMasks)} title={showMasks ? 'Esconder' : 'Mostrar'}>
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
                    <div className="flex gap-2">
                        <div className={BTN_SUCCESS}>
                            <Check className="w-4 h-4" /> <span>Detectados</span>
                        </div>
                        <button onClick={() => setShowBalloons(!showBalloons)} className={BTN_EYE(showBalloons)} title={showBalloons ? 'Esconder' : 'Mostrar'}>
                            {showBalloons ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                ) : (
                    <button
                        className={!canDetectBalloons || isProcessingBalloons ? BTN_DISABLED : BTN_PRIMARY}
                        disabled={!canDetectBalloons || isProcessingBalloons}
                        onClick={onDetectBalloon}
                    >
                        {isProcessingBalloons ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> <span>Detectando...</span></>
                        ) : (
                            <><MessageCircle className="w-5 h-5" /> <span>Detectar Balão</span></>
                        )}
                    </button>
                )}
            </div>

            {/* 3. TEXTO */}
            <div className="mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">3. Texto</label>
                {hasText ? (
                    <div className="flex gap-2">
                        <div className={BTN_SUCCESS}>
                            <Check className="w-4 h-4" /> <span>Detectado</span>
                        </div>
                        <button onClick={() => setShowText(!showText)} className={BTN_EYE(showText)} title={showText ? 'Esconder' : 'Mostrar'}>
                            {showText ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                ) : (
                    <button
                        className={!canDetectText || isProcessingOcr ? BTN_DISABLED : BTN_PRIMARY}
                        disabled={!canDetectText || isProcessingOcr}
                        onClick={onDetectText}
                    >
                        {isProcessingOcr ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> <span>Lendo Texto...</span></>
                        ) : (
                            <><Type className="w-5 h-5" /> <span>Detectar Texto</span></>
                        )}
                    </button>
                )}
            </div>

            <div className="h-px bg-[#333] w-full my-2"></div>

            {/* 4. LIMPEZA (INPAINTING) */}
            <div className="mb-4">
                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">4. Limpeza</label>

                <div className="flex gap-2">
                    {/* 1. Main Clean Button (Grow to fill space) */}
                    <button
                        onClick={handleCleanClick}
                        disabled={isProcessingCleaning}
                        className={`${isProcessingCleaning ? BTN_DISABLED : (hasCleanImage ? BTN_SUCCESS_CLICKABLE : BTN_PRIMARY)} whitespace-nowrap`}
                    >
                        {isProcessingCleaning ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full min-w-[16px]"></span> <span>Limpando...</span></>
                        ) : hasCleanImage ? (
                            <>
                                <Check className="w-5 h-5 min-w-[20px]" /> <span>Imagem Limpa</span>
                            </>
                        ) : (
                            <>
                                <Eraser className="w-5 h-5 min-w-[20px]" /> <span>Limpar Imagem</span>
                            </>
                        )}
                    </button>

                    {/* EYE BUTTON (Only appears when clean) */}
                    {hasCleanImage && (
                        <button
                            onClick={toggleVisibility}
                            className={BTN_EYE(!isOriginalVisible)} // Active (Blue/Gray) logic
                            title={isOriginalVisible ? "Ver Imagem Limpa" : "Ver Original"}
                        >
                            {/* Logic: If seeing Original (isOriginalVisible=true), Eye is OFF (crossed). If seeing Clean, Eye is ON. */}
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
                    <button
                        className={!canDetectPanels || isProcessingPanels ? BTN_DISABLED : BTN_PRIMARY}
                        disabled={!canDetectPanels || isProcessingPanels}
                        onClick={onDetectPanels}
                    >
                        {isProcessingPanels ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> <span>Detectando...</span></>
                        ) : (
                            <><Layout className="w-5 h-5" /> <span>Detectar Quadros</span></>
                        )}
                    </button>
                ) : !isPanelsConfirmed ? (
                    // CONFIRMATION STATE
                    <div className="flex flex-col gap-2">
                        <button onClick={onConfirmPanels} className={`${BTN_BASE} bg-emerald-600 hover:bg-emerald-500 text-white border-transparent`}>
                            <Check className="w-4 h-4" /> <span>Confirmar</span>
                        </button>
                        <button onClick={onDetectPanels} className={BTN_SECONDARY} title="Refazer Detecção">
                            <RotateCcw className="w-4 h-4" /> <span>Refazer</span>
                        </button>
                    </div>
                ) : (
                    // STATE 3: DONE (Green Redo + Eye)
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            {/* "Refazer Quadros" Green Button - Replaces "Separar Quadros" Blue */}
                            <button
                                onClick={onDetectPanels} // Calls Detection again (Redo)
                                className={BTN_SUCCESS_CLICKABLE} // Green Ghost Style
                                title="Refazer Quadros"
                            >
                                <RotateCcw className="w-4 h-4" /> <span>Refazer Quadros</span>
                            </button>

                            <button onClick={() => setShowPanelsLayer && setShowPanelsLayer(!showPanelsLayer)} className={BTN_EYE(showPanelsLayer)} title={showPanelsLayer ? 'Esconder' : 'Mostrar'}>
                                {showPanelsLayer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        </div>

                    </div>
                )}

                {/* PERSISTENT GALLERY BUTTON (Always Visible, Disabled if Empty) - MOVED OUTSIDE CONDITIONAL */}
                <button
                    onClick={onOpenPanelGallery}
                    disabled={!hasPanels} // Enabled if panels exist (even if previews need regen)
                    className={`mt-2 ${!hasPanels ? BTN_DISABLED : BTN_SECONDARY}`}
                >
                    <Images className="w-4 h-4" /> Ver Galeria
                </button>
            </div>

        </div>
    );
};
