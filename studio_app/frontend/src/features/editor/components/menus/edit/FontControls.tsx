import React, { forwardRef } from 'react';
import { Balloon } from '@shared/types';

interface FontControlsProps {
    selectedBalloon: Balloon | undefined;
    customFonts: string[];
    isDisabled: boolean;
    handleFontChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FontControls = forwardRef<HTMLInputElement, FontControlsProps>(({
    selectedBalloon,
    customFonts,
    isDisabled,
    handleFontChange,
    handleFileUpload
}, ref) => {
    return (
        <>
            {/* Font Family Select */}
            <select
                value={selectedBalloon?.fontFamily || 'Comic Neue'}
                onChange={handleFontChange}
                disabled={isDisabled}
                className="w-full bg-white/5 border border-white/5 rounded-xl h-8 text-[11px] text-zinc-300 px-2 outline-none focus:border-neon-blue/50 appearance-none pointer-events-auto cursor-pointer hover:bg-white/10 transition-all font-medium"
            >
                <option value="Comic Neue">Comic Neue (Padrão)</option>
                <option value="Bangers">Bangers</option>

                {/* Custom Fonts */}
                {customFonts.length > 0 && (
                    <optgroup label="Minhas Fontes">
                        {customFonts.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </optgroup>
                )}

                <option value="ADD_NEW" className="font-bold text-cyan-400">➕ Selecionar Fonte do PC...</option>
            </select>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={ref}
                className="hidden"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFileUpload}
            />
        </>
    );
});

FontControls.displayName = 'FontControls';
