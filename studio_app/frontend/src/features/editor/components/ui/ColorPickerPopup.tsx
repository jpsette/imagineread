/**
 * ColorPickerPopup
 * 
 * The popup content for the ColorPicker, memoized for performance.
 * Handles gradient picker, hue slider, recent colors, and value inputs.
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { X, Pipette } from 'lucide-react';
import { hsvToRgb, rgbToHex, hexToHsv, rgbToCmyk, cmykToRgb } from './colorUtils';

interface ColorPickerPopupProps {
    hue: number;
    saturation: number;
    brightness: number;
    hexInput: string;
    recentColors: string[];
    currentValue: string;
    label?: string;
    allowClear?: boolean;
    popupPosition: { top: number; left: number };
    onHueChange: (h: number) => void;
    onSaturationChange: (s: number) => void;
    onBrightnessChange: (b: number) => void;
    onHexInputChange: (hex: string) => void;
    onColorChange: (color: string) => void;
    onPositionChange: (pos: { top: number; left: number }) => void;
    onAddToRecent: (color: string) => void;
    onClose: () => void;
    onClear?: () => void;
}

export const ColorPickerPopup = React.memo<ColorPickerPopupProps>(({
    hue,
    saturation,
    brightness,
    hexInput,
    recentColors,
    currentValue,
    label,
    allowClear,
    popupPosition,
    onHueChange,
    onSaturationChange,
    onBrightnessChange,
    onHexInputChange,
    onColorChange,
    onPositionChange,
    onAddToRecent,
    onClose,
    onClear
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const gradientRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    const currentColor = useMemo(() => rgbToHex(...hsvToRgb(hue, saturation, brightness)), [hue, saturation, brightness]);
    const rgbValues = useMemo(() => hsvToRgb(hue, saturation, brightness), [hue, saturation, brightness]);
    const cmykValues = useMemo(() => rgbToCmyk(...rgbValues), [rgbValues]);

    // Gradient picker handler
    const handleGradientInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!gradientRef.current) return;
        const rect = gradientRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        onSaturationChange(x);
        onBrightnessChange(1 - y);
        const [r, g, b] = hsvToRgb(hue, x, 1 - y);
        onColorChange(rgbToHex(r, g, b));
    }, [hue, onSaturationChange, onBrightnessChange, onColorChange]);

    // Hue slider handler
    const handleHueInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newHue = x * 360;
        onHueChange(newHue);
        const [r, g, b] = hsvToRgb(newHue, saturation, brightness);
        onColorChange(rgbToHex(r, g, b));
    }, [saturation, brightness, onHueChange, onColorChange]);

    // Hex input change
    const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        onHexInputChange(val);
        if (/^#[0-9A-F]{6}$/.test(val)) {
            const [h, s, v] = hexToHsv(val);
            onHueChange(h);
            onSaturationChange(s);
            onBrightnessChange(v);
            onColorChange(val);
            onAddToRecent(val);
        }
    }, [onHexInputChange, onHueChange, onSaturationChange, onBrightnessChange, onColorChange, onAddToRecent]);

    // RGB input change
    const handleRgbChange = useCallback((idx: number, value: number) => {
        const newValues = [...rgbValues];
        newValues[idx] = Math.max(0, Math.min(255, value));
        const hex = rgbToHex(newValues[0], newValues[1], newValues[2]);
        const [h, s, v] = hexToHsv(hex);
        onHueChange(h);
        onSaturationChange(s);
        onBrightnessChange(v);
        onHexInputChange(hex);
        onColorChange(hex);
    }, [rgbValues, onHueChange, onSaturationChange, onBrightnessChange, onHexInputChange, onColorChange]);

    // CMYK input change
    const handleCmykChange = useCallback((idx: number, value: number) => {
        const newCmyk = [...cmykValues];
        newCmyk[idx] = Math.max(0, Math.min(100, value));
        const [r, g, b] = cmykToRgb(newCmyk[0], newCmyk[1], newCmyk[2], newCmyk[3]);
        const hex = rgbToHex(r, g, b);
        const [h, s, v] = hexToHsv(hex);
        onHueChange(h);
        onSaturationChange(s);
        onBrightnessChange(v);
        onHexInputChange(hex);
        onColorChange(hex);
    }, [cmykValues, onHueChange, onSaturationChange, onBrightnessChange, onHexInputChange, onColorChange]);

    // Quick color select
    const handleQuickColorSelect = useCallback((color: string) => {
        const [h, s, v] = hexToHsv(color);
        onHueChange(h);
        onSaturationChange(s);
        onBrightnessChange(v);
        onHexInputChange(color);
        onColorChange(color);
        onAddToRecent(color);
    }, [onHueChange, onSaturationChange, onBrightnessChange, onHexInputChange, onColorChange, onAddToRecent]);

    // Eyedropper
    const handleEyedropper = useCallback(async () => {
        try {
            // @ts-ignore - EyeDropper API
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            const color = result.sRGBHex.toUpperCase();
            handleQuickColorSelect(color);
        } catch {
            // User cancelled or API not supported
        }
    }, [handleQuickColorSelect]);

    // Drag handler for header
    const handleHeaderDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX - popupPosition.left;
        const startY = e.clientY - popupPosition.top;
        dragOffsetRef.current = { x: startX, y: startY };

        const onMouseMove = (ev: MouseEvent) => {
            onPositionChange({
                top: ev.clientY - dragOffsetRef.current.y,
                left: ev.clientX - dragOffsetRef.current.x
            });
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [popupPosition, onPositionChange]);

    return (
        <div
            ref={containerRef}
            className="fixed z-[9999] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3 w-[260px]"
            style={{ top: popupPosition.top, left: popupPosition.left }}
        >
            {/* Header - Draggable */}
            <div
                className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-700 cursor-grab active:cursor-grabbing"
                onMouseDown={handleHeaderDrag}
            >
                <span className="text-xs text-zinc-300 font-medium select-none">⋮⋮ {label || 'Selecionar Cor'}</span>
                <div className="flex items-center gap-2">
                    {allowClear && onClear && (
                        <button
                            onClick={onClear}
                            className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                            <X size={12} />
                            Limpar
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Saturation/Brightness Gradient */}
            <div
                ref={gradientRef}
                className="w-full h-32 rounded-lg cursor-crosshair relative mb-3 select-none"
                style={{
                    background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleGradientInteraction(e);
                    const onMove = (ev: MouseEvent) => {
                        ev.preventDefault();
                        handleGradientInteraction(ev);
                    };
                    const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                        onAddToRecent(currentColor);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                }}
            >
                <div
                    className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                    style={{
                        left: `${saturation * 100}%`,
                        top: `${(1 - brightness) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: currentColor,
                        willChange: 'left, top, background-color'
                    }}
                />
            </div>

            {/* Hue Slider */}
            <div
                ref={hueRef}
                className="w-full h-3 rounded-full cursor-pointer relative mb-3 select-none"
                style={{
                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleHueInteraction(e);
                    const onMove = (ev: MouseEvent) => {
                        ev.preventDefault();
                        handleHueInteraction(ev);
                    };
                    const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                        onAddToRecent(currentColor);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                }}
            >
                <div
                    className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                    style={{
                        left: `${(hue / 360) * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: `hsl(${hue}, 100%, 50%)`,
                        willChange: 'left, background-color'
                    }}
                />
            </div>

            {/* Quick Colors */}
            <div className="flex justify-between mb-3">
                <button
                    onClick={() => {
                        onColorChange('');
                        onHexInputChange('');
                    }}
                    className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 relative bg-white ${!currentValue || currentValue === '' ? 'border-neon-blue ring-1 ring-neon-blue' : 'border-zinc-600 hover:border-zinc-400'
                        }`}
                    title="Sem cor"
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[140%] h-0.5 bg-red-500 rotate-45 origin-center" />
                    </div>
                </button>

                {recentColors.map((color, index) => (
                    <button
                        key={`${color}-${index}`}
                        onClick={() => handleQuickColorSelect(color)}
                        className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 ${currentValue === color ? 'border-neon-blue ring-1 ring-neon-blue' : 'border-zinc-600 hover:border-zinc-400'
                            }`}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>

            {/* Color Values Section */}
            <div className="space-y-2 pt-2 border-t border-zinc-700">
                {/* HEX + Eyedropper + Preview */}
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="text-[9px] text-zinc-500 uppercase">HEX</label>
                        <input
                            type="text"
                            value={hexInput}
                            onChange={handleHexChange}
                            className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white font-mono text-center"
                            placeholder="#000000"
                            maxLength={7}
                        />
                    </div>
                    <button
                        onClick={handleEyedropper}
                        className="w-10 h-10 rounded-lg border border-zinc-600 bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors flex-shrink-0"
                        title="Conta-gotas"
                    >
                        <Pipette size={18} className="text-zinc-300" />
                    </button>
                    <div
                        className="w-10 h-10 rounded-lg border border-zinc-600 flex-shrink-0"
                        style={{ backgroundColor: currentColor }}
                    />
                </div>

                {/* RGB */}
                <div>
                    <label className="text-[9px] text-zinc-500 uppercase">RGB</label>
                    <div className="flex gap-1">
                        {['R', 'G', 'B'].map((channel, idx) => (
                            <div key={channel} className="flex-1">
                                <input
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={rgbValues[idx]}
                                    onChange={(e) => handleRgbChange(idx, parseInt(e.target.value) || 0)}
                                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-[10px] text-white text-center"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CMYK */}
                <div>
                    <label className="text-[9px] text-zinc-500 uppercase">CMYK</label>
                    <div className="flex gap-1">
                        {['C', 'M', 'Y', 'K'].map((channel, idx) => (
                            <div key={channel} className="flex-1">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={cmykValues[idx]}
                                    onChange={(e) => handleCmykChange(idx, parseInt(e.target.value) || 0)}
                                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-[10px] text-white text-center"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

ColorPickerPopup.displayName = 'ColorPickerPopup';
