import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Pipette } from 'lucide-react';
import ReactDOM from 'react-dom';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    disabled?: boolean;
    label?: string;
    allowClear?: boolean;
}

// Default colors for initial state
const DEFAULT_COLORS = [
    '#000000', '#FFFFFF', '#808080', '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#800080'
];

const MAX_RECENT_COLORS = 10;

// Helper: HSV to RGB
const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    h = h / 360;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// Helper: RGB to Hex
const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
};

// Helper: Hex to HSV
const hexToHsv = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 1, 1];

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, v];
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
    value,
    onChange,
    disabled = false,
    label,
    allowClear = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hue, setHue] = useState(0);
    const [saturation, setSaturation] = useState(1);
    const [brightness, setBrightness] = useState(1);
    const [hexInput, setHexInput] = useState(value || '#000000');
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const gradientRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    // Recent colors state
    const [recentColors, setRecentColors] = useState<string[]>(() => {
        const saved = localStorage.getItem('recentColors');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return DEFAULT_COLORS;
            }
        }
        return DEFAULT_COLORS;
    });

    // Function to add color to recent list
    const addToRecentColors = useCallback((color: string) => {
        if (!color || color === '' || color === 'transparent') return;

        const upperColor = color.toUpperCase();
        setRecentColors(prev => {
            // Remove if already exists
            const filtered = prev.filter(c => c.toUpperCase() !== upperColor);
            // Add to beginning
            const updated = [upperColor, ...filtered].slice(0, MAX_RECENT_COLORS);
            // Save to localStorage
            localStorage.setItem('recentColors', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Sync with external value
    useEffect(() => {
        if (value && value !== '' && value !== 'transparent') {
            const [h, s, v] = hexToHsv(value);
            setHue(h);
            setSaturation(s);
            setBrightness(v);
            setHexInput(value.toUpperCase());
        }
    }, [value]);

    // Load saved position from localStorage or use default
    useEffect(() => {
        if (isOpen) {
            const savedPosition = localStorage.getItem('colorPickerPosition');
            if (savedPosition) {
                try {
                    const pos = JSON.parse(savedPosition);
                    setPopupPosition(pos);
                } catch {
                    setPopupPosition({ top: 380, left: 250 });
                }
            } else {
                setPopupPosition({ top: 380, left: 250 });
            }
        }
    }, [isOpen]);

    // Save position to localStorage when it changes
    useEffect(() => {
        if (popupPosition.top > 0 && popupPosition.left > 0) {
            localStorage.setItem('colorPickerPosition', JSON.stringify(popupPosition));
        }
    }, [popupPosition]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const updateColor = useCallback((h: number, s: number, v: number, addToRecent = false) => {
        const [r, g, b] = hsvToRgb(h, s, v);
        const hex = rgbToHex(r, g, b);
        setHexInput(hex);
        onChange(hex);
        if (addToRecent) {
            addToRecentColors(hex);
        }
    }, [onChange, addToRecentColors]);

    // Gradient picker mouse handler
    const handleGradientInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!gradientRef.current) return;
        const rect = gradientRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        setSaturation(x);
        setBrightness(1 - y);
        updateColor(hue, x, 1 - y);
    }, [hue, updateColor]);

    // Hue slider mouse handler
    const handleHueInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newHue = x * 360;
        setHue(newHue);
        updateColor(newHue, saturation, brightness);
    }, [saturation, brightness, updateColor]);

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
    };

    const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setHexInput(val);
        if (/^#[0-9A-F]{6}$/.test(val)) {
            const [h, s, v] = hexToHsv(val);
            setHue(h);
            setSaturation(s);
            setBrightness(v);
            onChange(val);
            addToRecentColors(val);
        }
    };

    const displayColor = value && value !== 'transparent' && value !== '' ? value : null;
    const currentColor = rgbToHex(...hsvToRgb(hue, saturation, brightness));

    const popupContent = (
        <div
            ref={containerRef}
            className="fixed z-[9999] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3 w-[260px]"
            style={{ top: popupPosition.top, left: popupPosition.left }}
        >
            {/* Header - Draggable */}
            <div
                className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-700 cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX - popupPosition.left;
                    const startY = e.clientY - popupPosition.top;
                    dragOffsetRef.current = { x: startX, y: startY };

                    const onMouseMove = (ev: MouseEvent) => {
                        setPopupPosition({
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
                }}
            >
                <span className="text-xs text-zinc-300 font-medium select-none">⋮⋮ {label || 'Selecionar Cor'}</span>
                <div className="flex items-center gap-2">
                    {allowClear && (
                        <button
                            onClick={handleClear}
                            className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                            <X size={12} />
                            Limpar
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
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
                        // Save to recent colors when done dragging
                        addToRecentColors(currentColor);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                }}
            >
                {/* Picker indicator */}
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
                        // Save to recent colors when done dragging
                        addToRecentColors(currentColor);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                }}
            >
                {/* Hue indicator */}
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

            {/* Quick Colors - No color + 10 colors */}
            <div className="flex justify-between mb-3">
                {/* No Color Button */}
                <button
                    onClick={() => {
                        onChange('');
                        setHexInput('');
                    }}
                    className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 relative bg-white ${!value || value === ''
                        ? 'border-neon-blue ring-1 ring-neon-blue'
                        : 'border-zinc-600 hover:border-zinc-400'
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
                        onClick={() => {
                            const [h, s, v] = hexToHsv(color);
                            setHue(h);
                            setSaturation(s);
                            setBrightness(v);
                            setHexInput(color);
                            onChange(color);
                            addToRecentColors(color);
                        }}
                        className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 ${value === color
                            ? 'border-neon-blue ring-1 ring-neon-blue'
                            : 'border-zinc-600 hover:border-zinc-400'
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
                            onChange={handleHexInputChange}
                            className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white font-mono text-center"
                            placeholder="#000000"
                            maxLength={7}
                        />
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                // @ts-ignore - EyeDropper API
                                const eyeDropper = new window.EyeDropper();
                                const result = await eyeDropper.open();
                                const color = result.sRGBHex.toUpperCase();
                                const [h, s, v] = hexToHsv(color);
                                setHue(h);
                                setSaturation(s);
                                setBrightness(v);
                                setHexInput(color);
                                onChange(color);
                                addToRecentColors(color);
                            } catch (e) {
                                // User cancelled or API not supported
                            }
                        }}
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
                        {['R', 'G', 'B'].map((channel, idx) => {
                            const [r, g, b] = hsvToRgb(hue, saturation, brightness);
                            const values = [r, g, b];
                            return (
                                <div key={channel} className="flex-1">
                                    <input
                                        type="number"
                                        min={0}
                                        max={255}
                                        value={values[idx]}
                                        onChange={(e) => {
                                            const newVal = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                                            const newValues = [...values];
                                            newValues[idx] = newVal;
                                            const hex = rgbToHex(newValues[0], newValues[1], newValues[2]);
                                            const [h, s, v] = hexToHsv(hex);
                                            setHue(h);
                                            setSaturation(s);
                                            setBrightness(v);
                                            setHexInput(hex);
                                            onChange(hex);
                                        }}
                                        className="w-full bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-[10px] text-white text-center"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CMYK */}
                <div>
                    <label className="text-[9px] text-zinc-500 uppercase">CMYK</label>
                    <div className="flex gap-1">
                        {['C', 'M', 'Y', 'K'].map((channel, idx) => {
                            const [r, g, b] = hsvToRgb(hue, saturation, brightness);
                            // RGB to CMYK
                            const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
                            const k = 1 - Math.max(rNorm, gNorm, bNorm);
                            const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k);
                            const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k);
                            const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k);
                            const cmykValues = [
                                Math.round(c * 100),
                                Math.round(m * 100),
                                Math.round(y * 100),
                                Math.round(k * 100)
                            ];
                            return (
                                <div key={channel} className="flex-1">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={cmykValues[idx]}
                                        onChange={(e) => {
                                            const newVal = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                            const newCmyk = [...cmykValues];
                                            newCmyk[idx] = newVal;
                                            // CMYK to RGB
                                            const [cVal, mVal, yVal, kVal] = newCmyk.map(v => v / 100);
                                            const newR = Math.round(255 * (1 - cVal) * (1 - kVal));
                                            const newG = Math.round(255 * (1 - mVal) * (1 - kVal));
                                            const newB = Math.round(255 * (1 - yVal) * (1 - kVal));
                                            const hex = rgbToHex(newR, newG, newB);
                                            const [h, s, v] = hexToHsv(hex);
                                            setHue(h);
                                            setSaturation(s);
                                            setBrightness(v);
                                            setHexInput(hex);
                                            onChange(hex);
                                        }}
                                        className="w-full bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-[10px] text-white text-center"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative">
            {/* Trigger Button */}
            <div
                ref={triggerRef}
                className={`flex items-center justify-between bg-white/5 border-white/5 px-2.5 py-1 rounded-xl border h-8 transition-colors hover:bg-white/10 cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {label && (
                    <span className="text-[10px] text-zinc-400 font-medium">{label}</span>
                )}
                <div className="flex items-center gap-2">
                    {displayColor ? (
                        <div
                            className="w-4 h-4 rounded border border-zinc-600 shadow-sm"
                            style={{ backgroundColor: displayColor }}
                        />
                    ) : (
                        <div className="w-4 h-4 rounded border border-zinc-600 shadow-sm bg-transparent flex items-center justify-center">
                            <X size={10} className="text-zinc-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Portal for popup */}
            {isOpen && ReactDOM.createPortal(popupContent, document.body)}
        </div>
    );
};
