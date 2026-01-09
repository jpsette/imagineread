import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
// Import Animated from Reanimated for Shared Transitions
import Animated from 'react-native-reanimated';

interface ComicCardProps {
    id: string; // Added ID
    title: string;
    coverUrl: string;
    description: string;
    progress?: number;
    className?: string; // Keep for compatibility if used elsewhere
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export function ComicCard({ id, title, coverUrl, description, progress, className }: ComicCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            className="mb-4 bg-zinc-900 rounded-xl overflow-hidden mx-auto" // Added mx-auto for grid centering
            style={{ width: CARD_WIDTH }}
            onPress={() => router.push(`/comic/${id}`)} // Navigate to Details
        >
            <Animated.Image
                source={{ uri: coverUrl }}
                className="w-full h-64 bg-zinc-800"
                resizeMode="cover"
                // @ts-ignore
                sharedTransitionTag={`cover-${id}`}
            />
            {progress !== undefined && (
                <View className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                    <View
                        className="h-full bg-blue-500"
                        style={{ width: `${progress * 100}%` }}
                    />
                </View>
            )}
            <View className="p-3">
                <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
                    {title}
                </Text>
                <Text className="text-zinc-400 text-xs" numberOfLines={2}>
                    {description}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
