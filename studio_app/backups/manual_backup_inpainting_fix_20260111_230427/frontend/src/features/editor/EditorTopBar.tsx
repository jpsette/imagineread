import React from 'react';
import { Zap, MessageSquare, Wand2, PenTool, Check, X } from 'lucide-react';

export type WorkspaceMode = 'vectorize' | 'editorial' | 'translate' | 'animate' | 'access';

interface EditorTopBarProps {
    activeWorkspace: WorkspaceMode;
    setActiveWorkspace: (mode: WorkspaceMode) => void;
    comicName?: string;
    pageName?: string;
    onBack: () => void;

    // Actions for Vectorize Mode
    actions: {
        onAddBalloon: () => void;
        onDetect: () => void;
        onImport: () => void;
        onOCR: () => void;
        onClean: () => void;
        isAnalyzingYOLO: boolean;
        isReadingOCR: boolean;
        isCleaning: boolean;
        // Status Flags
        hasDetections: boolean;
        hasBalloons: boolean;
        hasText: boolean;
        isClean: boolean;  // True if mask or clean image exists

        showClean: boolean;
        setShowClean: (show: boolean) => void;
    }
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
    activeWorkspace,
    setActiveWorkspace,
    comicName,
    pageName,
    onBack,
    actions
}) => {

    const tabs: { id: WorkspaceMode; label: string; icon?: React.ReactNode }[] = [
        { id: 'vectorize', label: 'Vetorização', icon: <Wand2 size={14} /> },
        { id: 'editorial', label: 'Editorial', icon: <PenTool size={14} /> },
        { id: 'translate', label: 'Tradução', icon: undefined },
        { id: 'animate', label: 'Animação', icon: undefined },
    ];

    // Helper for button styles
    const getButtonStyle = (isActive: boolean, isLoading: boolean, isDisabled: boolean = false) => {
        if (isLoading) return 'bg-[#27272a] text-gray-500 cursor-wait border border-[#3f3f46]';
        if (isDisabled) return 'bg-[#27272a] text-gray-600 cursor-not-allowed border border-[#27272a]';

        if (isActive) {
            return 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 border border-green-500';
        }

        // Default Primary Action Style
        return 'bg-[#27272a] hover:bg-[#3f3f46] text-gray-200 border border-[#3f3f46] hover:border-gray-500';
    };

    return (
        <div className="flex flex-col bg-[#141416] border-b border-[#27272a] shadow-sm z-40 transition-all duration-300">
            {/* 1. Main Navbar */}
            <div className="flex items-center justify-between px-4 h-14">
                {/* Left: Breadcrumbs */}
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                        {comicName || 'Quadrinho'}
                    </button>
                    <span className="text-gray-600">/</span>
                    <span className="text-sm font-bold text-white shrink-0 max-w-[150px] truncate">{pageName || 'Página'}</span>
                </div>

                {/* Center: Workspace Tabs */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
                    {tabs.map(tab => {
                        const isActive = activeWorkspace === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveWorkspace(tab.id)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${isActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5 border-b-2 border-transparent'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right: Close Button */}
                <div className="flex items-center">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 text-gray-500 rounded-full transition-colors"
                        title="Fechar Editor"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* 2. Sub-Bar (Contextual Grid) */}
            {activeWorkspace === 'vectorize' && (
                <div className="h-16 w-full border-b border-[#27272a] bg-[#141416] flex items-center justify-center px-4 shrink-0 animate-slideDown origin-top">
                    <div className="grid grid-cols-4 gap-3 w-full max-w-4xl">

                        {/* 1. DETECT */}
                        <button
                            onClick={actions.onDetect}
                            disabled={actions.isAnalyzingYOLO}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all transform active:scale-95 ${getButtonStyle(actions.hasDetections, actions.isAnalyzingYOLO)
                                }`}
                        >
                            {actions.hasDetections ? <Check size={14} /> : <Zap size={14} fill="currentColor" />}
                            {actions.isAnalyzingYOLO ? 'Detectando...' : (actions.hasDetections ? 'Detectado' : '1. Detectar')}
                        </button>

                        {/* 2. IMPORT */}
                        <button
                            onClick={actions.onImport}
                            disabled={!actions.hasDetections}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all transform active:scale-95 ${getButtonStyle(actions.hasBalloons, false, !actions.hasDetections)
                                }`}
                        >
                            {actions.hasBalloons ? <Check size={14} /> : <Wand2 size={14} />}
                            {actions.hasBalloons ? 'Importado' : '2. Importar'}
                        </button>

                        {/* 3. OCR */}
                        <button
                            onClick={actions.onOCR}
                            disabled={actions.isReadingOCR || !actions.hasBalloons}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all transform active:scale-95 ${getButtonStyle(actions.hasText, actions.isReadingOCR, !actions.hasBalloons)
                                }`}
                        >
                            {actions.hasText ? <Check size={14} /> : <MessageSquare size={14} fill="currentColor" />}
                            {actions.isReadingOCR ? 'Lendo...' : (actions.hasText ? 'Texto Lido' : '3. Ler Texto')}
                        </button>

                        {/* 4. CLEAN */}
                        <button
                            onClick={actions.onClean}
                            disabled={actions.isCleaning || !actions.hasBalloons}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all transform active:scale-95 ${getButtonStyle(actions.isClean, actions.isCleaning, !actions.hasBalloons)
                                }`}
                        >
                            {actions.isClean ? <Check size={14} /> : <Wand2 size={14} />}
                            {actions.isCleaning ? 'Limpando...' : (actions.isClean ? 'Página Limpa' : '4. Limpar Página')}
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
};
