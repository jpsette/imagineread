import React from 'react';
import { Type, Bold, Italic, Underline, Baseline, AlignVerticalSpaceAround, AlignCenter, AlignLeft, AlignRight, AlignJustify, Plus } from 'lucide-react';
import { Balloon } from '@shared/types';

import { useEditorStore } from '../../store';
import { useEditorUIStore } from '@features/editor/uiStore';
import { ColorPicker } from '../ui/ColorPicker';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';

export const EditMenu: React.FC = () => {
    // Stores
    const { balloons, updateBalloonUndoable } = useEditorStore();
    const { selectedId, setActiveTool } = useEditorUIStore();

    // Find balloon safely
    const selectedBalloon = balloons.find(b => b.id === selectedId);
    const isDisabled = !selectedBalloon;
    const isEditing = false; // TODO: If we need this state, we should add it to UI Store or Local logic

    // Wrapper to match signature
    const onUpdate = (id: string, attrs: Partial<Balloon>) => updateBalloonUndoable(id, attrs);

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
        <div className="flex flex-col gap-3 p-1">
            {/* INSERT TEXT BUTTON - Always enabled, outside disabled container */}
            <button
                onClick={() => setActiveTool('text')}
                className="w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all border text-[10px] font-bold uppercase tracking-wider
                    bg-cyan-500/5 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                title="Inserir Texto (T)"
            >
                <Plus size={14} />
                <span>Inserir Texto</span>
            </button>

            {/* Container for balloon-dependent controls */}
            <div className={`flex flex-col gap-3 transition-opacity duration-200 ${isDisabled ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'}`}>

                {/* 1. TEXT CONTENT */}
                <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                        <Type size={12} /> Conteúdo
                    </label>
                    <DebouncedTextarea
                        value={selectedBalloon?.text || ''}
                        onChange={(text) => handleUpdate({ text })}
                        placeholder={isDisabled ? "Selecione para editar..." : "Digite o texto..."}
                        disabled={isDisabled || isEditing}
                        className="w-full bg-white/5 border border-white/5 rounded-xl p-2.5 text-[11px] text-white focus:border-neon-blue/50 outline-none min-h-[100px] resize-none placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed transition-colors hover:bg-white/10"
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
                                className="w-full bg-white/5 border border-white/5 rounded-xl h-8 text-center text-[11px] text-white font-bold outline-none focus:border-neon-blue/50 hover:bg-white/10 transition-all"
                                disabled={isDisabled}
                                title="Tamanho da Fonte"
                            />
                        </div>

                        {/* B / I / U Toggles */}
                        <div className="flex bg-white/5 rounded-xl border border-white/5 overflow-hidden h-8 flex-1">
                            <button
                                onMouseDown={(e) => isEditing && e.preventDefault()}
                                onClick={() => toggleStyle('bold')}
                                className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${isBold ? 'bg-white/10 text-neon-blue' : 'text-zinc-400'
                                    }`}
                                title="Negrito"
                                disabled={isDisabled}
                            ><Bold size={14} /></button>
                            <div className="w-px bg-zinc-700" />
                            <button
                                onMouseDown={(e) => isEditing && e.preventDefault()}
                                onClick={() => toggleStyle('italic')}
                                className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${isItalic ? 'bg-white/10 text-neon-blue' : 'text-zinc-400'
                                    }`}
                                title="Itálico"
                                disabled={isDisabled}
                            ><Italic size={14} /></button>
                            <div className="w-px bg-zinc-700" />
                            <button
                                onMouseDown={(e) => isEditing && e.preventDefault()}
                                onClick={toggleDecoration}
                                className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${isUnderline ? 'bg-white/10 text-neon-blue' : 'text-zinc-400'
                                    }`}
                                title="Sublinhado"
                                disabled={isDisabled}
                            ><Underline size={14} /></button>
                        </div>
                    </div>

                    {/* Text Alignment Row */}
                    <div className="flex bg-white/5 rounded-xl border border-white/5 overflow-hidden h-8">
                        <button
                            onClick={() => handleUpdate({ textAlign: 'left' })}
                            className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${selectedBalloon?.textAlign === 'left' ? 'bg-white/10 text-neon-blue' : 'text-zinc-400'}`}
                            title="Alinhar à Esquerda"
                            disabled={isDisabled}
                        ><AlignLeft size={14} /></button>
                        <div className="w-px bg-zinc-700" />
                        <button
                            onClick={() => handleUpdate({ textAlign: 'center' })}
                            className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${!selectedBalloon?.textAlign || selectedBalloon?.textAlign === 'center' ? 'bg-white/10 text-neon-blue' : 'text-zinc-400'}`}
                            title="Centralizar"
                            disabled={isDisabled}
                        ><AlignCenter size={14} /></button>
                        <div className="w-px bg-zinc-700" />
                        <button
                            onClick={() => handleUpdate({ textAlign: 'right' })}
                            className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${selectedBalloon?.textAlign === 'right' ? 'bg-white/10 text-neon-blue' : 'text-zinc-400'}`}
                            title="Alinhar à Direita"
                            disabled={isDisabled}
                        ><AlignRight size={14} /></button>
                        <div className="w-px bg-zinc-700" />
                        <button
                            onClick={() => handleUpdate({ textAlign: 'justify' })}
                            className={`flex-1 hover:bg-white/10 transition-colors flex items-center justify-center ${selectedBalloon?.textAlign === 'justify' ? 'bg-white/10 text-neon-blue' : 'text-zinc-400'}`}
                            title="Justificar"
                            disabled={isDisabled}
                        ><AlignJustify size={14} /></button>
                    </div>

                    {/* Line Height Control */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 h-8">
                        <AlignVerticalSpaceAround size={14} className="text-zinc-400" />
                        <span className="text-[10px] text-zinc-400 font-medium">Espaçamento</span>
                        <input
                            type="number"
                            min="0.8" max="3" step="0.1"
                            value={selectedBalloon?.lineHeight || 1.4}
                            onChange={(e) => handleUpdate({ lineHeight: Number(e.target.value) })}
                            className="w-12 bg-transparent border-none text-center text-[11px] text-white font-bold outline-none"
                            disabled={isDisabled}
                            title="Espaçamento entre linhas"
                        />
                    </div>
                </div>

                {/* 3. COLORS (Side by Side) */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                    {/* Text Color */}
                    <ColorPicker
                        label="Cor do Texto"
                        value={selectedBalloon?.textColor || '#000000'}
                        onChange={(color) => handleUpdate({ textColor: color || '#000000' })}
                        disabled={isDisabled}
                    />

                    {/* Text Highlight/Marker Color */}
                    <ColorPicker
                        label="Marcador"
                        value={selectedBalloon?.textBackgroundColor || ''}
                        onChange={(color) => handleUpdate({ textBackgroundColor: color })}
                        disabled={isDisabled}
                        allowClear
                    />
                </div>

            </div>
        </div>
    );
};
