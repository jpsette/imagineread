import React from 'react';

interface EditorLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
    children,
    className = ''
}) => {
    return (
        <div className={`absolute inset-0 z-50 bg-[#0c0c0e] flex flex-col ${className}`}>
            {children}
        </div>
    );
};
