import React from 'react';
import { Eraser, Check, Eye, EyeOff } from 'lucide-react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { BTN_DISABLED, BTN_PRIMARY, BTN_SUCCESS_CLICKABLE, BTN_EYE } from './styles';

interface Step4CleaningProps {
    hasCleanImage: boolean;
    isProcessingCleaning: boolean;
    isProcessing: boolean;
    isLoading: boolean;
    isFetching?: boolean;
    onCleanImage: (onSuccess?: (url: string) => void) => void;
}

export const Step4Cleaning: React.FC<Step4CleaningProps> = ({
    hasCleanImage,
    isProcessingCleaning,
    isProcessing,
    isLoading,
    isFetching,
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

    // Logic: Only show the "Success Row" if we are truly clean and NOT loading/fetching/processing
    // This prevents the UI from trying to show "Clean" while data is legally stale or refreshing
    const showSuccessState = hasCleanImage && !isLoading && !isFetching && !isProcessingCleaning && !isProcessing;

    return (
        <div className="mb-4">


            {showSuccessState ? (
                /* SUCCESS STATE (Row with Eye) - Matches Step2 Structure */
                <div className="flex gap-2">
                    <button
                        onClick={handleCleanClick}
                        className={BTN_SUCCESS_CLICKABLE}
                        title="Imagem Limpa (Clique para refazer)"
                    >
                        <Check className="w-5 h-5 min-w-[20px]" /> <span>Imagem Limpa</span>
                    </button>

                    <button
                        onClick={toggleVisibility}
                        className={BTN_EYE(!isOriginalVisible)}
                        title={isOriginalVisible ? "Ver Imagem Limpa" : "Ver Original"}
                    >
                        {isOriginalVisible ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>
                </div>
            ) : (
                /* ACTION / LOADING STATE (Single Button) */
                <button
                    onClick={handleCleanClick}
                    disabled={isProcessingCleaning || isProcessing || isLoading || isFetching}
                    className={(isProcessingCleaning || isProcessing || isLoading || isFetching) ? BTN_DISABLED : BTN_PRIMARY}
                >
                    {isLoading || isFetching ? (
                        /* LOADING */
                        <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full min-w-[16px]"></span> <span>Carregando...</span></>
                    ) : isProcessingCleaning ? (
                        /* PROCESSING */
                        <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full min-w-[16px]"></span> <span>Limpando...</span></>
                    ) : (
                        /* DEFAULT ACTION */
                        <><Eraser className="w-5 h-5 min-w-[20px]" /> <span>Limpar Imagem</span></>
                    )}
                </button>
            )}
        </div>
    );
};
