import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: LucideIcon;
    label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ icon: Icon, label, className = '', ...props }, ref) => {
    return (
        <div className="w-full group">
            {label && <label className="block text-xs text-text-muted font-bold uppercase mb-1.5 tracking-wider">{label}</label>}
            <div className="relative flex items-center">
                {Icon && (
                    <div className="absolute left-3 text-text-muted group-focus-within:text-accent-blue transition-colors">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
                        w-full bg-surface-hover border border-border-color rounded-lg px-3 py-2.5 
                        text-sm text-text-primary 
                        focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue
                        transition-all duration-200 
                        placeholder:text-text-muted/50
                        ${Icon ? 'pl-10' : ''} ${className}
                    `}
                    {...props}
                />
            </div>
        </div>
    );
});

Input.displayName = 'Input';
