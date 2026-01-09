import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useReaderStore } from '../store/useReaderStore';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Settings, Type, Languages, Volume2, VolumeX, Bookmark, Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function ReaderControls({ title, comicId }: { title: string, comicId: string }) {
    const router = useRouter();
    const {
        textSize,
        setTextSize,
        isTTSEnabled,
        toggleTTS,
        isBookmarked,
        toggleBookmark
    } = useReaderStore();

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
            {/* Top Bar with Blur */}
            <BlurView intensity={80} tint="dark" style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, paddingHorizontal: 16 }}>
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>

                    <Text className="text-white font-bold text-lg flex-1 text-center mx-4" numberOfLines={1}>
                        {title}
                    </Text>

                    <View className="flex-row items-center gap-2">
                        {/* TTS Toggle */}
                        <TouchableOpacity onPress={toggleTTS} className="p-2">
                            {isTTSEnabled ? <Volume2 color="#3B82F6" size={24} /> : <VolumeX color="white" size={24} />}
                        </TouchableOpacity>

                        {/* Bookmark Toggle */}
                        <TouchableOpacity onPress={() => toggleBookmark(comicId)} className="p-2">
                            <Bookmark
                                color={isBookmarked ? "#F59E0B" : "white"}
                                fill={isBookmarked ? "#F59E0B" : "none"}
                                size={24}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>

            {/* Existing Bottom Controls or additional overlays would go here */}
        </View>
    );
}
