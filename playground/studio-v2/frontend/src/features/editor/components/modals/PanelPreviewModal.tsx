import React from 'react';
import { X, Download } from 'lucide-react';
import { BaseModal } from '@shared/ui/Modal';

interface PanelPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
}

export const PanelPreviewModal: React.FC<PanelPreviewModalProps> = ({ isOpen, onClose, images }) => {
    if (!isOpen) return null;

    const header = (
        <div className="flex items-center justify-between p-4 border-b border-[#333] shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Quadros Separados <span className="text-zinc-500 text-sm font-normal">({images.length})</span>
            </h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800">
                <X size={24} />
            </button>
        </div>
    );

    const footer = (
        <div className="flex justify-end w-full">
            <button onClick={onClose} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors">
                Fechar
            </button>
        </div>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            size="4xl"
            className="h-[85vh] bg-[#1e1e1e] border-[#333]" // Kept explicit colors as BaseModal handles override logic correctly
            header={header}
            footer={footer}
            noPadding={true}
        >
            <div className="h-full p-6 bg-[#121212]">
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
        </BaseModal>
    );
};
