import React from 'react';
import { TabPanel } from '../features/tabs/components/TabPanel';
import { EditorHeader } from '@widgets/editor/EditorHeader';

interface EditorLayoutProps {
    children: React.ReactNode;
    leftPanel?: React.ReactNode;
    rightPanel?: React.ReactNode;
    bottomPanel?: React.ReactNode;
    className?: string;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
    children,
    leftPanel,
    rightPanel,
    bottomPanel,
    className = ''
}) => {
    return (
        <div className={`absolute inset-0 z-50 bg-[#0c0c0e] flex flex-col ${className}`}>
            <EditorHeader />
            <TabPanel />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative flex overflow-hidden">
                {/* LEFT SLOT */}
                {leftPanel}

                {/* CENTER CHILDREN (Canvas + Loader) */}
                {children}

                {/* RIGHT SLOT */}
                {rightPanel}

                {/* BOTTOM SLOT (Filmstrip) - Absolute to overlay or Flex to stack? 
                    Filmstrip is absolute positioned internally (bottom-0), so it just needs to be mounted here.
                    If we put it in the flex container, it might try to take space if not absolute.
                    Filmstrip CSS: absolute bottom-0 left-1/2 ...
                    So simple rendering here works because 'relative' parent is the flex container.
                */}
                {bottomPanel}
            </div>
        </div>
    );
};
