import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context'; // Fixed Import
import {
    ArrowLeft,
    Settings,
    Type,
    Globe,
    Vibrate,
    VibrateOff,
    Minimize2,
    Maximize2
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useReaderStore } from '../store/useReaderStore';
import { useHaptics } from '@/core/hooks/useHaptics';

interface ReaderControlsProps {
    title: string;
}

export function ReaderControls({ title }: ReaderControlsProps) {
    const {
        textSizeMultiplier,
        currentLanguage,
        readingMode,
        isHapticsEnabled,
        increaseTextSize,
        toggleReadingMode,
        cycleLanguage,
        toggleHaptics
    } = useReaderStore();

    const haptics = useHaptics();

    const handleBack = () => {
        haptics.selection();
        router.back();
    };

    const handleTextSize = () => {
        haptics.selection();
        increaseTextSize();
    };

    const handleLanguage = () => {
        haptics.selection();
        cycleLanguage();
    };

    const handleHaptics = () => {
        haptics.selection();
        toggleHaptics();
    };

    const handleReadingMode = () => {
        haptics.selection();
        toggleReadingMode();
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Top Bar */}
            <BlurView intensity={80} tint="dark" style={styles.topBar}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>

                        <Text style={styles.title} numberOfLines={1}>{title}</Text>

                        <TouchableOpacity style={styles.iconButton}>
                            <Settings color="white" size={24} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </BlurView>

            {/* Bottom Bar */}
            <BlurView intensity={80} tint="dark" style={styles.bottomBar}>
                <SafeAreaView edges={['bottom']}>
                    <View style={styles.controlsContent}>

                        {/* Reading Mode */}
                        <TouchableOpacity onPress={handleReadingMode} style={styles.controlItem}>
                            {readingMode === 'vertical' ? (
                                <Minimize2 color="white" size={24} />
                            ) : (
                                <Maximize2 color="white" size={24} />
                            )}
                            <Text style={styles.controlLabel}>{readingMode === 'vertical' ? 'Vertical' : 'Horizontal'}</Text>
                        </TouchableOpacity>

                        {/* Text Size */}
                        <TouchableOpacity onPress={handleTextSize} style={styles.controlItem}>
                            <Type color="white" size={24} />
                            <Text style={styles.controlLabel}>{Math.round(textSizeMultiplier * 100)}%</Text>
                        </TouchableOpacity>

                        {/* Language */}
                        <TouchableOpacity onPress={handleLanguage} style={styles.controlItem}>
                            <Globe color="white" size={24} />
                            <Text style={styles.controlLabel}>{currentLanguage.toUpperCase()}</Text>
                        </TouchableOpacity>

                        {/* Haptics */}
                        <TouchableOpacity onPress={handleHaptics} style={styles.controlItem}>
                            {isHapticsEnabled ? (
                                <Vibrate color="#3B82F6" size={24} />
                            ) : (
                                <VibrateOff color="gray" size={24} />
                            )}
                            <Text style={[styles.controlLabel, isHapticsEnabled && { color: '#3B82F6' }]}>
                                {isHapticsEnabled ? 'On' : 'Off'}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </SafeAreaView>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        zIndex: 100,
    },
    topBar: {
        // remove padding top android, safe area handles it
    },
    bottomBar: {
        // 
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        height: 60,
    },
    title: {
        flex: 1,
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginHorizontal: 16,
    },
    iconButton: {
        padding: 8,
    },
    controlsContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    controlItem: {
        alignItems: 'center',
        gap: 4,
        minWidth: 60,
    },
    controlLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    }
});
