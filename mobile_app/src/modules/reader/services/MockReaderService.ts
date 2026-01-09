import { ComicManifest } from '../types/Manifest';
import { ManifestAdapter } from './ManifestAdapter';

// Raw data simulating a Backend Response (JSON)
const RAW_MOCK_DATA = {
    version: "1.0",
    id: "1",
    metadata: {
        title: "The Guardians of Imagination",
        author: "Stan Lee AI",
        language: "en",
        direction: "ltr"
    },
    pages: [
        {
            id: "p1",
            imageUri: "https://d32qys9a6wm9no.cloudfront.net/images/movies/poster/55/55ec7fd056461947844075193f411ced_300x442.jpg?t=1613597658",
            width: 1000,
            height: 1500,
            layers: {
                balloons: [
                    { id: "b1", text: "Look at the horizon!", x: 100, y: 100, width: 300, height: 150, type: "speech", tail: { x: 50, y: 150 } },
                    { id: "b2", text: "It's beautiful...", x: 500, y: 400, width: 300, height: 100, type: "thought" }
                ],
                focusPoints: [
                    { x: 50, y: 50, width: 400, height: 300, type: "panel", order: 0 },
                    { x: 450, y: 350, width: 400, height: 200, type: "panel", order: 1 }
                ]
            }
        },
        {
            id: "p2",
            imageUri: "https://d32qys9a6wm9no.cloudfront.net/images/movies/poster/8f/8fdc2621051512f4640db74744d0811b_300x442.jpg?t=1569319808",
            width: 1000,
            height: 1500,
            layers: {
                balloons: [
                    { id: "b3", text: "We must go now.", x: 200, y: 800, width: 250, height: 120, type: "speech" }
                ],
                focusPoints: [
                    { x: 150, y: 750, width: 350, height: 250, type: "panel", order: 0 }
                ]
            }
        },
        { // Page 3 - Text Heavy
            id: "p3",
            imageUri: "https://d32qys9a6wm9no.cloudfront.net/images/movies/poster/03/036b009e5306d649ab286c4f1c7d248b_300x442.jpg?t=1588843916",
            width: 1000,
            height: 1500,
            layers: {
                balloons: [],
                focusPoints: []
            }
        },
        { // Page 4
            id: "p4",
            imageUri: "https://d32qys9a6wm9no.cloudfront.net/images/movies/poster/e8/e854fa646808794c452e8544df625e1a_300x442.jpg?t=1563870634",
            width: 1000,
            height: 1500,
            layers: {
                balloons: [],
                focusPoints: []
            }
        }
    ]
};

export const readerService = {
    async getComicDetails(id: string): Promise<ComicManifest> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use Adapter to ensure contract validity
        return ManifestAdapter.parse(RAW_MOCK_DATA);
    }
};
