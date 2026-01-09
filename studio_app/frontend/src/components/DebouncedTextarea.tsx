import React, { useState, useEffect, useRef } from 'react';

interface DebouncedTextareaProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    rows?: number;
    delay?: number;
}

export const DebouncedTextarea: React.FC<DebouncedTextareaProps> = ({
    value,
    onChange,
    className,
    placeholder,
    rows = 3,
    delay = 300
}) => {
    const [localValue, setLocalValue] = useState(value);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            onChange(newValue);
        }, delay);
    };

    return (
        <textarea
            value={localValue}
            onChange={handleChange}
            className={className}
            placeholder={placeholder}
            rows={rows}
        />
    );
};
