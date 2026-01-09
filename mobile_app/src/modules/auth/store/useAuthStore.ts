import { create } from 'zustand';
import { TokenStorage } from '../../../core/auth/TokenStorage';
import { router } from 'expo-router';

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start loading to check session on mount

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            // Simulate API Call
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (email.includes('@')) {
                const mockToken = 'mock-jwt-token-123456';
                const mockUser: User = {
                    id: 'u1',
                    email: email,
                    name: 'Demo User',
                    avatarUrl: 'https://i.pravatar.cc/150?u=u1'
                };

                await TokenStorage.saveToken(mockToken);
                set({ user: mockUser, isAuthenticated: true });
                return; // Success
            } else {
                throw new Error('Invalid email format');
            }
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        await TokenStorage.deleteToken();
        set({ user: null, isAuthenticated: false });
        router.replace('/auth/login');
    },

    checkSession: async () => {
        set({ isLoading: true });
        try {
            const token = await TokenStorage.getToken();
            if (token) {
                // In real app, validate token with API /me endpoint
                // For mock, just restore session
                const mockUser: User = {
                    id: 'u1',
                    email: 'demo@imagineread.com',
                    name: 'Demo User',
                    avatarUrl: 'https://i.pravatar.cc/150?u=u1'
                };
                set({ user: mockUser, isAuthenticated: true });
            }
        } catch (e) {
            console.error('Session check failed', e);
        } finally {
            set({ isLoading: false });
        }
    }
}));
