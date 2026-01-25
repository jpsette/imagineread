import React from 'react';
import { Type, Bold, Italic, Underline, Baseline } from 'lucide-react';
import { Balloon } from '../../../../types';

import { useEditorStore } from '../../store';
import { useEditorUIStore } from '../../uiStore';

export const EditMenu: React.FC = () => {
    // Stores
    const { balloons, updateBalloon } = useEditorStore();
    const { selectedId } = useEditorUIStore();

    // Find balloon safely
    const selectedBalloon = balloons.find(b => b.id === selectedId);
    const isDisabled = !selectedBalloon;
    const isEditing = false; // TODO: If we need this state, we should add it to UI Store or Local logic

    // Wrapper to match signature
    const onUpdate = (id: string, attrs: Partial<Balloon>) => updateBalloon(id, attrs);

    // State for custom loaded fonts
    const [customFonts, setCustomFonts] = React.useState<string[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Safe handlers that won't crash if called unexpectedly
    const handleUpdate = (attr: Partial<Balloon>) => {
        if (selectedBalloon) onUpdate(selectedBalloon.id, attr);
    };

    // Helper to toggle Konva font styles
    const toggleStyle = (style: 'bold' | 'italic') => {
        if (!selectedBalloon) return;

        // RICH TEXT MODE
        if (isEditing) {
            document.execCommand(style);
            return;
        }

        // OBJECT MODE (Legacy)
        const current = selectedBalloon.fontStyle || 'normal';
        let parts = current === 'normal' ? [] : current.split(' ');

        if (parts.includes(style)) {
            parts = parts.filter(p => p !== style);
        } else {
            parts.push(style);
        }

        const newStyle = parts.length > 0 ? parts.join(' ') : 'normal';
        handleUpdate({ fontStyle: newStyle });
    };

    // Helper for Underline
    const toggleDecoration = () => {
        if (!selectedBalloon) return;

        // RICH TEXT MODE
        if (isEditing) {
            document.execCommand('underline');
            return;
        }

        const current = selectedBalloon.textDecoration || '';
        handleUpdate({ textDecoration: current === 'underline' ? '' : 'underline' });
    };

    const isBold = (selectedBalloon?.fontStyle || '').includes('bold');
    const isItalic = (selectedBalloon?.fontStyle || '').includes('italic');
    const isUnderline = (selectedBalloon?.textDecoration || '').includes('underline');

    // Handle Font Selection Change
    const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'ADD_NEW') {
            fileInputRef.current?.click();
        } else {
            // If editing, use execCommand (though fontName might need work across browsers, usually 'fontName')
            // For now, let's keep font-family global for the balloon to ensure consistent look, 
            // OR support mixed fonts? Requirement only mentioned Bold/Italic/Size.
            // Let's keep Font Family Global for now to avoid complexity, unless requested.
            handleUpdate({ fontFamily: value });
        }
    };

    // Handle File Upload for Custom Font
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            // Create a unique font name based on file name (remove extension)
            const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "");

            // Create FontFace
            const fontFace = new FontFace(fontName, buffer);

            // Wait for it to load
            await fontFace.load();

            // Add to document
            document.fonts.add(fontFace);

            // Update State to show in list
            setCustomFonts(prev => [...prev, fontName]);

            // Select it immediately
            handleUpdate({ fontFamily: fontName });

        } catch (err) {
            console.error("Failed to load font:", err);
            // Optionally notify user
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={`flex flex-col gap-4 p-1 transition-opacity duration-200 ${isDisabled ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'}`}>

            {/* 1. TEXT CONTENT */}
            <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Type size={12} /> Conteúdo
                </label>
                <textarea
                    className="w-full bg-[#18181b] border border-[#333] rounded p-2 text-xs text-white focus:border-cyan-500/50 outline-none min-h-[80px] resize-y placeholder:text-zinc-700 disabled:bg-[#121212] disabled:border-transparent leading-relaxed"
                    value={selectedBalloon?.text || ''}
                    onChange={(e) => handleUpdate({ text: e.target.value })}
                    placeholder={isDisabled ? "Selecione para editar..." : "Digite o texto..."}
                    disabled={isDisabled || isEditing}
                />
            </div>

            {/* 2. TYPOGRAPHY TOOLS */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Baseline size={12} /> Tipografia
                </label>

                {/* Font Family Select */}
                <select
                    value={selectedBalloon?.fontFamily || 'Comic Neue'}
                    onChange={handleFontChange}
                    disabled={isDisabled}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded h-8 text-xs text-zinc-300 px-2 outline-none focus:border-cyan-500/50 appearance-none pointer-events-auto cursor-pointer hover:bg-zinc-700 transition-colors"
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
                    ref={fileInputRef}
                    className="hidden"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFileUpload}
                />

                {/* Formatting Row */}
                <div className="flex gap-2">
                    {/* Size */}
                    <div className="relative w-14 group">
                        <input
                            type="number"
                            min="8" max="200"
                            value={selectedBalloon?.fontSize || 14}
                            onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
                            className="w-full bg-white border border-zinc-700 rounded h-8 text-center text-xs text-black font-bold outline-none"
                            disabled={isDisabled}
                            title="Tamanho da Fonte"
                        />
                    </div>

                    {/* B / I / U Toggles */}
                    <div className="flex bg-zinc-800 rounded border border-zinc-700 overflow-hidden h-8 flex-1">
                        <button
                            onMouseDown={(e) => isEditing && e.preventDefault()}
                            onClick={() => toggleStyle('bold')}
                            className={`flex-1 hover:bg-zinc-700 transition-colors flex items-center justify-center ${isBold ? 'bg-zinc-700 text-cyan-400' : 'text-zinc-400'
                                }`}
                            title="Negrito"
                            disabled={isDisabled}
                        ><Bold size={14} /></button>
                        <div className="w-px bg-zinc-700" />
                        <button
                            onMouseDown={(e) => isEditing && e.preventDefault()}
                            onClick={() => toggleStyle('italic')}
                            className={`flex-1 hover:bg-zinc-700 transition-colors flex items-center justify-center ${isItalic ? 'bg-zinc-700 text-cyan-400' : 'text-zinc-400'
                                }`}
                            title="Itálico"
                            disabled={isDisabled}
                        ><Italic size={14} /></button>
                        <div className="w-px bg-zinc-700" />
                        <button
                            onMouseDown={(e) => isEditing && e.preventDefault()}
                            onClick={toggleDecoration}
                            className={`flex-1 hover:bg-zinc-700 transition-colors flex items-center justify-center ${isUnderline ? 'bg-zinc-700 text-cyan-400' : 'text-zinc-400'
                                }`}
                            title="Sublinhado"
                            disabled={isDisabled}
                        ><Underline size={14} /></button>
                    </div>
                </div>
            </div>

            {/* 3. COLORS (Side by Side) */}
            <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Text Color */}
                <div className="flex items-center justify-between bg-zinc-800 border-zinc-700 px-2 py-1 rounded border h-9 transition-colors">
                    <span className="text-[10px] text-zinc-400 font-medium">Texto</span>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-zinc-600 shadow-sm" style={{ backgroundColor: selectedBalloon?.textColor || '#000000' }} />
                        <input
                            type="color"
                            value={selectedBalloon?.textColor || '#000000'}
                            onChange={(e) => handleUpdate({ textColor: e.target.value })}
                            className="w-6 h-6 opacity-0 absolute cursor-pointer"
                            disabled={isDisabled}
                        />
                    </div>
                </div>

                {/* Bg Color */}
                <div className="flex items-center justify-between bg-zinc-800 border-zinc-700 px-2 py-1 rounded border h-9 transition-colors">
                    <span className="text-[10px] text-zinc-400 font-medium">Fundo</span>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-zinc-600 shadow-sm" style={{ backgroundColor: selectedBalloon?.color || '#ffffff' }} />
                        <input
                            type="color"
                            value={selectedBalloon?.color || '#ffffff'}
                            onChange={(e) => handleUpdate({ color: e.target.value })}
                            className="w-6 h-6 opacity-0 absolute cursor-pointer"
                            disabled={isDisabled}
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};
