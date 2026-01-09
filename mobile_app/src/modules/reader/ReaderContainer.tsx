import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Dimensions, TouchableOpacity, StatusBar as RNStatusBar, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';
import { useReaderStore } from './store/useReaderStore';
import { readerService } from './services/MockReaderService';
import { ComicPage, ComicDetails } from './types';
import { VectorBubble } from './components/VectorBubble';
import { ReaderControls } from './components/ReaderControls';
import { PageList } from './components/PageList';
import { useCinematicViewport } from './hooks/useCinematicViewport';
import { MonitorPlay, Minimize2 } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- CINEMATIC VIEW WRAPPER ---
// Renders the CURRENT PAGE in the store
const CinematicView = ({ page }: { page: ComicPage }) => {
    const {
        currentFocusIndex,
        isCinematic,
        goToNextStep,
        goToPrevStep,
        toggleControls
    } = useReaderStore();

    const focusPoint = page.focusPoints?.[currentFocusIndex];

    const { animatedStyle } = useCinematicViewport({
        currentFocusIndex,
        currentFocusPoint: focusPoint,
        enabled: isCinematic,
        baseImageWidth: page.width
    });

    const handleTouch = (evt: any) => {
        const x = evt.nativeEvent.locationX;
        const width = Dimensions.get('window').width;

        if (x < width * 0.3) {
            goToPrevStep();
        } else if (x > width * 0.7) {
            goToNextStep();
        } else {
            toggleControls();
        }
    };

    const scaleFactor = SCREEN_WIDTH / page.width;
    const displayHeight = page.height * scaleFactor;

    return (
        <View style={{ flex: 1, backgroundColor: 'black', overflow: 'hidden' }}>
            <TouchableOpacity activeOpacity={1} onPress={handleTouch} style={{ flex: 1 }}>
                <Animated.View style={[{ width: SCREEN_WIDTH, height: displayHeight }, animatedStyle]}>
                    <Image
                        source={{ uri: page.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                    {page.balloons.map((bubble) => (
                        <VectorBubble
                            key={bubble.id}
                            {...bubble}
                            x={bubble.x * scaleFactor}
                            y={bubble.y * scaleFactor}
                            width={bubble.width * scaleFactor}
                            height={bubble.height * scaleFactor}
                        />
                    ))}
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};


// --- MAIN CONTAINER ---
export function ReaderContainer({ comicId }: { comicId: string }) {
    const {
        controlsVisible,
        isCinematic,
        toggleCinematic,
        setPages,
        currentPageIndex,
        pages
    } = useReaderStore();

    const [loading, setLoading] = useState(true);
    const [comicTitle, setComicTitle] = useState('');

    // List Ref for programmatic scrolling
    const listRef = useRef<FlashList<ComicPage>>(null);

    // 1. Load Data
    useEffect(() => {
        const loadComic = async () => {
            const data = await readerService.getComicDetails(comicId);
            setComicTitle(data.title);
            setPages(data.pages);
            setLoading(false);
        };
        loadComic();
    }, [comicId, setPages]);

    // 2. Sync Cinematic Page Changes to Scroll Position
    useEffect(() => {
        // When currentPageIndex changes (e.g. via Cinematic Next Step), scroll the list
        // Check if ref exists
        if (listRef.current) {
            // We use scrollToIndex. Note: For FlashList vertical, this works reliably if estimated sizes are good.
            // For Horizontal, it works well.

            // Wrap in try/catch or check bounds potentially, but FlashList is robust.
            try {
                listRef.current.scrollToIndex({ index: currentPageIndex, animated: true });
            } catch (e) {
                // Ignore scroll errors (e.g. if list not ready)
            }
        }
    }, [currentPageIndex]);

    if (loading || !pages.length) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    const currentPage = pages[currentPageIndex] || pages[0];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} edges={['top', 'bottom']}>
            <RNStatusBar hidden={!controlsVisible} barStyle="light-content" />

            {/* VIEWER AREA */}
            {isCinematic ? (
                // In Cinematic Mode, render the Active Page
                <CinematicView page={currentPage} />
            ) : (
                <PageList ref={listRef} pages={pages} />
            )}

            {/* CONTROLS OVERLAY */}
            {controlsVisible && (
                <>
                    <ReaderControls title={comicTitle} />

                    {/* CINEMATIC TOGGLE FAB */}
                    <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={toggleCinematic}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isCinematic ? '#3B82F6' : '#2A2A2A',
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderRadius: 30,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }}
                        >
                            {isCinematic ? <Minimize2 size={20} color="white" style={{ marginRight: 8 }} /> : <MonitorPlay size={20} color="white" style={{ marginRight: 8 }} />}
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                {isCinematic ? 'Exit Cinematic' : 'Enter Cinematic'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}
