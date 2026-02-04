import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'icon';
    icon?: LucideIcon;
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    isLoading,
    className = '',
    ...props
}) => {
    // Enhanced with focus-ring for accessibility and smooth transitions
    const baseStyles = "rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus-ring hover-smooth";

    const variants = {
        primary: "bg-accent-blue text-white hover:bg-accent-hover shadow-lg shadow-blue-500/20",
        secondary: "bg-surface-hover text-text-secondary hover:text-white hover:bg-border-highlight border border-border-color",
        ghost: "bg-transparent text-text-secondary hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
    };

    const sizes = {
        sm: "text-xs px-2 py-1.5",
        md: "text-sm px-4 py-2", // Increased for better touch/click targets
        icon: "p-2"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <span className="animate-spin">⌛</span> : Icon && <Icon size={16} />}
            {children}
        </button>
    );
};
