import { useState, useMemo } from 'react';
import { Save, ArrowLeft, X, Undo, Redo, Check, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@shared/api/api';

import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';
import { editorModes } from '@features/editor/tools/definitions/editorModes';
import { EditorMode } from '@shared/types';
import { UnsavedChangesModal } from '@features/editor/components/modals/UnsavedChangesModal';
import { useLocalProjectSave } from '@features/editor/hooks/useLocalProjectSave';

export const EditorHeader = () => {
    // --- SMART HEADER LOGIC ---
    const { fileId } = useParams<{ fileId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { activeMode, setActiveMode } = useEditorUIStore();
    const { isDirty, isSaved, setIsDirty, setIsSaved } = useEditorStore();
    const tabs = editorModes;

    const [isSaving, setIsSaving] = useState(false);

    // UNSAVED CHANGES MODAL STATE (GLOBAL)
    const {
        showUnsavedModal, setShowUnsavedModal,
        pendingNavigationPath, setPendingNavigationPath
    } = useEditorUIStore();

    // LOCAL PROJECT DETECTION
    const isLocalFile = fileId?.startsWith('/') || false;

    // For local files, derive the comic path (parent of .origin folder)
    // fileId is like /path/to/project/ComicName/.origin/page_001.jpg
    // We need the comic root: /path/to/project/ComicName
    const comicPath = useMemo(() => {
        if (!isLocalFile || !fileId) return null;
        const parts = fileId.split('/');
        const originIndex = parts.findIndex(p => p === '.origin');
        if (originIndex > 0) {
            return parts.slice(0, originIndex).join('/');
        }
        // Fallback: parent of parent
        return parts.slice(0, -2).join('/');
    }, [fileId, isLocalFile]);

    const { saveToLocal } = useLocalProjectSave(comicPath);

    // Compute Status
    const saveStatus = isSaving ? 'saving' : (isSaved && !isDirty ? 'saved' : 'idle');

    // 2. Internal Save Handler
    const handleSmartSave = async () => {
        if (isSaving || (isSaved && !isDirty) || !fileId) return;

        setIsSaving(true);
        const toastId = toast.loading('Salvando alterações...');

        try {
            const currentBalloons = useEditorStore.getState().balloons;
            const currentPanels = useEditorStore.getState().panels;
            const cleanImageUrl = useEditorUIStore.getState().cleanImageUrl;

            if (isLocalFile) {
                // LOCAL SAVE: Use Electron filesystem
                const pageId = fileId.split('/').pop()?.replace(/\.[^.]+$/, '') || 'unknown';

                const success = await saveToLocal({
                    pageId,
                    balloons: currentBalloons,
                    panels: currentPanels,
                    cleanedImagePath: cleanImageUrl || undefined,
                });

                if (!success) throw new Error('Failed to save to local project');
            } else {
                // CLOUD SAVE: Use API
                await api.updateFileData(fileId, {
                    balloons: currentBalloons,
                    panels: currentPanels,
                    cleanUrl: cleanImageUrl || undefined,
                });

                // Invalidate Cache
                queryClient.invalidateQueries({ queryKey: ['file', fileId] });
            }

            // Update Store
            setIsDirty(false);
            setIsSaved(true);

            toast.success('Salvo com sucesso!', { id: toastId });
            return true; // Success signal
        } catch (e: any) {
            console.error("Save error", e);
            toast.error(`Erro ao salvar: ${e.message}`, { id: toastId });
            return false;
        } finally {
            setIsSaving(false);
        }
    };


    // Navigation Helper
    const performNavigation = () => {
        if (!pendingNavigationPath) return;

        if (pendingNavigationPath === 'BACK') {
            navigate(-1);
        } else {
            navigate(pendingNavigationPath);
        }
    };

    // Navigation Interceptors (Local Triggers)
    const requestNavigation = (path: string) => {
        if (isDirty) {
            setPendingNavigationPath(path);
            setShowUnsavedModal(true);
        } else {
            if (path === 'BACK') {
                navigate(-1);
            } else {
                navigate(path);
            }
        }
    };

    // Modal Handlers
    const handleDiscard = () => {
        setIsDirty(false); // Force clean state so we can leave
        setShowUnsavedModal(false);
        performNavigation();
        setPendingNavigationPath(null);
    };

    const handleSaveAndExit = async () => {
        const success = await handleSmartSave();
        if (success) {
            setShowUnsavedModal(false);
            performNavigation();
            setPendingNavigationPath(null);
        }
    };

    const handleBack = () => requestNavigation('BACK');
    const handleClose = () => requestNavigation('/');

    return (
        <header className="w-full z-50 flex items-center justify-center bg-[#0c0c0e] border-b border-white/5 py-1">
            {/* ISLAND CONTAINER */}
            <div className="flex items-center gap-1 p-1">
                {/* LEFT: Back Button */}
                <button
                    onClick={handleBack}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 mr-1"
                    title="Voltar"
                >
                    <ArrowLeft size={16} />
                </button>

                {/* DIVIDER */}
                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* CENTER: Navigation Tabs */}
                <nav className="flex items-center gap-1">
                    {tabs.map((tab) => {
                        const isActive = activeMode === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveMode(tab.key as EditorMode)}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${isActive
                                    ? 'bg-zinc-800 text-neon-blue shadow-glow-sm ring-1 ring-white/5'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* DIVIDER */}
                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* UNDO / REDO */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => useEditorStore.getState().undo()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                        title="Desfazer"
                    >
                        <Undo size={14} />
                    </button>
                    <button
                        onClick={() => useEditorStore.getState().redo()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                        title="Refazer"
                    >
                        <Redo size={14} />
                    </button>
                </div>

                {/* DIVIDER */}
                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* ACTIONS */}
                <div className="flex items-center gap-2 pl-1">
                    <button
                        onClick={handleSmartSave}
                        disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 ${saveStatus === 'saved'
                            ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                            : saveStatus === 'saving'
                                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 cursor-wait'
                                : 'bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-white hover:shadow-glow-md'
                            }`}
                    >
                        {saveStatus === 'saved' ? (
                            <Check size={14} className="animate-in zoom-in spin-in-50 duration-300" />
                        ) : saveStatus === 'saving' ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Save size={14} className="group-hover:scale-110 transition-transform" />
                        )}

                        <span className="hidden sm:inline w-12 text-center">
                            {saveStatus === 'saved' ? 'Salvo' : saveStatus === 'saving' ? '...' : 'Salvar'}
                        </span>
                    </button>

                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-95"
                        title="Fechar Editor"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* UNSAVED CHANGES MODAL */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                isSaving={isSaving}
                onCancel={() => {
                    setShowUnsavedModal(false);
                    setPendingNavigationPath(null);
                }}
                onDiscard={handleDiscard}
                onSaveAndExit={handleSaveAndExit}
            />
        </header>
    );
};
