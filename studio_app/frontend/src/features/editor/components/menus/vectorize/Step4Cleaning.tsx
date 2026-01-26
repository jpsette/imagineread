import React from 'react';
import { Eraser, Check, Eye, EyeOff } from 'lucide-react';
import { useEditorUIStore } from '../../../uiStore';
import { BTN_DISABLED, BTN_PRIMARY, BTN_SUCCESS_CLICKABLE, BTN_EYE } from './styles';

interface Step4CleaningProps {
    hasCleanImage: boolean;
    isProcessingCleaning: boolean;
    isProcessing: boolean;
    isLoading: boolean;
    onCleanImage: (onSuccess?: (url: string) => void) => void;
}

export const Step4Cleaning: React.FC<Step4CleaningProps> = ({
    hasCleanImage,
    isProcessingCleaning,
    isProcessing,
    isLoading,
    onCleanImage
}) => {
    const { isOriginalVisible, toggleVisibility, setCleanImage } = useEditorUIStore();

    const handleCleanClick = () => {
        onCleanImage((url: string) => {
            console.log("✨ Updating Editor with Clean Image:", url);
            if (setCleanImage) {
                setCleanImage(url);
            }
        });
    };

    return (
        <div className="mb-4">
            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">4. Limpeza</label>

            <div className="flex gap-2">
                {/* 1. Main Clean Button (Grow to fill space) */}
                <button
                    onClick={handleCleanClick}
                    disabled={isProcessingCleaning || isProcessing || isLoading}
                    className={`${(isProcessingCleaning || isProcessing || isLoading) ? BTN_DISABLED : (hasCleanImage ? BTN_SUCCESS_CLICKABLE : BTN_PRIMARY)} whitespace-nowrap`}
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
    );
};
