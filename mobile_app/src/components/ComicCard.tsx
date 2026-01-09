import { View, Text, Image, TouchableOpacity } from 'react-native';
import { cn } from '@/lib/utils'; // Assuming alias is configured as @/lib/utils, but instruction said @/* -> ./src/*. So @/lib/utils is correct.
import { Link } from 'expo-router';

interface ComicCardProps {
    title: string;
    coverUrl: string;
    progress?: number;
    className?: string;
}

export function ComicCard({ title, coverUrl, progress, className }: ComicCardProps) {
    return (
        <Link href="/reader/1" asChild>
            <TouchableOpacity className={cn('w-[140px] mr-4', className)}>
                <View className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface shadow-sm">
                    <Image
                        source={{ uri: coverUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    {progress !== undefined && (
                        <View className="absolute bottom-0 left-0 right-0 h-1 bg-surface-highlight">
                            <View
                                className="h-full bg-primary"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </View>
                    )}
                </View>
                <Text className="text-text-primary text-sm font-medium mt-2" numberOfLines={1}>
                    {title}
                </Text>
            </TouchableOpacity>
        </Link>
    );
}
