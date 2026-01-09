import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: LucideIcon;
    label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ icon: Icon, label, className = '', ...props }, ref) => {
    return (
        <div className="w-full">
            {label && <label className="block text-xs text-[#71717a] font-bold uppercase mb-1">{label}</label>}
            <div className="relative flex items-center">
                {Icon && (
                    <div className="absolute left-3 text-gray-500">
                        <Icon size={14} />
                    </div>
                )}
                <input
                    ref={ref}
                    className={`w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600 ${Icon ? 'pl-9' : ''} ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
});

Input.displayName = 'Input';
