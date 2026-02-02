import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@app/store/useUIStore';
import { useEditorUIStore } from '@features/editor/uiStore'; // Import specific editor store
import { Eye, EyeOff } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
    // Navigation/State
    isInEditor: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    isInEditor
}) => {
    // Connect to UI Store (Global)
    const {
        showExplorer,
        setShowExplorer,
        showManager,
        setShowManager,
        setShowDictionary,
        setIsCreatingProject,
        setView
    } = useUIStore();

    // Connect to Editor Store for Focus Mode
    // Default to false if not in editor context to behave safely
    const { isFocusMode, setIsFocusMode } = useEditorUIStore();

    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Add Keybind for Focus Mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && isInEditor) {
                e.preventDefault(); // Prevent focus trapping or other default tab behavior
                setIsFocusMode(!isFocusMode);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocusMode, isInEditor, setIsFocusMode]);


    const toggleMenu = (menu: string) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    // Refactored for UI Polish - Functionality Preserved
    // CSS Toggle for Focus Mode: Opacity transition instead of unmount
    const focusModeClass = (isFocusMode && isInEditor)
        ? 'opacity-0 -translate-y-full pointer-events-none'
        : 'opacity-100 translate-y-0';

    return (
        <div className="w-screen h-screen bg-app-bg text-text-primary overflow-hidden flex flex-col font-sans selection:bg-accent-blue/30 selection:text-white">

            {/* === HEADER / MENUBAR === */}
            {/* Added style={{ WebkitAppRegion: 'drag' }} for native window dragging */}
            <div
                className={`h-9 border-b border-white/5 flex items-center justify-between px-3 bg-app-bg z-[100] shrink-0 select-none shadow-sm transition-all duration-300 ${focusModeClass}`}
                ref={menuRef}
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                {/* INTERACTIVE REGION: Must be no-drag to allow clicks */}
                <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    {/* APP TITLE */}
                    <div className="flex items-center gap-2 mr-2">
                        <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-[13px] font-semibold text-text-secondary tracking-wide ml-2 hover:text-text-primary transition-colors cursor-default">
                            Imagine Read Studio
                        </span>
                    </div>

                    {/* MENU: PROJECTS */}
                    <div className="relative">
                        <button
                            onClick={() => toggleMenu('projects')}
                            className={`text-[13px] px-2 py-0.5 rounded transition-colors font-medium ${openMenu === 'projects' ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                        >
                            Projetos
                        </button>
                        {openMenu === 'projects' && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border-color rounded-lg shadow-xl py-1 z-50 overflow-hidden ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    onClick={() => {
                                        // Refactored creating project action
                                        setShowManager(true);
                                        setIsCreatingProject(true);
                                        setView('dashboard');
                                        setOpenMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-[13px] text-text-primary hover:bg-accent-blue hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <span>+</span> Novo Projeto...
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MENU: WORKSPACE */}
                    <div className="relative">
                        <button
                            onClick={() => toggleMenu('workspace')}
                            className={`text-[13px] px-2 py-0.5 rounded transition-colors font-medium ${openMenu === 'workspace' ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                        >
                            Espaço de Trabalho
                        </button>
                        {openMenu === 'workspace' && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border-color rounded-lg shadow-xl py-1 z-50 ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Janelas</div>
                                <label className="flex items-center gap-2 px-4 py-1.5 hover:bg-surface-hover cursor-pointer block group">
                                    <input
                                        type="checkbox"
                                        checked={showExplorer}
                                        onChange={() => {
                                            setShowExplorer(!showExplorer);
                                        }}
                                        className="rounded border-zinc-600 bg-zinc-800 text-accent-blue focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                    />
                                    <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">Explorador de Arquivos</span>
                                </label>
                                <label className="flex items-center gap-2 px-4 py-1.5 hover:bg-surface-hover cursor-pointer block group">
                                    <input
                                        type="checkbox"
                                        checked={showManager}
                                        onChange={() => {
                                            setShowManager(!showManager);
                                        }}
                                        className="rounded border-zinc-600 bg-zinc-800 text-accent-blue focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                    />
                                    <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">Gerenciador de Projetos</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* MENU: GLOSSÁRIO */}
                    <button
                        onClick={() => {
                            setShowDictionary(true);
                        }}
                        className="text-[13px] px-2 py-0.5 rounded transition-colors font-medium text-text-secondary hover:text-text-primary hover:bg-white/5"
                    >
                        Glossário
                    </button>

                    {/* EDITOR INDICATOR */}
                    <div className={`text-[13px] px-2 py-0.5 rounded transition-colors flex items-center gap-2 font-medium ${isInEditor ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-muted'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isInEditor ? 'bg-accent-blue animate-pulse' : 'bg-zinc-700'}`} />
                        Workstation Editor
                    </div>
                </div>

                {/* RIGHT SIDE STATS OR INFO */}
                {/* Also Interactive area - allows Focus Mode Toggle via Click */}
                <div className="flex items-center gap-3 text-[10px] text-text-muted font-mono opacity-80" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    {isInEditor && (
                        <button
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
                            title="Toggle Focus Mode (Tab)"
                        >
                            {isFocusMode ? <EyeOff size={12} /> : <Eye size={12} />}
                            <span>Focus</span>
                        </button>
                    )}
                    <span className="opacity-50 pointer-events-none">Imagine Read v1.0.0</span>
                </div>
            </div>

            {/* === MAIN CANVAS (Floating Window Area) === */}
            <main className="flex-1 relative bg-app-bg overflow-hidden bg-grid-pattern">
                {/* Optional Grid Pattern Background CSS would go here or in global css */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}></div>

                {children}
            </main>
        </div>
    );
};
