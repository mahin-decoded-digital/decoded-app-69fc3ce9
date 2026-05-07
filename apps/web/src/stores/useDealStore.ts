import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner';
import type { Deal } from '@/types';

interface DealState {
  deals: Deal[];
  activeDealId: string | null;
  searchQuery: string;
  statusFilter: string;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchDeals: () => Promise<void>;
  addDeal: (input: Omit<Deal, 'id' | 'createdAt'>) => Promise<void>;
  updateDeal: (id: string, patch: Partial<Omit<Deal, 'id' | 'createdAt'>>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  setActiveDeal: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (status: string) => void;
}

export const useDealStore = create<DealState>()(
  (set, get) => ({
    deals: [],
    activeDealId: null,
    searchQuery: '',
    statusFilter: '',
    loading: false,
    error: null,
    loaded: false,

    fetchDeals: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/deals'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const deals = await res.json();
        set({ deals, loading: false, loaded: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load deals';
        set({ loading: false, error: message });
        toast.error(message);
      }
    },

    addDeal: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/deals'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newDeal: Deal = await res.json();
        set((s) => ({ deals: [newDeal, ...s.deals] }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create deal';
        set({ error: message });
        toast.error(message);
      }
    },

    updateDeal: async (id, patch) => {
      const previous = get().deals;
      set((s) => ({
        deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/deals/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updatedDeal: Deal = await res.json();
        set((s) => ({
          deals: s.deals.map((d) => (d.id === id ? updatedDeal : d)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update deal';
        set({ deals: previous, error: message });
        toast.error(message);
      }
    },

    deleteDeal: async (id) => {
      const previous = get().deals;
      set((s) => ({ deals: s.deals.filter((d) => d.id !== id) }));
      try {
        const res = await fetch(apiUrl(`/api/deals/${id}`), {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete deal';
        set({ deals: previous, error: message });
        toast.error('Could not delete the deal — restoring it');
      }
    },

    setActiveDeal: (id) => set({ activeDealId: id }),
    setSearchQuery: (q) => set({ searchQuery: q }),
    setStatusFilter: (status) => set({ statusFilter: status }),
  })
);