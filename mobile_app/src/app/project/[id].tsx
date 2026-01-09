import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreHorizontal } from 'lucide-react-native';
import { LibraryService, ComicMetadata, Project } from '../../modules/library/services/LibraryService';
import { ComicCard } from '../../components/ComicCard';

export default function ProjectDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [comics, setComics] = useState<ComicMetadata[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (projectId: string) => {
        setIsLoading(true);
        try {
            // Fetch project details (Simulated by finding in mock list for now)
            const allProjects = await LibraryService.getProjects();
            const foundProject = allProjects.find(p => p.id === projectId);
            setProject(foundProject || null);

            // Fetch comics
            const comicsData = await LibraryService.getComicsByProjectId(projectId);
            setComics(comicsData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#3B82F6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>

                    <Text className="text-white font-bold text-lg" numberOfLines={1}>
                        {project?.name || 'Project'}
                    </Text>

                    <TouchableOpacity className="p-2 -mr-2">
                        <MoreHorizontal color="white" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <FlashList
                    data={comics}
                    renderItem={({ item }) => (
                        // Reusing ComicCard, adding margins to fit grid if needed or using list layout
                        // Let's use Grid 2 columns for comics too
                        <View className="flex-1 items-center">
                            <ComicCard
                                id={item.id}
                                title={item.title}
                                coverUrl={item.coverUrl}
                                description={item.author}
                            />
                        </View>
                    )}
                    // @ts-ignore
                    estimatedItemSize={250}
                    numColumns={2}
                    contentContainerStyle={{ padding: 16 }}
                />
            </SafeAreaView>
        </View>
    );
}
