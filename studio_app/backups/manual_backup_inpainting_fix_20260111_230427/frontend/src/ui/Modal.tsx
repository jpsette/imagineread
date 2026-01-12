import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
                    <h3 className="font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
