import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Role checks
  isAdmin: () => boolean;
  isModerator: () => boolean;
  isAgent: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  hasMinimumRole: (role: UserRole) => boolean;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  moderator: 2,
  agent: 1,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      isAdmin: () => get().user?.role === 'admin',
      isModerator: () => get().user?.role === 'moderator',
      isAgent: () => get().user?.role === 'agent',

      hasRole: (roles) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },

      hasMinimumRole: (role) => {
        const user = get().user;
        if (!user) return false;
        return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role];
      },
    }),
    {
      name: 'crm-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
