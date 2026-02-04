/**
 * ColorPicker
 * 
 * A full-featured color picker component with HSV gradient, hue slider,
 * recent colors, and RGB/CMYK input fields.
 * 
 * REFACTORED: Uses extracted utilities and memoized popup component.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import ReactDOM from 'react-dom';
import { hexToHsv, DEFAULT_COLORS, MAX_RECENT_COLORS } from './colorUtils';
import { ColorPickerPopup } from './ColorPickerPopup';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    disabled?: boolean;
    label?: string;
    allowClear?: boolean;
}

export const ColorPicker = React.memo<ColorPickerProps>(({
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

    const triggerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
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
            const filtered = prev.filter(c => c.toUpperCase() !== upperColor);
            const updated = [upperColor, ...filtered].slice(0, MAX_RECENT_COLORS);
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

    // Load saved position from localStorage
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

    // Save position to localStorage
    useEffect(() => {
        if (popupPosition.top > 0 && popupPosition.left > 0) {
            localStorage.setItem('colorPickerPosition', JSON.stringify(popupPosition));
        }
    }, [popupPosition]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleClear = useCallback(() => {
        onChange('');
        setIsOpen(false);
    }, [onChange]);

    const displayColor = value && value !== 'transparent' && value !== '' ? value : null;

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
            {isOpen && ReactDOM.createPortal(
                <div ref={popupRef}>
                    <ColorPickerPopup
                        hue={hue}
                        saturation={saturation}
                        brightness={brightness}
                        hexInput={hexInput}
                        recentColors={recentColors}
                        currentValue={value}
                        label={label}
                        allowClear={allowClear}
                        popupPosition={popupPosition}
                        onHueChange={setHue}
                        onSaturationChange={setSaturation}
                        onBrightnessChange={setBrightness}
                        onHexInputChange={setHexInput}
                        onColorChange={onChange}
                        onPositionChange={setPopupPosition}
                        onAddToRecent={addToRecentColors}
                        onClose={() => setIsOpen(false)}
                        onClear={handleClear}
                    />
                </div>,
                document.body
            )}
        </div>
    );
});

ColorPicker.displayName = 'ColorPicker';
