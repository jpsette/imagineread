import React from 'react';
import { Layer, Image as KonvaImage } from 'react-konva';

interface BackgroundLayerProps {
    isCleanVisible: boolean;
    imgClean: HTMLImageElement | undefined;
    imgOriginal: HTMLImageElement | undefined;
    isLoaded: boolean;
}

const BackgroundImage = ({
    image,
    name,
    visible = true
}: {
    image: HTMLImageElement | undefined,
    name: string,
    visible?: boolean
}) => {
    if (!image) return null;
    return (
        <KonvaImage
            name={name}
            image={image}
            visible={visible} // Control visibility without unmounting
            perfectDrawEnabled={false}
            listening={false}
        />
    );
};

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
    isCleanVisible,
    imgClean,
    imgOriginal,
    isLoaded
}) => {
    return (
        <Layer listening={false}>
            <BackgroundImage
                name="base-image"
                image={isCleanVisible ? (imgClean || imgOriginal) : imgOriginal} // Fallback to Original if Clean not loaded
                visible={isLoaded} // Only show if fully loaded to prevent partial render
            />
        </Layer>
    );
};
