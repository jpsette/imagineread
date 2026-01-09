import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { useReaderStore } from '../store/useReaderStore';
import Animated, {
    LinearTransition,
    useAnimatedStyle,
    withTiming,
    withSpring
} from 'react-native-reanimated';

export interface VectorBubbleProps {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type?: string;
    tail?: { x: number; y: number };
    shape?: string;
    isFocused?: boolean; // New Prop
}

export function VectorBubble({ x, y, width, height, text, shape, isFocused = true }: VectorBubbleProps) {
    // 1. Store Subscription for Text Sizing
    const textSizeMultiplier = useReaderStore((state) => state.textSizeMultiplier);

    // 2. Dynamic Sizing Logic
    // We want the bubble to grow organically. 
    // Ideally, the width/height passed in are "base" dimensions.
    // We scale them by the multiplier.
    // However, SVG scaling without losing aspect ratio or clipping is tricky.
    // For this step, let's scale the *Font* and let the bubble container grow slightly if needed, 
    // or just keep fixed bubble size and assume text fits (MVP).
    // User Instructions: "Make Vector Bubbles resize smoothly".
    // To do that, we should scale width/height too.
    const scaledWidth = width * (1 + (textSizeMultiplier - 1) * 0.5); // Grow width slower than text
    const scaledHeight = height * (1 + (textSizeMultiplier - 1) * 0.5);

    // 3. Focus / Cinematic Animation
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isFocused ? 1 : 0.3, { duration: 300 }),
            transform: [
                { scale: withTiming(isFocused ? 1.05 : 1.0, { duration: 300 }) }
            ]
        };
    }, [isFocused]);

    const baseFontSize = height * 0.15;
    const fontSize = baseFontSize * textSizeMultiplier;

    return (
        <Animated.View
            layout={LinearTransition.springify().damping(15)}
            style={[
                {
                    position: 'absolute',
                    left: x - (scaledWidth - width) / 2, // Center while growing
                    top: y - (scaledHeight - height) / 2,
                    width: scaledWidth,
                    height: scaledHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: isFocused ? 20 : 10, // Bring focused to top
                },
                animatedStyle
            ]}
        >
            {/* SVG Background Layer */}
            <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFill}>
                <Ellipse
                    cx={width / 2}
                    cy={height / 2}
                    rx={width / 2 - 2}
                    ry={height / 2 - 2}
                    fill="white"
                    stroke="black"
                    strokeWidth="2"
                />
            </Svg>

            {/* Text Layer */}
            <View style={{ padding: scaledWidth * 0.15 }}>
                <Text
                    style={{
                        color: 'black',
                        fontSize: fontSize,
                        fontWeight: '600',
                        textAlign: 'center',
                        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
                    }}
                    adjustsFontSizeToFit={true}
                    numberOfLines={5}
                >
                    {text}
                </Text>
            </View>
        </Animated.View>
    );
}
