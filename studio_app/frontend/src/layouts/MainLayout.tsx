import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';

interface MainLayoutProps {
    children: React.ReactNode;
    // Navigation/State
    isInEditor: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    isInEditor
}) => {
    // Connect to Store
    const {
        showExplorer,
        setShowExplorer,
        showManager,
        setShowManager,
        setIsCreatingProject,
        setView
    } = useUIStore();

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

    const toggleMenu = (menu: string) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
        <div className="w-screen h-screen bg-[#09090b] text-zinc-100 overflow-hidden flex flex-col font-sans">
            {/* === HEADER / MENUBAR === */}
            <div className="h-9 border-b border-white/10 flex items-center justify-between px-3 bg-[#09090b] z-[100] shrink-0 select-none shadow-sm" ref={menuRef}>
                <div className="flex items-center gap-6">
                    {/* APP TITLE */}
                    <div className="flex items-center gap-2 mr-2">
                        <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-[13px] font-semibold text-zinc-300 tracking-wide ml-2">
                            Imagine Read Studio
                        </span>
                    </div>

                    {/* MENU: PROJECTS */}
                    <div className="relative">
                        <button
                            onClick={() => toggleMenu('projects')}
                            className={`text-[13px] px-2 py-0.5 rounded transition-colors ${openMenu === 'projects' ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}
                        >
                            Projetos
                        </button>
                        {openMenu === 'projects' && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-[#18181b] border border-white/10 rounded-md shadow-xl py-1 z-50 overflow-hidden ring-1 ring-black/50">
                                <button
                                    onClick={() => {
                                        // Refactored creating project action
                                        setShowManager(true);
                                        setIsCreatingProject(true);
                                        setView('dashboard');
                                        setOpenMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-[13px] text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
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
                            className={`text-[13px] px-2 py-0.5 rounded transition-colors ${openMenu === 'workspace' ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}
                        >
                            Espaço de Trabalho
                        </button>
                        {openMenu === 'workspace' && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-[#18181b] border border-white/10 rounded-md shadow-xl py-1 z-50 ring-1 ring-black/50">
                                <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Janelas</div>
                                <label className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 cursor-pointer block group">
                                    <input
                                        type="checkbox"
                                        checked={showExplorer}
                                        onChange={() => {
                                            setShowExplorer(!showExplorer);
                                        }}
                                        className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                    />
                                    <span className="text-[13px] text-zinc-300 group-hover:text-white">Explorador de Arquivos</span>
                                </label>
                                <label className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 cursor-pointer block group">
                                    <input
                                        type="checkbox"
                                        checked={showManager}
                                        onChange={() => {
                                            setShowManager(!showManager);
                                        }}
                                        className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                                    />
                                    <span className="text-[13px] text-zinc-300 group-hover:text-white">Gerenciador de Projetos</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* EDITOR INDICATOR */}
                    <div className={`text-[13px] px-2 py-0.5 rounded transition-colors flex items-center gap-2 ${isInEditor ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-600 decoration-zinc-800'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isInEditor ? 'bg-blue-400 animate-pulse' : 'bg-zinc-700'}`} />
                        Workstation Editor
                    </div>
                </div>

                {/* RIGHT SIDE STATS OR INFO */}
                <div className="text-[10px] text-zinc-600 font-mono">
                    Imagine Read v1.0.0
                </div>
            </div>

            {/* === MAIN CANVAS (Floating Window Area) === */}
            <main className="flex-1 relative bg-[#0c0c0e] overflow-hidden bg-grid-pattern">
                {/* Optional Grid Pattern Background CSS would go here or in global css */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>

                {children}
            </main>
        </div>
    );
};
