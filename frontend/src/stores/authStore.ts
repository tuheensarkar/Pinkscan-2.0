import { create } from 'zustand';

interface User {
    id: number;
    email: string;
    role: string;
    full_name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    // Always start with null (SSR-safe), hydrate on client via checkAuth
    token: null,
    isAuthenticated: false,

    login: (token: string, user: User) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token');
        if (!token) {
            set({ user: null, token: null, isAuthenticated: false });
            return;
        }
        try {
            const payloadBase64 = token.split('.')[1];
            const decoded = JSON.parse(atob(payloadBase64));
            // Check token expiry
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false });
                return;
            }
            set({
                token,
                user: {
                    id: decoded.id,
                    email: decoded.sub,
                    role: decoded.role || 'patient',
                    full_name: decoded.full_name || decoded.sub,
                },
                isAuthenticated: true,
            });
        } catch {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));
