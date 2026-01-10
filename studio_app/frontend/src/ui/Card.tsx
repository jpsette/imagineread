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
                bg-[#0c0c0e] border border-[#27272a] rounded-xl overflow-hidden
                ${hoverEffect ? 'hover:border-white/20 hover:shadow-xl transition-all cursor-pointer' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};
