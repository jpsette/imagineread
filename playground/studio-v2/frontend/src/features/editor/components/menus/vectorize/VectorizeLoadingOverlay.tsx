import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface VectorizeLoadingOverlayProps {
    isProcessingBalloons: boolean;
    isProcessingOcr: boolean;
    isProcessingPanels: boolean;
    isProcessingCleaning: boolean;
}

export const VectorizeLoadingOverlay: React.FC<VectorizeLoadingOverlayProps> = ({
    isProcessingBalloons,
    isProcessingOcr,
    isProcessingPanels,
    isProcessingCleaning
}) => {
    // Only show if something is happening
    const isBusy = isProcessingBalloons || isProcessingOcr || isProcessingPanels || isProcessingCleaning;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const message = useMemo(() => {
        if (isProcessingCleaning) return "Limpando a imagem...";
        if (isProcessingPanels) return "Estruturando quadros...";

        // Detailed Hero Flow
        if (isProcessingBalloons) return "Detectando máscaras e desenhando balões...";
        if (isProcessingOcr) return "Identificando textos e legendas...";

        return "Processando...";
    }, [isProcessingBalloons, isProcessingOcr, isProcessingPanels, isProcessingCleaning]);

    if (!isBusy || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6 relative z-10" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Otimizando Página</h2>
            <p className="text-zinc-400 text-lg animate-pulse font-medium">{message}</p>

            {/* Progress Steps (Visual Flair) */}
            <div className="flex gap-2 mt-8">
                <StepIndicator active={isProcessingBalloons || isProcessingOcr} done={isProcessingOcr} label="Estrutura" />
                <div className="w-8 h-px bg-zinc-800 self-center"></div>
                <StepIndicator active={isProcessingOcr} done={false} label="Texto" />
            </div>
        </div>,
        document.body
    );
};

const StepIndicator = ({ active, done, label }: { active: boolean, done: boolean, label: string }) => (
    <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-30'}`}>
        <div className={`w-3 h-3 rounded-full ${done ? 'bg-green-500' : (active ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700')}`}></div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
);
