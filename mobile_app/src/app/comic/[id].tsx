import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Info, Layers, Download, Trash2, Check, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SharedTransition, withSpring } from 'react-native-reanimated';
import { LibraryService, ComicMetadata } from '../../modules/library/services/LibraryService';
import { DownloadService, DownloadStatus } from '../../modules/library/services/DownloadService';
import { ComicRepository } from '../../modules/library/repositories/ComicRepository';
import { Link } from 'expo-router';
import * as FileSystem from 'expo-file-system';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function ComicDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [comic, setComic] = useState<ComicMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastReadPage, setLastReadPage] = useState<number>(0);

    useEffect(() => {
        if (id) {
            loadComic(id);
        }
    }, [id]);

    const loadComic = async (comicId: string) => {
        setIsLoading(true);
        try {
            const data = await LibraryService.getComicById(comicId);
            setComic(data);

            // Check Repository specifically for detailed progress info
            const repoData = await ComicRepository.getComicById(comicId);
            if (repoData && repoData.current_page_index) {
                setLastReadPage(repoData.current_page_index);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!id || !comic) return;
        DownloadService.downloadComic(id);
        // Refresh comic state to show PENDING immediately
        setComic({
            ...comic,
            downloadStatus: 'PENDING'
        });

        // Poll for updates (simplified)
        // In real app, use an observer or event emitter
    };

    const handleDeleteDownload = async () => {
        if (!id || !comic) return;
        await DownloadService.deleteDownload(id);
        setComic({
            ...comic,
            downloadStatus: 'NONE',
            downloadProgress: 0
        });
    };

    // Render Download Button Logic
    const renderDownloadButton = () => {
        if (!comic) return null;

        if (comic.downloadStatus === 'COMPLETED') {
            return (
                <TouchableOpacity
                    onPress={handleDeleteDownload}
                    className="flex-row items-center justify-center bg-zinc-800 py-3 px-6 rounded-full"
                >
                    <Check size={20} color="#10B981" />
                    <Text className="text-white font-bold ml-2">Downloaded</Text>
                </TouchableOpacity>
            );
        } else if (comic.downloadStatus === 'DOWNLOADING' || comic.downloadStatus === 'PENDING') {
            return (
                <View className="flex-row items-center justify-center bg-zinc-800 py-3 px-6 rounded-full">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold ml-2">
                        {comic.downloadStatus === 'PENDING' ? 'Queued' : `${comic.downloadProgress}%`}
                    </Text>
                </View>
            );
        } else {
            return (
                <TouchableOpacity
                    onPress={handleDownload}
                    className="flex-row items-center justify-center bg-zinc-800 py-3 px-6 rounded-full"
                >
                    <Download size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Download</Text>
                </TouchableOpacity>
            );
        }
    }


    if (isLoading || !comic) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#3B82F6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView className="flex-1">
                {/* Hero Section */}
                <View className="relative h-96">
                    <AnimatedImage
                        source={{ uri: comic.coverUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        sharedTransitionTag={`cover-${id}`}
                    />
                    <LinearGradient
                        colors={['transparent', '#000000']}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 }}
                    />

                    <SafeAreaView className="absolute top-0 left-0 w-full p-4">
                        <TouchableOpacity onPress={() => router.back()} className="bg-black/40 p-2 rounded-full w-10 h-10 items-center justify-center">
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                {/* Details Content */}
                <View className="px-4 -mt-10">
                    <Text className="text-white text-3xl font-bold mb-2">{comic.title}</Text>
                    <View className="flex-row items-center mb-6">
                        <Text className="text-zinc-400 text-base mr-4">{comic.year}</Text>
                        <View className="bg-zinc-800 px-2 py-1 rounded mr-4">
                            <Text className="text-zinc-300 text-xs font-bold">PG-13</Text>
                        </View>
                        {comic.genre.map((g, i) => (
                            <Text key={i} className="text-blue-400 text-base mr-3">{g}</Text>
                        ))}
                        {comic.downloadStatus === 'COMPLETED' && (
                            <Download size={14} color="#10B981" />
                        )}
                    </View>

                    {/* Actions Row */}
                    <View className="flex-row gap-4 mb-8">
                        <Link href={{
                            pathname: "/reader/[id]",
                            params: { id: comic.id, initialPage: lastReadPage > 0 ? lastReadPage : 0 }
                        }} asChild>
                            <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-blue-600 py-3 px-6 rounded-full shadow-lg shadow-blue-900/20">
                                {lastReadPage > 0 ? (
                                    <>
                                        <BookOpen fill="white" size={20} color="white" />
                                        <Text className="text-white font-bold ml-2">RESUME (p. {lastReadPage + 1})</Text>
                                    </>
                                ) : (
                                    <>
                                        <Play fill="white" size={20} color="white" />
                                        <Text className="text-white font-bold ml-2">READ NOW</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Link>

                        {renderDownloadButton()}
                    </View>

                    {/* Syntax / Synopsis */}
                    <View className="mb-8">
                        <Text className="text-white text-lg font-bold mb-2">Synopsis</Text>
                        <Text className="text-zinc-400 leading-6">
                            {comic.synopsis}
                        </Text>
                    </View>

                    {/* Info Grid */}
                    <View className="flex-row flex-wrap gap-4">
                        <View className="w-[45%] bg-zinc-900 p-4 rounded-xl">
                            <View className="flex-row items-center mb-2">
                                <Info size={16} color="#3B82F6" />
                                <Text className="text-zinc-400 ml-2">Author</Text>
                            </View>
                            <Text className="text-white font-bold">{comic.author}</Text>
                        </View>
                        <View className="w-[45%] bg-zinc-900 p-4 rounded-xl">
                            <View className="flex-row items-center mb-2">
                                <Layers size={16} color="#3B82F6" />
                                <Text className="text-zinc-400 ml-2">Pages</Text>
                            </View>
                            <Text className="text-white font-bold">{comic.totalPages || 'N/A'}</Text>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
