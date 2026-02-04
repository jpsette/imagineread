/**
 * Color Utilities
 * 
 * Extracted from ColorPicker for reusability and cleaner code.
 */

// HSV to RGB conversion
export const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
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

// RGB to Hex conversion
export const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
};

// Hex to HSV conversion
export const hexToHsv = (hex: string): [number, number, number] => {
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

// RGB to CMYK conversion
export const rgbToCmyk = (r: number, g: number, b: number): [number, number, number, number] => {
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const k = 1 - Math.max(rNorm, gNorm, bNorm);
    const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k);
    return [
        Math.round(c * 100),
        Math.round(m * 100),
        Math.round(y * 100),
        Math.round(k * 100)
    ];
};

// CMYK to RGB conversion
export const cmykToRgb = (c: number, m: number, y: number, k: number): [number, number, number] => {
    const cVal = c / 100, mVal = m / 100, yVal = y / 100, kVal = k / 100;
    const r = Math.round(255 * (1 - cVal) * (1 - kVal));
    const g = Math.round(255 * (1 - mVal) * (1 - kVal));
    const b = Math.round(255 * (1 - yVal) * (1 - kVal));
    return [r, g, b];
};

// Default colors for initial state
export const DEFAULT_COLORS = [
    '#000000', '#FFFFFF', '#808080', '#FF0000', '#FFFF00',
    '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#800080'
];

export const MAX_RECENT_COLORS = 10;
