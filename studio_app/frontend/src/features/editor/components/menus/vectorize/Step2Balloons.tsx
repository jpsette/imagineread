import React from 'react';
import { MessageCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { BTN_DISABLED, BTN_PRIMARY, BTN_SUCCESS, BTN_EYE } from './styles';

interface Step2BalloonsProps {
    hasBalloons: boolean;
    canDetectBalloons: boolean;
    isProcessingBalloons: boolean;
    isLoading: boolean;
    onDetectBalloon: () => void;
}

export const Step2Balloons: React.FC<Step2BalloonsProps> = ({
    hasBalloons,
    canDetectBalloons,
    isProcessingBalloons,
    isLoading,
    onDetectBalloon
}) => {
    const { showBalloons, setShowBalloons } = useEditorUIStore();

    return (
        <div className="mb-4">
            <label className="text-[10px] text-text-muted font-bold uppercase mb-2 block">2. Balões</label>
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
                    className={!canDetectBalloons || isProcessingBalloons || isLoading ? BTN_DISABLED : BTN_PRIMARY}
                    disabled={!canDetectBalloons || isProcessingBalloons || isLoading}
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
    );
};
