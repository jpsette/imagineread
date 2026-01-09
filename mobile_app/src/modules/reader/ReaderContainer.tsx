import React, { useEffect, useState, useRef } from 'react';
import { View, Image, Dimensions, TouchableOpacity, StatusBar as RNStatusBar, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';
import { useReaderStore } from './store/useReaderStore';
import { readerService } from './services/MockReaderService';
import { ComicPageManifest } from './types/Manifest';
import { VectorBubble } from './components/VectorBubble';
import { ReaderControls } from './components/ReaderControls';
import { PageList } from './components/PageList';
import { useCinematicViewport } from './hooks/useCinematicViewport';
import { MonitorPlay, Minimize2 } from 'lucide-react-native';
import { CacheService } from '../../core/services/CacheService';
import { SafeBoundary } from '../../core/wrappers/SafeBoundary';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- CINEMATIC VIEW WRAPPER ---
const CinematicView = ({ page }: { page: ComicPageManifest }) => {
    const {
        currentFocusIndex,
        isCinematic,
        goToNextStep,
        goToPrevStep,
        toggleControls
    } = useReaderStore();

    // Access via LAYERS
    const focusPoint = page.layers?.focusPoints?.[currentFocusIndex];

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
                        source={{ uri: page.imageUri }} // Updated to imageUri
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                    {page.layers?.balloons?.map((bubble, index) => (
                        <VectorBubble
                            key={bubble.id}
                            {...bubble}
                            x={bubble.x * scaleFactor}
                            y={bubble.y * scaleFactor}
                            width={bubble.width * scaleFactor}
                            height={bubble.height * scaleFactor}
                            // Logic: In Cinematic, highlight if index matches focus index.
                            // Note: This assumes Balloons and FocusPoints are aligned or mapped 1:1, 
                            // which is a simplification for this contract.
                            isFocused={index === currentFocusIndex}
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
        setManifest,
        currentPageIndex,
        manifest
    } = useReaderStore();

    const [loading, setLoading] = useState(true);

    // List Ref for programmatic scrolling
    const listRef = useRef<any>(null);

    // 1. Load Data
    useEffect(() => {
        const loadComic = async () => {
            try {
                const data = await readerService.getComicDetails(comicId);
                setManifest(data);
            } catch (err) {
                // Handled by SafeBoundary higher up
                throw err;
            } finally {
                setLoading(false);
            }
        };
        loadComic();
    }, [comicId, setManifest]);

    // 2. Sync Cinematic Page Changes to Scroll Position
    useEffect(() => {
        if (listRef.current) {
            try {
                listRef.current.scrollToIndex({ index: currentPageIndex, animated: true });
            } catch (e) {
                // Ignore
            }
        }
    }, [currentPageIndex]);

    // 3. PREFETCHING STRATEGY
    useEffect(() => {
        if (!manifest?.pages?.length) return;
        const pages = manifest.pages;

        // Prefetch X next pages
        const PREFETCH_WINDOW = 3;
        const urlsToPrefetch: string[] = [];

        for (let i = 1; i <= PREFETCH_WINDOW; i++) {
            const nextIndex = currentPageIndex + i;
            if (nextIndex < pages.length) {
                urlsToPrefetch.push(pages[nextIndex].imageUri);
            }
        }

        if (urlsToPrefetch.length > 0) {
            CacheService.prefetch(urlsToPrefetch);
        }
    }, [currentPageIndex, manifest]);

    if (loading || !manifest) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    const pages = manifest.pages;
    const currentPage = pages[currentPageIndex] || pages[0];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} edges={['top', 'bottom']}>
            <SafeBoundary>
                <RNStatusBar hidden={!controlsVisible} barStyle="light-content" />

                {/* VIEWER AREA */}
                {isCinematic ? (
                    <CinematicView page={currentPage} />
                ) : (
                    <PageList ref={listRef} pages={pages} />
                )}

                {/* CONTROLS OVERLAY */}
                {controlsVisible && (
                    <>
                        <ReaderControls title={manifest.metadata.title} />

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
            </SafeBoundary>
        </SafeAreaView>
    );
}
