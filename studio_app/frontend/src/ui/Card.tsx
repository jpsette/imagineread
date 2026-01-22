import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-surface border border-border-color rounded-xl overflow-hidden
                ${hoverEffect ? 'hover:border-border-highlight hover:shadow-2xl hover:bg-surface-hover transition-all duration-300 cursor-pointer' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};
