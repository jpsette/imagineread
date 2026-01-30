import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
};

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: ModalSize;
    className?: string; // Additional classes for the container
    header?: React.ReactNode; // Complete custom header
    footer?: React.ReactNode; // Complete custom footer
    noPadding?: boolean; // If true, removes padding from body
    showCloseButton?: boolean;
}

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
    header,
    footer,
    noPadding = false,
    showCloseButton = true
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Check if custom bg/border are provided in className, otherwise use defaults
    // Note: This is a simple check. For robust merging, libraries like tailwind-merge are better.
    // Here we prioritize explicit classes in 'className' if they exist, but since we simply append,
    // we rely on CSS cascade. To be cleaner, we won't change defaults dynamically but relies on user checking.
    // However, to fix the specific "double background" issue reported, we will stick to a consistent dark theme
    // or allow the parent to dictate fully.

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] isolation-isolate flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
        >
            {/* Backdrop click handler can be added here if we want closeOnBackdrop */}
            <div
                className={`
                    w-full 
                    rounded-xl 
                    shadow-2xl 
                    flex flex-col 
                    overflow-hidden 
                    max-h-[90vh]
                    ${SIZE_CLASSES[size]}
                    ${className.includes('bg-') ? '' : 'bg-[#18181b]'} 
                    ${className.includes('border-') ? '' : 'border border-[#27272a]'}
                    ${className}
                `}
                role="dialog"
                aria-modal="true"
            >
                {/* Header Logic: Custom Header OR Standard Title OR None */}
                {header ? (
                    header
                ) : title && (
                    <div className="flex items-center justify-between p-6 border-b border-[#27272a] shrink-0">
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className={`overflow-y-auto custom-scrollbar flex-1 ${noPadding ? '' : 'p-6'}`}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-[#27272a] bg-[#18181b] shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
