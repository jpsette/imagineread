import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, Image, Dimensions, TouchableOpacity } from 'react-native';
import { FlashList, ViewToken } from '@shopify/flash-list';
import { useReaderStore } from '../store/useReaderStore';
import { ComicPageManifest } from '../types/Manifest';
import { VectorBubble } from './VectorBubble';
import { CachedImage } from '../../../core/components/CachedImage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const PageItem = React.memo(({ page, onPress }: { page: ComicPageManifest; onPress: () => void }) => {
    const scaleFactor = SCREEN_WIDTH / page.width;
    // Handle optional fields safety 
    // const displayHeight = page.height * scaleFactor; 
    // Wait, width/height are required in manifest V1 but standard `ComicPage` had them too. 
    // Let's assume strict V1.
    const displayHeight = page.height * scaleFactor;

    return (
        <TouchableOpacity activeOpacity={1} onPress={onPress}>
            <View style={{ width: SCREEN_WIDTH, height: displayHeight, position: 'relative' }}>
                <CachedImage
                    source={{ uri: page.imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                    fadeDuration={0}
                />
                {page.layers?.balloons?.map((bubble) => (
                    <VectorBubble
                        key={bubble.id}
                        {...bubble}
                        x={bubble.x * scaleFactor}
                        y={bubble.y * scaleFactor}
                        width={bubble.width * scaleFactor}
                        height={bubble.height * scaleFactor}
                        isFocused={true} // Always focused in standard mode
                    />
                ))}
            </View>
        </TouchableOpacity>
    );
});

interface PageListProps {
    pages: ComicPageManifest[];
}

export const PageList = forwardRef<any, PageListProps>(({ pages }, ref) => {

    const readingMode = useReaderStore((state) => state.readingMode);
    const textSizeMultiplier = useReaderStore((state) => state.textSizeMultiplier);
    const toggleControls = useReaderStore((state) => state.toggleControls);
    const setCurrentPageIndex = useReaderStore((state) => state.setCurrentPageIndex);
    const currentPageIndex = useReaderStore((state) => state.currentPageIndex);

    // @ts-ignore - ViewToken typing is tricky
    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            const newIndex = viewableItems[0].index;
            if (newIndex !== undefined) {
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
            {/* @ts-ignore - FlashList strict typing issues with forwardRef */}
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
