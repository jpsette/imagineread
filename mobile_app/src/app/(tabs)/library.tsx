import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArchiveX } from 'lucide-react-native';
import { LibraryService, Project } from '../../modules/library/services/LibraryService';
import { ProjectCard } from '../../components/library/ProjectCard';

export default function LibraryScreen() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const data = await LibraryService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProjects = useMemo(() => {
        if (!searchQuery) return projects;
        return projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    const renderHeader = () => (
        <View className="px-4 pb-4">
            <Text className="text-white text-3xl font-bold mb-4">Library</Text>

            {/* Search Bar */}
            <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                <Search color="#71717a" size={20} />
                <TextInput
                    className="flex-1 text-white ml-3 text-base"
                    placeholder="Search projects..."
                    placeholderTextColor="#71717a"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View className="items-center justify-center py-20 opacity-50">
            <ArchiveX color="white" size={48} />
            <Text className="text-zinc-400 mt-4 text-base">No projects found</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1" edges={['top']}>
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#3B82F6" />
                    </View>
                ) : (
                    <FlashList
                        data={filteredProjects}
                        renderItem={({ item }) => <ProjectCard project={item} />}
                        // @ts-ignore
                        estimatedItemSize={140}
                        numColumns={2}
                        contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        ListEmptyComponent={renderEmpty}
                        keyboardDismissMode="on-drag"
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
