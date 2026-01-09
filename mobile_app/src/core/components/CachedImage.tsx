import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { CacheService } from '../services/CacheService';

interface CachedImageProps extends ImageProps {
    source: { uri: string }; // We enforce object source with URI for this component
}

export const CachedImage = ({ source, style, ...props }: CachedImageProps) => {
    const [localUri, setLocalUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (!source.uri) return;
            try {
                const cachedPath = await CacheService.downloadAndCache(source.uri);
                if (isMounted) {
                    setLocalUri(cachedPath);
                    setLoading(false);
                }
            } catch (e) {
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [source.uri]);

    if (loading) {
        return (
            <View style={[style, styles.center]}>
                <ActivityIndicator size="small" color="#555" />
            </View>
        );
    }

    if (error || !localUri) {
        // Fallback or error state
        return (
            <View style={[style, styles.center, { backgroundColor: '#333' }]}>
                {/* Could imply icon here */}
            </View>
        );
    }

    return (
        <Image
            {...props}
            style={style}
            source={{ uri: localUri }}
        />
    );
};

const styles = StyleSheet.create({
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});
