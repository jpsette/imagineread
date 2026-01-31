import React from 'react';
import { Type, Check, Eye, EyeOff } from 'lucide-react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { BTN_DISABLED, BTN_PRIMARY, BTN_SUCCESS, BTN_EYE } from './styles';

interface Step3TextProps {
    hasText: boolean;
    canDetectText: boolean;
    isProcessingOcr: boolean;
    isLoading: boolean;
    onDetectText: () => void;
}

export const Step3Text: React.FC<Step3TextProps> = ({
    hasText,
    canDetectText,
    isProcessingOcr,
    isLoading,
    onDetectText
}) => {
    const { showText, setShowText } = useEditorUIStore();

    return (
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
                    className={!canDetectText || isProcessingOcr || isLoading ? BTN_DISABLED : BTN_PRIMARY}
                    disabled={!canDetectText || isProcessingOcr || isLoading}
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
    );
};
