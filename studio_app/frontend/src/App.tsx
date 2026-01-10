import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { api } from './services/api';
// Stores
import { useProjectStore } from './store/useProjectStore';
import { useFileSystemStore } from './store/useFileSystemStore';

// Top Level Routes
import DesktopEnvironment from './components/DesktopEnvironment';
import EditorPage from './pages/EditorPage';

const App: React.FC = () => {
    // === DATA STATE ===
    const { setProjects } = useProjectStore();
    const { setFileSystem } = useFileSystemStore();

    // === DATA LOADING ===
    const loadData = async () => {
        try {
            const [projs, files] = await Promise.all([
                api.getProjects(),
                api.getFileSystem()
            ]);

            setProjects(projs);
            setFileSystem(files);
        } catch (e) {
            console.error("Failed to load initial data", e);
        }
    };

    useEffect(() => {
        if (window.resizeTo) window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        loadData();
    }, []);

    // We can access openedPageId/openedComicId here if we wanted to manipulate layout props
    // based on route, but MainLayout props (isInEditor) might be useful.
    // However, EditorPage wraps itself in EditorLayout, so simple MainLayout wrapping Desktop is fine?
    // Original App.tsx wrapped EVERYTHING in MainLayout.
    // But EditorPage uses EditorLayout.
    // If we wrap EditorPage in MainLayout, we get double layouts?
    // Let's look at original App.tsx:
    // <MainLayout isInEditor={!!openedPageId}> ... <EditorLayout> ... </EditorLayout> </MainLayout>
    // It seems EditorLayout was nested?
    // "EditorPage: ... Wrap in <EditorLayout>"
    // If EditorPage has EditorLayout, and we wrap Routes in MainLayout, we nest them.
    // The "isInEditor" prop on MainLayout likely hides Sidebar/Header?
    // If we use Routes, we can have separate layouts per route!
    // /editor/:id -> EditorPage (EditorLayout)
    // /* -> DesktopEnvironment (MainLayout)

    // BUT the prompt says: "Render: Keep <MainLayout> as the top wrapper".
    // Okay, we will keep MainLayout as top wrapper.

    const location = useLocation();
    const isEditorRoute = location.pathname.startsWith('/editor');

    return (
        <MainLayout isInEditor={isEditorRoute}>
            <Routes>
                <Route path="/editor/:comicId" element={<EditorPage />} />
                <Route path="/*" element={<DesktopEnvironment />} />
            </Routes>
        </MainLayout>
    );
};

export default App;
