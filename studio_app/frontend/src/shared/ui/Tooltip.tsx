import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 400,
    disabled = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const calculatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const trigger = triggerRef.current.getBoundingClientRect();
        const tooltip = tooltipRef.current.getBoundingClientRect();
        const gap = 8;

        let x = 0;
        let y = 0;

        switch (position) {
            case 'top':
                x = trigger.left + trigger.width / 2 - tooltip.width / 2;
                y = trigger.top - tooltip.height - gap;
                break;
            case 'bottom':
                x = trigger.left + trigger.width / 2 - tooltip.width / 2;
                y = trigger.bottom + gap;
                break;
            case 'left':
                x = trigger.left - tooltip.width - gap;
                y = trigger.top + trigger.height / 2 - tooltip.height / 2;
                break;
            case 'right':
                x = trigger.right + gap;
                y = trigger.top + trigger.height / 2 - tooltip.height / 2;
                break;
        }

        // Keep tooltip within viewport
        x = Math.max(8, Math.min(x, window.innerWidth - tooltip.width - 8));
        y = Math.max(8, Math.min(y, window.innerHeight - tooltip.height - 8));

        setCoords({ x, y });
    };

    useEffect(() => {
        if (isVisible) {
            calculatePosition();
        }
    }, [isVisible]);

    const handleMouseEnter = () => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-flex"
            >
                {children}
            </div>
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className="fixed z-[9999] px-2.5 py-1.5 text-xs font-medium text-text-primary bg-surface border border-border-color rounded-md shadow-lg shadow-black/20 pointer-events-none animate-fade-in"
                    style={{
                        left: coords.x,
                        top: coords.y,
                    }}
                >
                    {content}
                    {/* Arrow indicator */}
                    <div
                        className={`absolute w-2 h-2 bg-surface border-border-color rotate-45 ${position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
                                position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
                                    position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
                                        'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
                            }`}
                    />
                </div>
            )}
        </>
    );
};
