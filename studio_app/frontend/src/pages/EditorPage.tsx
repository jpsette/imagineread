import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ComicWorkstation from '../features/editor/ComicWorkstation';
import { EditorLayout } from '../layouts/EditorLayout';
import { useFileSystemStore } from '../store/useFileSystemStore';
import EditorView from '../features/editor/EditorView';

const EditorPage: React.FC = () => {
    const { comicId } = useParams<{ comicId: string }>();

    // Store access
    const { fileSystem, setOpenedComicId, setOpenedPageId, openedPageId } = useFileSystemStore();

    // Sync URL param to Store
    useEffect(() => {
        if (comicId) {
            setOpenedComicId(comicId);
        }
        return () => {
            setOpenedComicId(null);
        }
    }, [comicId, setOpenedComicId]);

    // Derived Data for EditorView
    const comic = fileSystem.find(f => f.id === comicId);
    const openedPageUrl = openedPageId ? fileSystem.find(f => f.id === openedPageId)?.url || '' : '';
    const openedPageName = openedPageId ? fileSystem.find(f => f.id === openedPageId)?.name || 'Page' : 'Page';
    const openedPageBalloons = openedPageId ? fileSystem.find(f => f.id === openedPageId)?.balloons : undefined;
    const openedPageCleanUrl = openedPageId ? fileSystem.find(f => f.id === openedPageId)?.cleanUrl : undefined;

    if (!comic) {
        // Optionally redirect or show loading
        if (fileSystem.length > 0) {
            // If loaded but not found, maybe redirect?
            // navigate('/');
            return <div className="text-white/60 p-10 flex items-center justify-center">Comic not found</div>;
        }
        return null; // Loading state handled by layout usually
    }

    return (
        <EditorLayout className="z-[200]">
            {/* Workstation handles grid view and file management */}
            <ComicWorkstation />

            {/* Sub-Editor (Single Page) Overlay */}
            {openedPageId && (
                <div className="fixed inset-0 z-[300] bg-black">
                    <EditorView
                        imageUrl={openedPageUrl}
                        onBack={() => setOpenedPageId(null)}
                        comicName={comic.name}
                        pageName={openedPageName}
                        fileId={openedPageId}
                        initialBalloons={openedPageBalloons}
                        cleanUrl={openedPageCleanUrl}
                    />
                </div>
            )}
        </EditorLayout>
    );
};

export default EditorPage;
