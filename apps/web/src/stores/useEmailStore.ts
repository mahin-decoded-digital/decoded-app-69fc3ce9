import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner';
import type { EmailTemplate } from '@/types';

interface EmailState {
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchEmailtemplates: () => Promise<void>;
  addTemplate: (input: Omit<EmailTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateTemplate: (id: string, patch: Partial<Omit<EmailTemplate, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useEmailStore = create<EmailState>()((set, get) => ({
  templates: [],
  loading: false,
  error: null,
  loaded: false,

  fetchEmailtemplates: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch(apiUrl('/api/emailtemplates'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const templates = await res.json();
      set({ templates, loading: false, loaded: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load email templates';
      set({ loading: false, error: message });
      toast.error(message);
    }
  },

  addTemplate: async (input) => {
    try {
      const res = await fetch(apiUrl('/api/emailtemplates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newTemplate: EmailTemplate = await res.json();
      set((s) => ({ templates: [...s.templates, newTemplate] }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create email template';
      set({ error: message });
      toast.error(message);
    }
  },

  updateTemplate: async (id, patch) => {
    const previous = get().templates;
    set((s) => ({
      templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    try {
      const res = await fetch(apiUrl(`/api/emailtemplates/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: EmailTemplate = await res.json();
      set((s) => ({
        templates: s.templates.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update email template';
      set({ templates: previous, error: message });
      toast.error(message);
    }
  },

  deleteTemplate: async (id) => {
    const previous = get().templates;
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
    try {
      const res = await fetch(apiUrl(`/api/emailtemplates/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete the template — restoring it';
      set({ templates: previous, error: message });
      toast.error(message);
    }
  },
}));