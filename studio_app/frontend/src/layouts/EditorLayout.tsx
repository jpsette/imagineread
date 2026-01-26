import React from 'react';
import { TabPanel } from '../features/tabs/components/TabPanel';
import { EditorHeader } from '../features/editor/components/layout/EditorHeader';

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
            <EditorHeader />
            <TabPanel />
            {children}
        </div>
    );
};
