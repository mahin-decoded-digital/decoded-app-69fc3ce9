import { create } from 'zustand';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import type { DueDiligenceRecord } from '@/types';

interface DDState {
  records: DueDiligenceRecord[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchDuediligencerecords: () => Promise<void>;
  addRecord: (input: Omit<DueDiligenceRecord, 'id' | 'createdAt'>) => Promise<string>;
  updateRecord: (id: string, patch: Partial<Omit<DueDiligenceRecord, 'id' | 'createdAt'>>) => Promise<void>;
  addComparableSale: (recordId: string, sale: { address: string; salePrice: number; saleDate: string; bedrooms: number; bathrooms: number; notes: string }) => Promise<void>;
  toggleChecklistItem: (recordId: string, index: number) => Promise<void>;
  markReportGenerated: (recordId: string) => Promise<void>;
}

export const useDDStore = create<DDState>()(
  (set, get) => ({
    records: [],
    loading: false,
    error: null,
    loaded: false,

    fetchDuediligencerecords: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/duediligencerecords'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const records = await res.json();
        set({ records, loading: false, loaded: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load';
        set({ loading: false, error: message });
        toast.error(message);
      }
    },

    addRecord: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/duediligencerecords'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newRecord: DueDiligenceRecord = await res.json();
        set((s) => ({ records: [...s.records, newRecord] }));
        return newRecord.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create record';
        set({ error: message });
        toast.error(message);
        return '';
      }
    },

    updateRecord: async (id, patch) => {
      const previous = get().records;
      set((s) => ({
        records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/duediligencerecords/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: DueDiligenceRecord = await res.json();
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? updated : r)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update record';
        set({ records: previous, error: message });
        toast.error(message);
      }
    },

    addComparableSale: async (recordId, sale) => {
      const previous = get().records;
      const record = previous.find((r) => r.id === recordId);
      if (!record) return;
      const updatedComparableSales = [...record.comparableSales, sale];
      set((s) => ({
        records: s.records.map((r) =>
          r.id === recordId
            ? { ...r, comparableSales: updatedComparableSales }
            : r
        ),
      }));
      try {
        const res = await fetch(apiUrl(`/api/duediligencerecords/${recordId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comparableSales: updatedComparableSales }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: DueDiligenceRecord = await res.json();
        set((s) => ({
          records: s.records.map((r) => (r.id === recordId ? updated : r)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add comparable sale';
        set({ records: previous, error: message });
        toast.error(message);
      }
    },

    toggleChecklistItem: async (recordId, index) => {
      const previous = get().records;
      const record = previous.find((r) => r.id === recordId);
      if (!record) return;
      const updatedItems = record.checklistItems.map((item, i) => {
        if (i !== index) return item;
        const nowCompleted = !item.completed;
        return {
          ...item,
          completed: nowCompleted,
          completedAt: nowCompleted ? new Date() : null,
        };
      });
      set((s) => ({
        records: s.records.map((r) =>
          r.id === recordId ? { ...r, checklistItems: updatedItems } : r
        ),
      }));
      try {
        const res = await fetch(apiUrl(`/api/duediligencerecords/${recordId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklistItems: updatedItems }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: DueDiligenceRecord = await res.json();
        set((s) => ({
          records: s.records.map((r) => (r.id === recordId ? updated : r)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle checklist item';
        set({ records: previous, error: message });
        toast.error(message);
      }
    },

    markReportGenerated: async (recordId) => {
      const previous = get().records;
      const reportGeneratedAt = new Date();
      set((s) => ({
        records: s.records.map((r) =>
          r.id === recordId ? { ...r, reportGeneratedAt } : r
        ),
      }));
      try {
        const res = await fetch(apiUrl(`/api/duediligencerecords/${recordId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportGeneratedAt }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: DueDiligenceRecord = await res.json();
        set((s) => ({
          records: s.records.map((r) => (r.id === recordId ? updated : r)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark report generated';
        set({ records: previous, error: message });
        toast.error(message);
      }
    },
  })
);
