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
    deduplicateTabs: () => void;

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
                set((state) => {
                    const existing = state.tabs.find(t => t.id === newTab.id);
                    if (existing) {
                        return { activeTabId: existing.id };
                    }

                    const tab: Tab = {
                        ...newTab,
                        isDirty: false,
                        lastAccessed: Date.now()
                    };

                    return {
                        tabs: [...state.tabs, tab],
                        activeTabId: tab.id
                    };
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

            deduplicateTabs: () => {
                set((state) => {
                    const uniqueTabs: Tab[] = [];
                    const seenIds = new Set<string>();
                    const seenPaths = new Set<string>();
                    let hasDuplicates = false;

                    for (const tab of state.tabs) {
                        const isUniqueId = !seenIds.has(tab.id);
                        const isUniquePath = !seenPaths.has(tab.path);

                        // Strict Deduplication: Must be unique ID AND unique Path
                        if (isUniqueId && isUniquePath) {
                            seenIds.add(tab.id);
                            seenPaths.add(tab.path);
                            uniqueTabs.push(tab);
                        } else {
                            hasDuplicates = true;
                        }
                    }

                    if (!hasDuplicates) return {}; // No change

                    console.log('[TabStore] Path-Based Deduplication GC ran. Removed duplicates.');
                    return { tabs: uniqueTabs };
                });
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
            }),
            merge: (persistedState: any, currentState) => {
                // SANITIZATION: Deduplicate tabs on hydration
                const uniqueTabs: Tab[] = [];
                const seenIds = new Set<string>();

                if (persistedState && Array.isArray(persistedState.tabs)) {
                    const seenPaths = new Set<string>();
                    for (const tab of persistedState.tabs) {
                        const isUniqueId = !seenIds.has(tab.id);
                        const isUniquePath = !seenPaths.has(tab.path);

                        if (isUniqueId && isUniquePath) {
                            seenIds.add(tab.id);
                            seenPaths.add(tab.path);
                            uniqueTabs.push(tab);
                        }
                    }
                }

                return {
                    ...currentState,
                    ...persistedState,
                    tabs: uniqueTabs
                };
            },
            version: 2, // Increment version to 2 to purge 'comic' folder tabs from storage
            migrate: (persistedState: any, version: number) => {
                console.log(`[TabStore] Migrating from version ${version} to 2`);

                // Version 0 or undefined: Wipe everything (Old corruption)
                if (version === undefined || version < 1) {
                    return { tabs: [], activeTabId: null };
                }

                // Version 1 -> 2: Remove 'comic' tabs, keep only 'page'
                if (version < 2) {
                    const tabs = (persistedState.tabs || []).filter((t: Tab) => t.type === 'page');
                    // Ensure active tab is still valid
                    const activeTabId = tabs.find((t: Tab) => t.id === persistedState.activeTabId)
                        ? persistedState.activeTabId
                        : (tabs.length > 0 ? tabs[tabs.length - 1].id : null);

                    return { ...persistedState, tabs, activeTabId };
                }

                return persistedState as TabState;
            }
        }
    )
);
