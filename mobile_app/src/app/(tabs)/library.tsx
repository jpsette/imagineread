import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background items-center justify-center">
            <Text className="text-text-primary text-xl">Library - Coming Soon</Text>
        </SafeAreaView>
    );
}
