import React from 'react';
import { X, Download } from 'lucide-react';

interface PanelPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
}

export const PanelPreviewModal: React.FC<PanelPreviewModalProps> = ({ isOpen, onClose, images }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e1e] border border-[#333] rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#333] shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Quadros Separados <span className="text-zinc-500 text-sm font-normal">({images.length})</span>
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#121212] custom-scrollbar">
                    {images.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                            Nenhum quadro para exibir.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 place-items-start">
                            {images.map((img, idx) => (
                                <div key={idx} className="w-full bg-[#1e1e1e] p-2 rounded-lg border border-[#333] shadow-lg relative group">
                                    <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                                        #{idx + 1}
                                    </div>
                                    <img
                                        src={img}
                                        alt={`Panel ${idx + 1}`}
                                        className="w-full h-auto rounded border border-zinc-800 bg-[url('/transparent-bg.png')] bg-repeat"
                                    />
                                    <div className="mt-2 flex justify-between items-center px-1">
                                        <span className="text-[10px] text-zinc-500 uppercase font-mono">Quadro {idx + 1}</span>
                                        <a href={img} download={`panel-${idx + 1}.png`} className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                                            <Download size={12} /> Baixar
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#333] flex justify-end shrink-0 bg-[#1e1e1e] rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
