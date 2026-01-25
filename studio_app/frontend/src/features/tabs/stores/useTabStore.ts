import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Tab {
    id: string; // File/Entity ID
    type: 'comic' | 'page' | 'dashboard';
    title: string;
    path: string; // Route path
    isDirty: boolean;
    hibernatedState?: any; // Serialized state of the editor (balloons, panels, etc.)
    lastAccessed: number;
}

interface TabState {
    tabs: Tab[];
    activeTabId: string | null;

    // Actions
    openTab: (tab: Omit<Tab, 'lastAccessed' | 'isDirty'>) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string, navigateFn?: (path: string) => void) => void;

    // State Persistence
    hibernateTab: (id: string, state: any) => void;
    markTabDirty: (id: string, isDirty: boolean) => void;
    updateTabTitle: (id: string, title: string) => void;

    // Helpers
    getTab: (id: string) => Tab | undefined;
}

export const useTabStore = create<TabState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,

            openTab: (newTab) => {
                const { tabs } = get();
                const existing = tabs.find(t => t.id === newTab.id);

                if (existing) {
                    set({ activeTabId: existing.id });
                    return;
                }

                const tab: Tab = {
                    ...newTab,
                    isDirty: false,
                    lastAccessed: Date.now()
                };

                set({
                    tabs: [...tabs, tab],
                    activeTabId: tab.id
                });
            },

            closeTab: (id) => {
                const { tabs, activeTabId } = get();
                const newTabs = tabs.filter(t => t.id !== id);

                // If closing active tab, switch to the last one or null
                let newActiveId = activeTabId;
                if (activeTabId === id) {
                    newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
                }

                set({ tabs: newTabs, activeTabId: newActiveId });
            },

            setActiveTab: (id, navigateFn) => {
                const { tabs } = get();
                const tab = tabs.find(t => t.id === id);

                if (tab) {
                    set({ activeTabId: id });
                    // Optional: Update lastAccessed
                    if (navigateFn) navigateFn(tab.path);
                }
            },

            hibernateTab: (id, state) => {
                set(prev => ({
                    tabs: prev.tabs.map(t => t.id === id ? { ...t, hibernatedState: state } : t)
                }));
            },

            markTabDirty: (id, isDirty) => {
                set(prev => ({
                    tabs: prev.tabs.map(t => t.id === id ? { ...t, isDirty } : t)
                }));
            },

            updateTabTitle: (id, title) => {
                set(prev => ({
                    tabs: prev.tabs.map(t => t.id === id ? { ...t, title } : t)
                }));
            },

            getTab: (id) => get().tabs.find(t => t.id === id)
        }),
        {
            name: 'imagine-read-tabs',
            storage: createJSONStorage(() => localStorage), // Persist open tabs across reloads
            partialize: (state) => ({
                tabs: state.tabs.map(t => ({ ...t, hibernatedState: undefined })), // Don't persist HEAVY state to localStorage, only list
                activeTabId: state.activeTabId
            })
        }
    )
);
