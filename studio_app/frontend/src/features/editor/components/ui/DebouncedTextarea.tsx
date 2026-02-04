import React, { useState, useEffect, useRef } from 'react';

interface DebouncedTextareaProps {
    value: string;
    onChange: (value: string) => void;
    debounceMs?: number;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    onFocus?: () => void;
}

export const DebouncedTextarea: React.FC<DebouncedTextareaProps> = ({
    value,
    onChange,
    debounceMs = 300,
    placeholder,
    disabled,
    className,
    onFocus
}) => {
    const [localValue, setLocalValue] = useState(value);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const isInternalChange = useRef(false);

    // Sync local value when external value changes (e.g., selection changed)
    useEffect(() => {
        if (!isInternalChange.current) {
            setLocalValue(value);
        }
        isInternalChange.current = false;
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        isInternalChange.current = true;

        // Clear previous timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new debounced update
        debounceRef.current = setTimeout(() => {
            onChange(newValue);
        }, debounceMs);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Immediately commit on blur
    const handleBlur = () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    return (
        <textarea
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
};
