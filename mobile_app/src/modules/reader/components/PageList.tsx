import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, Image, Dimensions, TouchableOpacity } from 'react-native';
import { FlashList, ViewToken } from '@shopify/flash-list';
import { useReaderStore } from '../store/useReaderStore';
import { ComicPage } from '../types';
import { VectorBubble } from './VectorBubble';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const PageItem = React.memo(({ page, onPress }: { page: ComicPage; onPress: () => void }) => {
    const scaleFactor = SCREEN_WIDTH / page.width;
    const displayHeight = page.height * scaleFactor;

    return (
        <TouchableOpacity activeOpacity={1} onPress={onPress}>
            <View style={{ width: SCREEN_WIDTH, height: displayHeight, position: 'relative' }}>
                <Image
                    source={{ uri: page.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                    fadeDuration={0}
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
            </View>
        </TouchableOpacity>
    );
});

interface PageListProps {
    pages: ComicPage[];
}

// Forward Ref to allow parent to control scrolling
export const PageList = forwardRef<FlashList<ComicPage>, PageListProps>(({ pages }, ref) => {

    const readingMode = useReaderStore((state) => state.readingMode);
    const textSizeMultiplier = useReaderStore((state) => state.textSizeMultiplier);
    const toggleControls = useReaderStore((state) => state.toggleControls);
    const setCurrentPageIndex = useReaderStore((state) => state.setCurrentPageIndex);
    const currentPageIndex = useReaderStore((state) => state.currentPageIndex);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<ComicPage>[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            const newIndex = viewableItems[0].index;
            // Only update if different to avoid loops, and verify strictness
            // We use getState to check current? Or just trust callback?
            if (newIndex !== undefined) {
                // Optimization: We could check if (newIndex !== currentPageIndex) but 
                // we need to be careful about not blocking legitimate updates.
                // For now, simply dispatch.
                // We specifically use the action that sets index ONLY (doesn't reset focus if we scroll?)
                // Actually the store says `setCurrentPageIndex` resets focus to 0. 
                // If user scrolls manually, we probably DO want to reset focus to 0 (start of page).
                setCurrentPageIndex(newIndex);
            }
        }
    }, [setCurrentPageIndex]);

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 50
    }), []);

    const extraData = useMemo(() => [textSizeMultiplier, readingMode], [textSizeMultiplier, readingMode]);

    return (
        <View style={{ flex: 1, width: '100%', height: '100%' }}>
            {/* @ts-ignore - FlashList Ref type compatibility */}
            <FlashList
                ref={ref}
                data={pages}
                renderItem={({ item }) => <PageItem page={item} onPress={toggleControls} />}
                estimatedItemSize={readingMode === 'vertical' ? 1200 : SCREEN_WIDTH}
                horizontal={readingMode === 'horizontal'}
                pagingEnabled={readingMode === 'horizontal'}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                extraData={extraData}
                drawDistance={SCREEN_HEIGHT * 2}
            />
        </View>
    );
});
