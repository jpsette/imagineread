import React from 'react';
import { Scan, Check, Eye, EyeOff } from 'lucide-react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { WorkflowStep } from '../../../hooks/useVectorization';
import { BTN_DISABLED, BTN_PRIMARY, BTN_SUCCESS, BTN_EYE } from './styles';
interface Step1MaskProps {
    workflowStep: WorkflowStep;
    isProcessingBalloons: boolean;
    isProcessing: boolean;
    isLoading: boolean;
    onCreateMask: () => void;
}

export const Step1Mask: React.FC<Step1MaskProps> = ({
    workflowStep,
    isProcessingBalloons,
    isProcessing,
    isLoading,
    onCreateMask
}) => {
    const { showMasks, setShowMasks } = useEditorUIStore();

    return (
        <div className="mb-4">
            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">1. Máscara</label>

            {workflowStep === 'idle' || isProcessingBalloons ? (
                // STATE 1: IDLE / PROCESSING
                <button
                    onClick={onCreateMask}
                    disabled={isProcessingBalloons || isProcessing || isLoading}
                    className={isProcessingBalloons || isProcessing || isLoading ? BTN_DISABLED : BTN_PRIMARY}
                >
                    {isProcessingBalloons ? (
                        <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> <span>Processando...</span></>
                    ) : (
                        <><Scan className="w-5 h-5" /> <span>Gerar Máscaras</span></>
                    )}
                </button>
            ) : (
                // STATE 2: DONE (Success + Eye) - Now immediate, no Confirm step!
                <div className="flex gap-2">
                    <div className={BTN_SUCCESS}>
                        <Check className="w-4 h-4" /> <span>Máscara Criada</span>
                    </div>
                    <button onClick={() => setShowMasks(!showMasks)} className={BTN_EYE(showMasks)} title={showMasks ? 'Esconder' : 'Mostrar'}>
                        {showMasks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </div>
    );
};
