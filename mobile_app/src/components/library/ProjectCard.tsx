import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Folder } from 'lucide-react-native';
import { Project } from '../../modules/library/services/LibraryService';

interface ProjectCardProps {
    project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            className="flex-1 m-2 bg-zinc-900 rounded-xl p-4 border border-zinc-800"
            activeOpacity={0.7}
            onPress={() => router.push(`/project/${project.id}`)}
            style={{ minHeight: 140 }}
        >
            <View className="flex-row justify-between items-start mb-4">
                <View
                    style={{ backgroundColor: project.color + '20' }} // 20% opacity of theme color
                    className="p-3 rounded-lg"
                >
                    <Folder color={project.color} size={24} />
                </View>
                <View className="bg-zinc-800 px-2 py-1 rounded">
                    <Text className="text-zinc-400 text-xs font-bold">{project.comicCount}</Text>
                </View>
            </View>

            <View className="mt-auto">
                <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>
                    {project.name}
                </Text>
                <Text className="text-zinc-500 text-xs" numberOfLines={2}>
                    {project.description}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
