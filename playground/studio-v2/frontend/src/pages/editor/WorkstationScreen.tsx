import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorLayout } from '../../layouts/EditorLayout';
import { ComicWorkstation } from '@features/editor/ComicWorkstation';
import { useFileActions } from '@shared/hooks/useFileActions';
import { useFileItem } from '@shared/hooks/useFileItem';
import { useFolderContents } from '@pages/dashboard/hooks/useFolderContents';
import { FileEntry } from '@shared/types';
import { useQueryClient } from '@tanstack/react-query';

// API base URL
const API_URL = 'http://127.0.0.1:8000';

export const WorkstationScreen: React.FC = () => {
    const { comicId: rawComicId } = useParams<{ comicId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Decode URL-encoded path (for local files with slashes)
    const comicId = rawComicId ? decodeURIComponent(rawComicId) : null;

    // Detect if this is a LOCAL file (path starts with /)
    const isLocalFile = comicId?.startsWith('/') || false;
    const isPDF = comicId?.toLowerCase().endsWith('.pdf') || false;

    // Detect if comicId is a comic FOLDER (not a PDF file)
    // Comic folders are directories that contain comic.json
    const isComicFolder = isLocalFile && !isPDF && !comicId?.match(/\.\w+$/);

    // === LOCAL PDF STATE ===
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [localPages, setLocalPages] = useState<FileEntry[]>([]);
    const [hasCheckedAssets, setHasCheckedAssets] = useState(false);

    // For local files, create a synthetic comic object
    const localComic = useMemo(() => {
        if (!isLocalFile || !comicId) return null;
        const name = comicId.split('/').pop() || 'Comic';
        return {
            id: comicId,
            name: name.replace(/\.(pdf|cbz|cbr)$/i, ''), // Remove extension from display name
            type: 'comic' as const,
            url: `media://${comicId}`,
            isLocal: true
        };
    }, [comicId, isLocalFile]);

    // Get the directory where the PDF is located (for PDF files)
    const pdfDirectory = useMemo(() => {
        if (!comicId || isComicFolder) return null;
        return comicId.substring(0, comicId.lastIndexOf('/'));
    }, [comicId, isComicFolder]);

    // === LOAD PAGES FROM COMIC FOLDER ===
    useEffect(() => {
        if (!isLocalFile || !isComicFolder || !comicId || hasCheckedAssets) return;

        const loadComicFolderPages = async () => {
            console.log('📚 [Workstation] Loading comic folder pages from:', comicId);

            try {
                // For comic folders, .origin is directly inside the folder
                const originPath = `${comicId}/.origin`;
                if (!window.electron?.local?.readDirectory) {
                    throw new Error('Electron API not available');
                }

                const result = await window.electron.local.readDirectory(originPath);

                if (result.success && result.files && result.files.length > 0) {
                    const jpgFiles = result.files
                        .filter((f: any) => !f.isDirectory && f.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/))
                        .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

                    console.log(`✅ [Workstation] Found ${jpgFiles.length} pages in comic folder`);

                    const pages: FileEntry[] = jpgFiles.map((file: any, index: number) => ({
                        id: `${originPath}/${file.name}`,
                        name: `Page ${index + 1}`,
                        type: 'file' as const,
                        url: `media://${originPath}/${file.name}`,
                        order: index,
                        parentId: comicId,
                        projectId: 'local',
                        createdAt: new Date().toISOString()
                    }));

                    setLocalPages(pages);
                } else {
                    console.warn('⚠️ [Workstation] No pages found in .origin folder');
                }
            } catch (error) {
                console.error('❌ [Workstation] Failed to load comic folder:', error);
            } finally {
                setHasCheckedAssets(true);
            }
        };

        loadComicFolderPages();
    }, [isLocalFile, isComicFolder, comicId, hasCheckedAssets]);

    // === CHECK FOR EXISTING ASSETS & EXTRACT PDF ===
    useEffect(() => {
        if (!isLocalFile || !isPDF || !comicId || !pdfDirectory || hasCheckedAssets) return;

        const checkAndExtract = async () => {
            console.log('🔍 [Workstation] Checking for extracted pages...');

            // Check if assets folder exists and has pages
            try {
                // Check for .origin folder (hidden folder for original extracted pages)
                const originPath = `${pdfDirectory}/.origin`;
                if (!window.electron?.local?.readDirectory) {
                    throw new Error('Electron API not available');
                }
                const result = await window.electron.local.readDirectory(originPath);


                if (result.success && result.files && result.files.length > 0) {
                    // Filter for JPG files FIRST
                    const jpgFiles = result.files
                        .filter((f: any) => !f.isDirectory && f.name.toLowerCase().endsWith('.jpg'));

                    console.log(`📂 [Workstation] .origin folder has ${result.files.length} items, ${jpgFiles.length} JPG files`);

                    // Only skip extraction if we actually have JPG files
                    if (jpgFiles.length > 0) {
                        console.log(`✅ Found ${jpgFiles.length} extracted pages`);

                        // Convert to FileEntry format
                        const pages: FileEntry[] = jpgFiles
                            .sort((a: any, b: any) => a.name.localeCompare(b.name))
                            .map((f: any, index: number) => ({
                                id: `${originPath}/${f.name}`,
                                name: `Page ${index + 1}`,
                                type: 'file' as const,
                                url: `media://${originPath}/${f.name}`,
                                order: index,
                                parentId: comicId,
                                projectId: 'local',
                                createdAt: new Date().toISOString()
                            }));

                        setLocalPages(pages);
                        setHasCheckedAssets(true);
                        return;
                    }

                    console.log('⚠️ No JPG files found in .origin, will extract PDF');
                }
            } catch (e) {
                console.log('📂 .origin folder not found, will extract PDF');
            }

            // No assets found - extract the PDF
            setIsExtracting(true);
            setExtractionError(null);

            try {
                console.log('📄 Extracting PDF pages...');
                const response = await fetch(`${API_URL}/extract_pdf_pages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pdf_path: comicId,
                        output_dir: pdfDirectory
                    })
                });

                if (!response.ok) {
                    throw new Error(`Extraction failed: ${response.statusText}`);
                }

                const data = await response.json();
                console.log(`✅ Extracted ${data.page_count} pages`);

                // Convert to FileEntry format
                const pages: FileEntry[] = data.pages.map((p: any, index: number) => ({
                    id: p.path,
                    name: `Page ${p.page}`,
                    type: 'file' as const,
                    url: `media://${p.path}`,
                    order: index,
                    parentId: comicId,
                    projectId: 'local',
                    createdAt: new Date().toISOString()
                }));

                setLocalPages(pages);
            } catch (error: any) {
                console.error('❌ PDF extraction failed:', error);
                setExtractionError(error.message || 'Failed to extract PDF');
            } finally {
                setIsExtracting(false);
                setHasCheckedAssets(true);
            }
        };

        checkAndExtract();
    }, [isLocalFile, isPDF, comicId, pdfDirectory, hasCheckedAssets]);

    // === DATA FETCHING (for cloud comics only) ===
    const { data: cloudComic, isLoading: isLoadingComic } = useFileItem(
        isLocalFile ? null : comicId
    );

    // Use local or cloud comic
    const comic = isLocalFile ? localComic : cloudComic;

    // For cloud comics
    const { data: contents, isLoading: isLoadingPages } = useFolderContents(
        isLocalFile ? null : comicId
    );

    const { uploadPages, deletePages } = useFileActions();

    // Filter pages from contents (for cloud comics) or use local pages
    const pages = isLocalFile
        ? localPages
        : (contents || [])
            .filter((f: FileEntry) => f.type === 'file')
            .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Actions Wrappers
    const handleAddPages = async (files: File[]) => {
        if (comicId && !isLocalFile) {
            await uploadPages(files, comicId);
            queryClient.invalidateQueries({ queryKey: ['filesystem', comicId] });
        }
    };

    const handleDeletePages = async (pageIds: string[]) => {
        if (confirm(`Excluir ${pageIds.length} páginas?`)) {
            await deletePages(pageIds);
            queryClient.invalidateQueries({ queryKey: ['filesystem', comicId] });
        }
    };

    const handleReorderPages = (_pageIds: string[]) => {
        // TODO: Implement Reorder API
    };

    // === LOADING STATES ===

    // Extracting PDF
    if (isExtracting) {
        return (
            <div className="fixed inset-0 z-[200] bg-[#0c0c0e] flex flex-col items-center justify-center text-white gap-4">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <h1 className="text-2xl font-bold">{localComic?.name || 'PDF'}</h1>
                <p className="text-text-muted">Extraindo páginas do PDF...</p>
                <p className="text-sm text-amber-400">Isso pode levar alguns segundos</p>
            </div>
        );
    }

    // Extraction error
    if (extractionError) {
        return (
            <div className="fixed inset-0 z-[200] bg-[#0c0c0e] flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-2xl font-bold text-red-400">Erro na extração</h1>
                <p className="text-text-muted text-center max-w-md">{extractionError}</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                >
                    ← Voltar ao Dashboard
                </button>
            </div>
        );
    }

    // Cloud loading
    if (!isLocalFile && (isLoadingComic || isLoadingPages)) {
        return <div className="fixed inset-0 bg-[#0c0c0e] flex items-center justify-center text-white">Carregando dados do quadrinho...</div>;
    }

    if (!comic) {
        return <div className="text-white p-10">Comic não encontrada. <button onClick={() => navigate('/')}>Voltar</button></div>;
    }

    if (!comicId) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-[#0c0c0e]">
            <EditorLayout>
                <ComicWorkstation
                    comic={{
                        id: comic.id,
                        name: comic.name
                    }}
                    pages={pages}
                    onClose={() => navigate('/')}
                    onSelectPage={(pageId) => {
                        // Encode for URL if local
                        const encodedId = isLocalFile ? encodeURIComponent(pageId) : pageId;
                        navigate(`/editor/${encodedId}`);
                    }}
                    onAddPages={handleAddPages}
                    onDeletePages={handleDeletePages}
                    onReorderPages={handleReorderPages}
                />
            </EditorLayout>
        </div>
    );
};
