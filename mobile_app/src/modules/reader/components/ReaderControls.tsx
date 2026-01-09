import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Columns, Rows, Type, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useReaderStore } from '../store/useReaderStore';

interface ReaderControlsProps {
    title: string;
}

export function ReaderControls({ title }: ReaderControlsProps) {
    const router = useRouter();
    const {
        readingMode,
        toggleReadingMode,
        textSizeMultiplier,
        setTextSizeMultiplier
    } = useReaderStore();

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <BlurView intensity={80} tint="dark" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 }}>

                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
                    <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>

                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{title}</Text>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={toggleReadingMode} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
                        {readingMode === 'vertical' ? <Rows size={20} color="#FFF" /> : <Columns size={20} color="#FFF" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTextSizeMultiplier(textSizeMultiplier > 1.4 ? 1.0 : textSizeMultiplier + 0.2)}
                        style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}
                    >
                        <Type size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

            </BlurView>
        </Animated.View>
    );
}
