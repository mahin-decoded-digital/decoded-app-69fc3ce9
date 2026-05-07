import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner';
import type { ComplianceChecklist } from '@/types';

interface ComplianceState {
  checklists: ComplianceChecklist[];
  templates: ComplianceChecklist[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchCompliancechecklists: () => Promise<void>;
  addChecklist: (input: Omit<ComplianceChecklist, 'id' | 'createdAt'>) => Promise<void>;
  toggleItem: (checklistId: string, index: number, completedBy: string) => Promise<void>;
  addItem: (checklistId: string, label: string) => Promise<void>;
}

export const useComplianceStore = create<ComplianceState>()(
  (set, get) => ({
    checklists: [],
    templates: [],
    loading: false,
    loaded: false,
    error: null,

    fetchCompliancechecklists: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/compliancechecklists'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const checklists = await res.json();
        set({ checklists, loading: false, loaded: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load';
        set({ loading: false, error: message });
        toast.error(message);
      }
    },

    addChecklist: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/compliancechecklists'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newChecklist: ComplianceChecklist = await res.json();
        set((s) => ({ checklists: [...s.checklists, newChecklist] }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create checklist';
        set({ error: message });
        toast.error(message);
      }
    },

    toggleItem: async (checklistId, index, completedBy) => {
      const previous = get().checklists;
      const updated = previous.map((cl) => {
        if (cl.id !== checklistId) return cl;
        const items = cl.items.map((item, i) => {
          if (i !== index) return item;
          const nowCompleted = !item.completed;
          return {
            ...item,
            completed: nowCompleted,
            completedAt: nowCompleted ? new Date() : null,
            completedBy: nowCompleted ? completedBy : '',
          };
        });
        return { ...cl, items };
      });
      set({ checklists: updated });
      try {
        const checklist = updated.find((cl) => cl.id === checklistId);
        const res = await fetch(apiUrl(`/api/compliancechecklists/${checklistId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checklist),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const serverChecklist: ComplianceChecklist = await res.json();
        set((s) => ({
          checklists: s.checklists.map((cl) => (cl.id === checklistId ? serverChecklist : cl)),
        }));
      } catch (err) {
        set({ checklists: previous, error: err instanceof Error ? err.message : 'Failed to toggle item' });
        toast.error('Could not update checklist item — restoring previous state');
      }
    },

    addItem: async (checklistId, label) => {
      const previous = get().checklists;
      const updated = previous.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: [
                ...cl.items,
                { label, completed: false, completedAt: null, completedBy: '' },
              ],
            }
          : cl
      );
      set({ checklists: updated });
      try {
        const checklist = updated.find((cl) => cl.id === checklistId);
        const res = await fetch(apiUrl(`/api/compliancechecklists/${checklistId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checklist),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const serverChecklist: ComplianceChecklist = await res.json();
        set((s) => ({
          checklists: s.checklists.map((cl) => (cl.id === checklistId ? serverChecklist : cl)),
        }));
      } catch (err) {
        set({ checklists: previous, error: err instanceof Error ? err.message : 'Failed to add item' });
        toast.error('Could not add checklist item — restoring previous state');
      }
    },
  })
);
