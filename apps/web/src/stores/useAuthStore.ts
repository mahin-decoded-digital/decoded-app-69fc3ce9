import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  register: (email: string, password: string, name: string, role: User['role']) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      register: (email, password, name, role) => {
        const existing = get().users.find((u) => u.email === email);
        if (existing) return { ok: false, error: 'Email already registered' };
        const newUser: User = {
          id: generateId(),
          email,
          password,
          name,
          role,
          createdAt: new Date(),
        };
        set((s) => ({ users: [...s.users, newUser], currentUser: newUser }));
        return { ok: true };
      },
      login: (email, password) => {
        const user = get().users.find((u) => u.email === email && u.password === password);
        if (!user) return { ok: false, error: 'Invalid credentials' };
        set({ currentUser: user });
        return { ok: true };
      },
      logout: () => set({ currentUser: null }),
    }),
    { name: 'martelli-auth' }
  )
);
