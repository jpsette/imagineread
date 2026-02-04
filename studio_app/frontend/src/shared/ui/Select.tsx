import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    disabled = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                setIsOpen(!isOpen);
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    const currentIndex = options.findIndex(opt => opt.value === value);
                    const nextIndex = Math.min(currentIndex + 1, options.length - 1);
                    onChange(options[nextIndex].value);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (isOpen) {
                    const currentIndex = options.findIndex(opt => opt.value === value);
                    const prevIndex = Math.max(currentIndex - 1, 0);
                    onChange(options[prevIndex].value);
                }
                break;
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-surface border border-border-color rounded-lg transition-colors ${isOpen
                        ? 'border-accent-blue ring-1 ring-accent-blue/30'
                        : 'hover:border-border-highlight'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={`flex items-center gap-2 truncate ${selectedOption ? 'text-text-primary' : 'text-text-muted'}`}>
                    {selectedOption?.icon}
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 py-1 bg-surface border border-border-color rounded-lg shadow-xl shadow-black/30 max-h-60 overflow-auto animate-fade-in">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${option.value === value
                                    ? 'bg-accent-blue/10 text-accent-blue'
                                    : 'text-text-primary hover:bg-surface-hover'
                                }`}
                        >
                            <span className="flex items-center gap-2 truncate">
                                {option.icon}
                                {option.label}
                            </span>
                            {option.value === value && (
                                <Check size={16} className="shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
