import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import { useReaderStore } from '../store/useReaderStore';
import { Balloon } from '../types';

// Omit 'text' from props if we want to get it some other way, but usually it's passed down.
// Props should match the Balloon interface + any scaling props
export interface VectorBubbleProps extends Balloon {
    // We expect parent to pass scaled coordinates
}

export function VectorBubble({ x, y, width, height, text, shape }: VectorBubbleProps) {
    // Directly subscribe to store for performance update on text size change ONLY
    const textSizeMultiplier = useReaderStore((state) => state.textSizeMultiplier);

    return (
        <View
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                height: height,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute' }}>
                {shape === 'ellipse' && (
                    <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill="white" stroke="black" strokeWidth="2" />
                )}
                {shape === 'rect' && (
                    <Rect x="2" y="2" width={width - 4} height={height - 4} rx="10" ry="10" fill="white" stroke="black" strokeWidth="2" />
                )}
                {shape === 'cloud' && (
                    <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill="white" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
                )}
            </Svg>

            <Text
                style={{
                    fontSize: 14 * textSizeMultiplier,
                    textAlign: 'center',
                    color: 'black',
                    padding: 10,
                    fontFamily: 'System'
                }}
            >
                {text}
            </Text>
        </View>
    );
}
