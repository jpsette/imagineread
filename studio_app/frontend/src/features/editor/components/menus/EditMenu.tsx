import React from 'react';
import { Type, Bold, Italic, Underline, Baseline, Square, Circle, Cloud, MessageCircle, Upload, Shapes } from 'lucide-react';
import { Balloon } from '@shared/types';
import { parseSvgFile } from '../../utils/svgParser';

import { useEditorStore } from '../../store';
import { useEditorUIStore } from '@features/editor/uiStore';

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

    // Helper for Shape Change
    const handleShapeChange = (type: Balloon['type']) => {
        handleUpdate({ type });
    };

    // Helper for SVG Import
    const handleSvgImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { path, viewBox } = await parseSvgFile(file);
            handleUpdate({
                type: 'balloon-custom',
                customSvg: path,
                svgViewBox: viewBox
            });
        } catch (err) {
            console.error("Failed to parse SVG:", err);
            alert("Erro ao importar SVG. Verifique se é um arquivo válido.");
        }

        // Reset input
        e.target.value = '';
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
        <div className={`flex flex-col gap-3 p-1 transition-opacity duration-200 ${isDisabled ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'}`}>

            {/* 0. SHAPE SELECTION (New) */}
            <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Shapes size={12} /> Formato
                </label>
                <div className="grid grid-cols-5 gap-1">
                    <button
                        onClick={() => handleShapeChange('balloon-square')}
                        className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-square' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                        title="Quadrado"
                        disabled={isDisabled}
                    ><Square size={13} /></button>
                    <button
                        onClick={() => handleShapeChange('balloon-circle')}
                        className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-circle' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                        title="Redondo"
                        disabled={isDisabled}
                    ><Circle size={13} /></button>
                    <button
                        onClick={() => handleShapeChange('balloon-thought')}
                        className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-thought' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                        title="Pensamento"
                        disabled={isDisabled}
                    ><Cloud size={13} /></button>
                    <button
                        onClick={() => handleShapeChange('balloon-shout')}
                        className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors ${selectedBalloon?.type === 'balloon-shout' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`}
                        title="Grito"
                        disabled={isDisabled}
                    ><MessageCircle size={13} /></button>

                    {/* SVG Import Button */}
                    <label className={`h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer ${selectedBalloon?.type === 'balloon-custom' ? 'border-cyan-500 text-cyan-500' : 'text-zinc-400'}`} title="Importar SVG">
                        <input type="file" accept=".svg" className="hidden" onChange={handleSvgImport} disabled={isDisabled} />
                        <Upload size={13} />
                    </label>
                </div>
            </div>

            {/* 1. TEXT CONTENT */}
            <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                    <Type size={12} /> Conteúdo
                </label>
                <textarea
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-2.5 text-[11px] text-white focus:border-neon-blue/50 outline-none min-h-[70px] resize-y placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed transition-all hover:bg-white/10"
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
            </div>

            {/* 3. COLORS (Side by Side) */}
            <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Text Color */}
                <div className="flex items-center justify-between bg-white/5 border-white/5 px-2.5 py-1 rounded-xl border h-8 transition-colors hover:bg-white/10">
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
                <div className="flex items-center justify-between bg-white/5 border-white/5 px-2.5 py-1 rounded-xl border h-8 transition-colors hover:bg-white/10">
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
