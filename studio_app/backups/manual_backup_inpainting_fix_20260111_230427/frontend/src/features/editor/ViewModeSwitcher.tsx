import React from 'react';
import { Eye, Eraser, ScanEye } from 'lucide-react';

export type ViewMode = 'original' | 'clean' | 'mask';

interface ViewModeSwitcherProps {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    hasClean: boolean;
    hasMask: boolean;
}

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
    mode,
    setMode,
    hasClean,
    hasMask
}) => {

    const getButtonClass = (isActive: boolean, isDisabled: boolean) => {
        const base = "px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all backdrop-blur-md";
        if (isDisabled) return `${base} bg-white/5 text-gray-500 cursor-not-allowed opacity-50`;
        if (isActive) return `${base} bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105`;
        return `${base} bg-black/40 text-gray-300 hover:bg-black/60 hover:text-white border border-white/5 hover:border-white/10`;
    };

    return (
        <div className="absolute top-4 left-4 z-[60] flex items-center gap-1 p-1 rounded-lg bg-[#09090b]/80 border border-[#27272a] shadow-2xl backdrop-blur-xl animate-fadeIn">
            <button
                onClick={() => setMode('original')}
                className={getButtonClass(mode === 'original', false)}
            >
                <Eye size={14} />
                Original
            </button>

            <button
                onClick={() => setMode('clean')}
                disabled={!hasClean}
                className={getButtonClass(mode === 'clean', !hasClean)}
            >
                <Eraser size={14} />
                Limpa
            </button>

            <button
                onClick={() => setMode('mask')}
                disabled={!hasMask}
                className={getButtonClass(mode === 'mask', !hasMask)}
            >
                <ScanEye size={14} />
                Máscara
            </button>
        </div>
    );
};
