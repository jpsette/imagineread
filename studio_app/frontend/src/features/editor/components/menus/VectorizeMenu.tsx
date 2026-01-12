
import React from 'react';
import {
    Scan,
    Check,
    Eye,
    EyeOff,
    MessageCircle,
    Type,
    Eraser,
    Image as ImageIcon,
    Sparkles,
    RotateCcw
} from 'lucide-react';
import { WorkflowStep } from '../../hooks/useVectorization';
import { Balloon } from '../../../../types';

interface VectorizeMenuProps {
    // State from Hook
    workflowStep: WorkflowStep;
    isProcessing: boolean;
    localCleanUrl: string | null;

    // Actions from Hook
    onCreateMask: () => void;
    onConfirmMask: () => void;
    onDetectBalloon: () => void;
    onDetectText: () => void;
    onCleanImage: () => void;

    // Local Editor State (Toggles)
    showMasks: boolean;
    setShowMasks: (v: boolean) => void;
    showBalloons: boolean;
    setShowBalloons: (v: boolean) => void;
    showText: boolean;
    setShowText: (v: boolean) => void;
    isOriginalImage: boolean;
    setIsOriginalImage: (v: boolean) => void;

    // Data (to check existence)
    balloons: Balloon[];
}

export const VectorizeMenu: React.FC<VectorizeMenuProps> = ({
    workflowStep,
    isProcessing,
    localCleanUrl,
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
    isOriginalImage,
    setIsOriginalImage,
    balloons
}) => {

    // --- HELPER DE ESTILO (Refactored) ---
    const getButtonStyle = (disabled: boolean) =>
        `w-full py-2 px-4 mb-2 text-left rounded-md text-sm font-medium transition-all flex items-center gap-3 select-none border border-transparent ${disabled
            ? 'bg-[#333] text-gray-500 cursor-not-allowed opacity-50'
            : 'bg-[#3f3f46] hover:bg-[#52525b] text-white shadow-sm active:transform active:scale-[0.98]'
        }`;

    return (
        <div className="flex flex-col">

            {/* 1. Criar Máscara (Logica Dividida) */}
            {(workflowStep === 'mask' || workflowStep === 'confirmed') ? (
                <div className="flex gap-1 mb-2 h-[38px]">
                    {/* Status: Gerado */}
                    <div className="flex-1 bg-emerald-600 text-white px-4 rounded-l-md flex items-center gap-2 select-none text-sm font-medium">
                        <Check className="w-4 h-4" />
                        <span>Gerado</span>
                    </div>
                    {/* Action: Refazer */}
                    <button
                        onClick={onCreateMask}
                        disabled={isProcessing}
                        className="bg-[#3f3f46] hover:bg-[#52525b] text-white px-3 rounded-r-md flex items-center justify-center transition-colors border-l border-[#333]"
                        title="Refazer Detecção"
                    >
                        <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            ) : (
                /* Botão Normal: Gerar Máscara */
                <button
                    className={getButtonStyle(isProcessing)}
                    onClick={onCreateMask}
                    disabled={isProcessing}
                >
                    <Scan className="w-5 h-5" /> <span>Gerar Máscara</span>
                </button>
            )}

            {/* 2. Confirmar Máscara */}
            <button
                className={`${getButtonStyle(workflowStep !== 'mask' && workflowStep !== 'confirmed')} ${workflowStep === 'confirmed' ? '!bg-emerald-600 !text-white hover:!bg-emerald-700' : ''
                    }`}
                disabled={workflowStep !== 'mask' && workflowStep !== 'confirmed'}
                onClick={onConfirmMask}
            >
                {workflowStep === 'confirmed' ? (
                    <><Check className="w-5 h-5" /> <span>Máscara Confirmada</span></>
                ) : (
                    <><Check className="w-5 h-5" /> <span>Confirmar Máscara</span></>
                )}
            </button>

            {/* TOGGLE: Visualizar Máscara */}
            <div
                className={`flex items-center gap-2 mt-1 mb-4 px-4 transition-all ${(workflowStep === 'mask' || workflowStep === 'confirmed')
                    ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                    : 'opacity-30 cursor-not-allowed'
                    }`}
                onClick={() => {
                    if (workflowStep === 'mask' || workflowStep === 'confirmed') {
                        setShowMasks(!showMasks);
                    }
                }}
            >
                {showMasks ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                <span className="text-xs text-gray-400 font-medium">
                    {showMasks ? 'Esconder Máscara' : 'Visualizar Máscara'}
                </span>
            </div>

            <div className="h-px bg-[#333] w-full my-2"></div>

            {/* 3. Detectar Balão */}
            <button
                className={`${getButtonStyle(workflowStep !== 'confirmed' || !!localCleanUrl)} ${balloons.some(b => b.type === 'balloon') ? '!bg-emerald-600 !text-white hover:!bg-emerald-700' : ''
                    }`}
                disabled={workflowStep !== 'confirmed' || !!localCleanUrl} // DISABLED IF CLEANED
                onClick={onDetectBalloon}
            >
                {balloons.some(b => b.type === 'balloon') ? (
                    <><Check className="w-5 h-5" /> <span>Balões Detectados</span></>
                ) : (
                    <><MessageCircle className="w-5 h-5" /> <span>Detectar Balão</span></>
                )}
            </button>

            {/* TOGGLE: Visualizar Balões */}
            <div
                className={`flex items-center gap-2 mt-1 mb-4 px-4 transition-all ${balloons.some(b => b.type === 'balloon')
                    ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                    : 'opacity-30 cursor-not-allowed'
                    }`}
                onClick={() => {
                    if (balloons.some(b => b.type === 'balloon')) {
                        setShowBalloons(!showBalloons);
                    }
                }}
            >
                {showBalloons ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                <span className="text-xs text-gray-400 font-medium">
                    {showBalloons ? 'Esconder Balões' : 'Visualizar Balões'}
                </span>
            </div>

            {/* 4. Detectar Texto */}
            <button
                className={`${getButtonStyle(workflowStep !== 'confirmed' || isProcessing || !!localCleanUrl)} ${balloons.some(b => b.text && b.text.length > 0) ? '!bg-emerald-600 !text-white hover:!bg-emerald-700' : ''}`}
                disabled={workflowStep !== 'confirmed' || isProcessing || !!localCleanUrl} // DISABLED IF CLEANED
                onClick={onDetectText}
            >
                {balloons.some(b => b.text && b.text.length > 0) ? (
                    <><Check className="w-5 h-5" /> <span>Texto Detectado</span></>
                ) : (
                    <><Type className="w-5 h-5" /> <span>Detectar Texto</span></>
                )}
            </button>

            {/* TOGGLE: Visualizar Texto */}
            <div
                className={`flex items-center gap-2 mt-1 mb-4 px-4 transition-all ${balloons.some(b => b.text && b.text.length > 0)
                    ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                    : 'opacity-30 cursor-not-allowed'
                    } `}
                onClick={() => {
                    if (balloons.some(b => b.text && b.text.length > 0)) {
                        setShowText(!showText);
                    }
                }}
            >
                {showText ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                <span className="text-xs text-gray-400 font-medium">
                    {showText ? 'Esconder Texto' : 'Visualizar Texto'}
                </span>
            </div>

            <div className="h-px bg-[#333] w-full my-2"></div>

            {/* 5. Limpar Imagem */}
            <button
                className={`${getButtonStyle(workflowStep !== 'confirmed' || isProcessing)} ${localCleanUrl ? '!bg-emerald-600 !text-white hover:!bg-emerald-700' : ''}`}
                disabled={workflowStep !== 'confirmed' || isProcessing}
                onClick={onCleanImage}
            >
                {localCleanUrl ? (
                    <><Check className="w-5 h-5" /> <span className="font-medium text-sm">Imagem Limpa</span></>
                ) : (
                    isProcessing ? (
                        <><span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> <span className="font-medium text-sm">Limpando...</span></>
                    ) : (
                        <><Eraser className="w-5 h-5" /> <span className="font-medium text-sm">Limpar Imagem</span></>
                    )
                )}
            </button>

            {/* TOGGLE: Ver Original */}
            <div
                className={`flex items-center gap-2 mt-1 px-4 transition-all ${localCleanUrl
                    ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                    : 'opacity-30 cursor-not-allowed'
                    } `}
                onClick={() => {
                    if (localCleanUrl) {
                        setIsOriginalImage(!isOriginalImage);
                    }
                }}
            >
                {isOriginalImage ? <ImageIcon className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                <span className="text-xs text-gray-400 font-medium">
                    {isOriginalImage ? 'Ver Imagem Limpa' : 'Ver Imagem Original'}
                </span>
            </div>

        </div>
    );
};
