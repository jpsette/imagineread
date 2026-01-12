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
    const baseStyles = "rounded-md font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-500", // matching accent-blue
        secondary: "bg-[#27272a] text-gray-400 hover:text-white hover:bg-[#3f3f46] border border-[#3f3f46]",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/10",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
    };

    const sizes = {
        sm: "text-xs px-2 py-1",
        md: "text-xs px-3 py-1.5", // Default from ProjectManager
        icon: "p-1.5"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <span className="animate-spin">⌛</span> : Icon && <Icon size={14} />}
            {children}
        </button>
    );
};
