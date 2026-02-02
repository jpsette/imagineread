import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { getLanguageDisplay } from '@app/store/useTranslationStore';

interface TranslateLoadingOverlayProps {
    isTranslating: boolean;
    sourceLang?: string | null;
    targetLang?: string | null;
}

export const TranslateLoadingOverlay: React.FC<TranslateLoadingOverlayProps> = ({
    isTranslating,
    sourceLang,
    targetLang
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isTranslating || !mounted) return null;

    const sourceDisplay = getLanguageDisplay(sourceLang ?? null);
    const targetDisplay = getLanguageDisplay(targetLang ?? null);

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-6 relative z-10" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Traduzindo Página</h2>
            <p className="text-zinc-400 text-lg font-medium mb-6">Processando textos com IA...</p>

            {/* Language Flags */}
            {sourceLang && targetLang && (
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">{sourceDisplay.flag}</span>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{sourceDisplay.name}</span>
                    </div>

                    <ArrowRight className="w-6 h-6 text-cyan-500 animate-pulse" />

                    <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">{targetDisplay.flag}</span>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{targetDisplay.name}</span>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
