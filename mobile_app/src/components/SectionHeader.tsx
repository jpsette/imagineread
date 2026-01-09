import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SectionHeaderProps {
    title: string;
    onPress?: () => void;
}

export function SectionHeader({ title, onPress }: SectionHeaderProps) {
    return (
        <View className="flex-row items-center justify-between mb-4 px-4">
            <Text className="text-text-primary text-lg font-bold">{title}</Text>
            <TouchableOpacity
                onPress={onPress}
                className="flex-row items-center active:opacity-70"
            >
                <Text className="text-text-secondary text-sm mr-1">See All</Text>
                <ChevronRight size={16} color="#A1A1AA" />
            </TouchableOpacity>
        </View>
    );
}
