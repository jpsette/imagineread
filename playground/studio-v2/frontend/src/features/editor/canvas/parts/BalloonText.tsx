import React, { useState, useEffect } from 'react';
import { Html } from 'react-konva-utils';
import { Balloon } from '@shared/types';

interface BalloonTextProps {
    balloon: Balloon;
    width: number;
    height: number;
    isEditing: boolean;
    visible: boolean;
    onChange: (html: string, text: string) => void;
    onBlur: () => void;
}

export const BalloonText: React.FC<BalloonTextProps> = ({
    balloon,
    width,
    height,
    isEditing,
    visible,
    onChange,
    onBlur
}) => {
    // Local state for content to avoid jitter during typing
    const [content, setContent] = useState(balloon.html || balloon.text);

    // Sync when external balloon data changes (undo/redo)
    useEffect(() => {
        if (!isEditing) {
            setContent(balloon.html || balloon.text);
        }
    }, [balloon.html, balloon.text, isEditing]);

    if (!visible) return null;

    // Helper to build style object
    const getStyle = (): React.CSSProperties => {
        return {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: balloon.fontFamily || 'Comic Neue',
            fontSize: `${balloon.fontSize || 14}px`,
            color: balloon.textColor || '#000000',
            fontWeight: (balloon.fontStyle || '').includes('bold') ? 'bold' : 'normal',
            fontStyle: (balloon.fontStyle || '').includes('italic') ? 'italic' : 'normal',
            textDecoration: (balloon.textDecoration || '').includes('underline') ? 'underline' : 'none',
            textAlign: 'center',
            lineHeight: 1.2,
            outline: 'none',
            userSelect: 'text',
            cursor: isEditing ? 'text' : 'move',
            overflow: 'hidden',
            pointerEvents: isEditing ? 'auto' : 'none',
            // Add padding for thought bubble to avoid text clipping
            padding: balloon.type === 'balloon-thought' ? '15%' : '5%'
        };
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        const newText = e.currentTarget.innerText;
        onChange(newHtml, newText);
        onBlur();
    };

    return (
        <Html
            groupProps={{
                width: width,
                height: height,
            }}
            divProps={{
                style: {
                    width: `${width}px`,
                    height: `${height}px`,
                    pointerEvents: 'none', // Pass through to Konva unless editing
                }
            }}
        >
            <div
                id={`balloon-text-${balloon.id}`}
                style={getStyle()}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={handleBlur}
                dangerouslySetInnerHTML={{ __html: content }}
                onKeyDown={(e) => {
                    e.stopPropagation(); // Prevent Konva from catching backspace/delete
                }}
            />
        </Html>
    );
};
