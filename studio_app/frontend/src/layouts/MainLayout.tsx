import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
    sidebar?: React.ReactNode;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onGoHome: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    sidebar,
    isSidebarOpen,
    onToggleSidebar,
    onGoHome
}) => {
    return (
        <div className="w-screen h-screen bg-[#09090b] text-zinc-100 overflow-hidden flex flex-col">
            {/* === HEADER === */}
            <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-[#09090b] z-50 shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-4 text-xs font-medium text-zinc-400">Imagine Read Studio</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onToggleSidebar}
                        className="text-xs px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition"
                    >
                        Sidebar
                    </button>
                    <button
                        onClick={onGoHome}
                        className="text-xs px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition"
                    >
                        Home
                    </button>
                </div>
            </div>

            {/* === MAIN CONTENT === */}
            <main className="flex-1 flex overflow-hidden p-2 gap-2 relative bg-[#0c0c0e]">
                {/* SIDEBAR */}
                {isSidebarOpen && sidebar && (
                    <div className="w-[320px] h-full flex flex-col shrink-0">
                        {sidebar}
                    </div>
                )}

                {/* MAIN AREA */}
                <div className="flex-1 h-full relative flex flex-col min-w-0">
                    {children}
                </div>
            </main>
        </div>
    );
};
