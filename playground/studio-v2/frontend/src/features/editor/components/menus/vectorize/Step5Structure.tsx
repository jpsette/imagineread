import React from 'react';
import { Layout, Check, RotateCcw, Eye, EyeOff, Images } from 'lucide-react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { BTN_DISABLED, BTN_PRIMARY, BTN_BASE, BTN_SECONDARY, BTN_SUCCESS_CLICKABLE, BTN_EYE } from './styles';

interface Step5StructureProps {
    hasPanels?: boolean;
    canDetectPanels?: boolean;
    isPanelsConfirmed?: boolean;
    isProcessingPanels: boolean;
    onDetectPanels?: () => void; // Made optional in interface to match usage safety, but logic requires it
    onConfirmPanels?: () => void;
    onOpenPanelGallery?: () => void;
    onAddPanel?: () => void;
}

export const Step5Structure: React.FC<Step5StructureProps> = ({
    hasPanels,
    canDetectPanels,
    isPanelsConfirmed,
    isProcessingPanels, // FIX: Restored this prop
    onDetectPanels, // FIX: Restored this prop
    onConfirmPanels,
    onOpenPanelGallery,
    onAddPanel
}) => {
    const { showPanelsLayer, setShowPanelsLayer } = useEditorUIStore();

    // Safety wrapper if onDetectPanels is needed but undefined in props (though it shouldn't be)
    const handleDetect = () => onDetectPanels && onDetectPanels();

    return (
        <div className="mb-4">


            {!hasPanels ? (
                <button
                    className={!canDetectPanels || isProcessingPanels ? BTN_DISABLED : BTN_PRIMARY}
                    disabled={!canDetectPanels || isProcessingPanels}
                    onClick={handleDetect}
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
                    <button onClick={handleDetect} className={BTN_SECONDARY} title="Refazer Detecção">
                        <RotateCcw className="w-4 h-4" /> <span>Refazer</span>
                    </button>
                </div>
            ) : (
                // STATE 3: DONE (Green Redo + Eye)
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        {/* "Refazer Quadros" Green Button - Replaces "Separar Quadros" Blue */}
                        <button
                            onClick={handleDetect} // Calls Detection again (Redo)
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
            <div className="flex flex-col mt-2 gap-2">
                {/* MANUAL ADD PANEL (For complex cases where detection fails) - Added as requested */}
                <button
                    onClick={onAddPanel}
                    className={BTN_SECONDARY}
                    title="Adicionar Quadro Manualmente"
                >
                    <div className="w-4 h-4 flex items-center justify-center border border-current rounded text-[10px]">+</div>
                    <span>Adicionar Quadro</span>
                </button>

                <button
                    onClick={onOpenPanelGallery}
                    disabled={!hasPanels} // Enabled if panels exist (even if previews need regen)
                    className={`${!hasPanels ? BTN_DISABLED : BTN_SECONDARY}`}
                >
                    <Images className="w-4 h-4" /> Ver Quadros
                </button>
            </div>
        </div>
    );
};
