import React from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

interface StyleControlsProps {
    isDisabled: boolean;
    isEditing: boolean;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    toggleStyle: (style: 'bold' | 'italic') => void;
    toggleDecoration: () => void;
}

export const StyleControls: React.FC<StyleControlsProps> = ({
    isDisabled,
    isEditing,
    isBold,
    isItalic,
    isUnderline,
    toggleStyle,
    toggleDecoration
}) => {
    return (
        <div className="flex bg-white/5 rounded-xl border border-white/5 overflow-hidden h-8 flex-1">
            <button
                onMouseDown={(e) => isEditing && e.preventDefault()}
                onClick={() => toggleStyle('bold')}
                className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${isBold ? 'bg-white/10 text-neon-blue' : 'text-text-secondary'
                    }`}
                title="Negrito"
                disabled={isDisabled}
            ><Bold size={14} /></button>
            <div className="w-px bg-border-color" />
            <button
                onMouseDown={(e) => isEditing && e.preventDefault()}
                onClick={() => toggleStyle('italic')}
                className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${isItalic ? 'bg-white/10 text-neon-blue' : 'text-text-secondary'
                    }`}
                title="Itálico"
                disabled={isDisabled}
            ><Italic size={14} /></button>
            <div className="w-px bg-border-color" />
            <button
                onMouseDown={(e) => isEditing && e.preventDefault()}
                onClick={toggleDecoration}
                className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${isUnderline ? 'bg-white/10 text-neon-blue' : 'text-text-secondary'
                    }`}
                title="Sublinhado"
                disabled={isDisabled}
            ><Underline size={14} /></button>
        </div>
    );
};
