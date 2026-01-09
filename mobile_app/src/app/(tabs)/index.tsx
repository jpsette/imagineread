import { View, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComicCard } from '@/components/ComicCard';
import { SectionHeader } from '@/components/SectionHeader';

const CONTINUE_READING = [
    { id: '1', title: 'Batman: Year One', cover: 'https://placehold.co/400x600/png?text=Batman', progress: 0.75 },
    { id: '2', title: 'Saga Vol. 1', cover: 'https://placehold.co/400x600/png?text=Saga', progress: 0.30 },
    { id: '3', title: 'Paper Girls', cover: 'https://placehold.co/400x600/png?text=Paper+Girls', progress: 0.10 },
];

const RECENTLY_ADDED = [
    { id: '4', title: 'Watchmen', cover: 'https://placehold.co/400x600/png?text=Watchmen' },
    { id: '5', title: 'Sandman', cover: 'https://placehold.co/400x600/png?text=Sandman' },
    { id: '6', title: 'Maus', cover: 'https://placehold.co/400x600/png?text=Maus' },
    { id: '7', title: 'Persepolis', cover: 'https://placehold.co/400x600/png?text=Persepolis' },
];

export default function HomeScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <StatusBar barStyle="light-content" />
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>

                {/* Continue Reading Section */}
                <View className="mt-6">
                    <SectionHeader title="Continue Reading" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    >
                        {CONTINUE_READING.map((comic) => (
                            <ComicCard
                                key={comic.id}
                                id={comic.id}
                                title={comic.title}
                                coverUrl={comic.cover}
                                progress={comic.progress}
                                description="Continue reading"
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Recently Added Section */}
                <View className="mt-8">
                    <SectionHeader title="Recently Added" />
                    <View className="flex-row flex-wrap px-4">
                        {RECENTLY_ADDED.map((comic) => (
                            <View key={comic.id} className="w-1/2 mb-6 pr-2">
                                <ComicCard
                                    id={comic.id}
                                    title={comic.title}
                                    coverUrl={comic.cover}
                                    className="w-full mr-0"
                                    description="Recently added"
                                />
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
