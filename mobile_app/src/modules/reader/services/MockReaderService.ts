import { IReaderService, ComicDetails, FocusPoint } from '../types';

export class MockReaderService implements IReaderService {
    async getComicDetails(id: string): Promise<ComicDetails> {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            id,
            title: 'Batman: Cinematic Edition',
            pages: [
                {
                    id: 'page1',
                    imageUrl: 'https://placehold.co/800x1200/png?text=Page+1',
                    width: 800,
                    height: 1200,
                    balloons: [
                        { id: 'b1', type: 'balloon', shape: 'ellipse', x: 50, y: 50, width: 200, height: 100, text: "I am Vengeance!" },
                        { id: 'b2', type: 'balloon', shape: 'rect', x: 400, y: 150, width: 150, height: 80, text: "Are you sure?" },
                    ],
                    focusPoints: [
                        // Step 1: Top Left Panel (Simulated)
                        { id: 'p1', type: 'panel', x: 20, y: 20, width: 360, height: 250 },
                        // Step 2: First Balloon
                        { id: 'b1', type: 'balloon', x: 50, y: 50, width: 200, height: 100 },
                        // Step 3: Top Right Panel
                        { id: 'p2', type: 'panel', x: 400, y: 20, width: 380, height: 250 },
                        // Step 4: Second Balloon
                        { id: 'b2', type: 'balloon', x: 400, y: 150, width: 150, height: 80 },
                        // Step 5: Bottom Wide Panel
                        { id: 'p3', type: 'panel', x: 20, y: 300, width: 760, height: 350 },
                    ]
                },
                // We can add more pages...
            ]
        };
    }
}

export const readerService = new MockReaderService();
