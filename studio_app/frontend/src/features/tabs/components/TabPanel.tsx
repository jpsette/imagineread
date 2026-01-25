import React from 'react';
import { X, FileText, LayoutDashboard, Plus } from 'lucide-react';
import { useTabStore, Tab } from '../stores/useTabStore';
import { useNavigate } from 'react-router-dom';

export const TabPanel: React.FC = () => {
    const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
    const navigate = useNavigate();

    const handleTabClick = (tab: Tab) => {
        if (tab.id === activeTabId) return;
        setActiveTab(tab.id, navigate);
    };

    const handleClose = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        // TODO: Add Dirty Check Alert here
        closeTab(id);
        const { activeTabId } = useTabStore.getState();
        if (activeTabId && activeTabId !== id) {
            const t = useTabStore.getState().getTab(activeTabId);
            if (t) navigate(t.path);
        } else {
            navigate('/');
        }
    };

    // Safety check for empty state (should at least have Dashboard)
    // if (tabs.length === 0) return null; 

    return (
        <div className="h-10 bg-[#0c0c0e] flex items-end px-2 gap-1 border-b border-white/5 select-none w-full overflow-x-auto no-scrollbar">
            {/* Dashboard "Pinned" Tab (Optional, or treat as normal tab) */}

            {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        onClick={() => handleTabClick(tab)}
                        className={`
                            group relative flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] h-9 
                            rounded-t-lg text-xs font-medium cursor-pointer transition-colors
                            ${isActive
                                ? 'bg-[#1e1e1e] text-white border-t border-x border-white/10'
                                : 'bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }
                        `}
                    >
                        {/* Icon based on Type */}
                        {tab.type === 'dashboard' ? <LayoutDashboard size={12} /> : <FileText size={12} />}

                        {/* Title Truncated */}
                        <span className="truncate flex-1">{tab.title}</span>

                        {/* Dirty Indicator */}
                        {tab.isDirty && (
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        )}

                        {/* Close Button */}
                        <div
                            onClick={(e) => handleClose(e, tab.id)}
                            className={`
                                p-0.5 rounded-md hover:bg-white/10 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity
                                ${isActive ? 'opacity-100' : ''}
                            `}
                        >
                            <X size={12} />
                        </div>
                    </div>
                );
            })}

            {/* New Tab Button (Takes to Dashboard) */}
            <button
                onClick={() => navigate('/')}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-md mb-1"
            >
                <Plus size={14} />
            </button>
        </div>
    );
};
