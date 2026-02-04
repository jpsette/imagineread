import React, { useState, useRef, useEffect } from 'react';

interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    showValue?: boolean;
    disabled?: boolean;
    className?: string;
}

export const Slider: React.FC<SliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = true,
    disabled = false,
    className = '',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const percentage = ((value - min) / (max - min)) * 100;

    const getValueFromPosition = (clientX: number): number => {
        if (!trackRef.current) return value;
        const rect = trackRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const rawValue = min + percent * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        return Math.max(min, Math.min(max, steppedValue));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(true);
        const newValue = getValueFromPosition(e.clientX);
        onChange(newValue);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newValue = getValueFromPosition(e.clientX);
            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onChange]);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {(label || showValue) && (
                <div className="flex items-center justify-between text-xs">
                    {label && (
                        <span className="text-text-secondary font-medium">{label}</span>
                    )}
                    {showValue && (
                        <span className="text-text-muted tabular-nums min-w-[3ch] text-right">
                            {value}
                        </span>
                    )}
                </div>
            )}
            <div
                ref={trackRef}
                onMouseDown={handleMouseDown}
                className={`relative h-2 bg-surface rounded-full cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {/* Filled track */}
                <div
                    className="absolute h-full bg-accent-blue rounded-full transition-all duration-75"
                    style={{ width: `${percentage}%` }}
                />
                {/* Thumb */}
                <div
                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-accent-blue transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                    style={{ left: `calc(${percentage}% - 8px)` }}
                />
            </div>
        </div>
    );
};
