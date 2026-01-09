export type ReadingMode = 'horizontal' | 'vertical';

export type FocusPointType = 'panel' | 'balloon';

export interface FocusPoint {
    id: string;
    type: FocusPointType;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Balloon extends FocusPoint {
    type: 'balloon';
    shape: 'ellipse' | 'rect' | 'cloud';
    text: string;
}

export interface ComicPage {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    balloons: Balloon[];
    // Panels are just focus points without text, usually.
    // We can treat balloons as focus points, or have a separate list.
    // For the script, we want an ordered list of "Steps".
    focusPoints: FocusPoint[];
}

export interface ComicDetails {
    id: string;
    title: string;
    pages: ComicPage[];
}

export interface IReaderService {
    getComicDetails(id: string): Promise<ComicDetails>;
}
