import React from 'react';
import { Activity, AlertTriangle, Zap, X } from 'lucide-react';

interface DiagnosticsPanelProps {
    pageCount: number;

    performanceMode: boolean;
    setPerformanceMode: (mode: boolean) => void;
    onClose: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
    pageCount,

    performanceMode,
    setPerformanceMode,
    onClose
}) => {
    // Estimate Memory: Assuming avg 4K image (24MB uncompressed) if no thumbnail
    // This is a rough estimation to show the user "Why" it crashes.
    const estimatedVRAM = pageCount * 24;
    const isCritical = estimatedVRAM > 1000; // > 1GB VRAM is dangerous for browser tabs

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl p-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4 border-b border-[#27272a] pb-2">
                <div className="flex items-center gap-2 text-white font-bold">
                    <Activity size={16} className="text-accent-blue" />
                    Diagnóstico de Sistema
                </div>
                <button onClick={onClose} className="text-text-secondary hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-xs text-text-secondary">
                    <span>Páginas Carregadas:</span>
                    <span className="text-white font-mono">{pageCount}</span>
                </div>


                <div className={`p-3 rounded border ${isCritical ? 'bg-red-900/20 border-red-900/50' : 'bg-green-900/20 border-green-900/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className={isCritical ? "text-red-400" : "text-green-400"} />
                        <span className={`text-xs font-bold ${isCritical ? "text-red-400" : "text-green-400"}`}>
                            {isCritical ? "Alta Carga de VRAM Detectada" : "Uso de Memória Normal"}
                        </span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-tight">
                        Estimativa de ~{estimatedVRAM}MB de memória gráfica necessária para renderizar as imagens em alta resolução.
                        {isCritical && " O navegador pode bloquear renderização (Tile Memory Exceeded)."}
                    </p>
                </div>

                <div className="pt-2 border-t border-[#27272a]">
                    <button
                        onClick={() => setPerformanceMode(!performanceMode)}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition-all ${performanceMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-[#27272a] text-text-secondary hover:bg-[#3f3f46] hover:text-white'}`}
                    >
                        <Zap size={14} fill={performanceMode ? "currentColor" : "none"} />
                        {performanceMode ? "Modo Performance ATIVADO" : "Ativar Modo Performance"}
                    </button>
                    <p className="text-[10px] text-text-secondary mt-2 text-center">
                        Desativa animações pesadas e simplifica a renderização para evitar travamentos.
                    </p>
                </div>
            </div>
        </div>
    );
};
