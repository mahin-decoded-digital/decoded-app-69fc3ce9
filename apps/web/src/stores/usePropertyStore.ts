import { create } from 'zustand';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import type { OffMarketProperty, DealProperty } from '@/types';

interface PropertyState {
  properties: OffMarketProperty[];
  dealProperties: DealProperty[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  searchQuery: string;
  suburbFilter: string;
  statusFilter: string;
  fetchOffmarketproperties: () => Promise<void>;
  addProperty: (input: Omit<OffMarketProperty, 'id' | 'createdAt'>) => Promise<string>;
  updateProperty: (id: string, patch: Partial<Omit<OffMarketProperty, 'id' | 'createdAt'>>) => Promise<void>;
  addPriceHistory: (propertyId: string, entry: { date: string; price: number; note: string }) => Promise<void>;
  addDealProperty: (input: Omit<DealProperty, 'id' | 'createdAt'>) => Promise<void>;
  updateDealProperty: (id: string, patch: Partial<Omit<DealProperty, 'id' | 'createdAt'>>) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setSuburbFilter: (suburb: string) => void;
  setStatusFilter: (status: string) => void;
}

export const usePropertyStore = create<PropertyState>()(
  (set, get) => ({
    properties: [],
    dealProperties: [],
    loading: false,
    error: null,
    loaded: false,
    searchQuery: '',
    suburbFilter: '',
    statusFilter: '',

    fetchOffmarketproperties: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/offmarketproperties'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        set({ properties: items, loading: false, loaded: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load properties';
        set({ loading: false, error: message });
        toast.error(message);
      }
    },

    addProperty: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/offmarketproperties'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newProp: OffMarketProperty = await res.json();
        set((s) => ({ properties: [...s.properties, newProp] }));
        return newProp.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add property';
        set({ error: message });
        toast.error(message);
        return '';
      }
    },

    updateProperty: async (id, patch) => {
      const previous = get().properties;
      set((s) => ({
        properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/offmarketproperties/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: OffMarketProperty = await res.json();
        set((s) => ({
          properties: s.properties.map((p) => (p.id === id ? updated : p)),
        }));
      } catch (err) {
        set({ properties: previous });
        const message = err instanceof Error ? err.message : 'Failed to update property';
        set({ error: message });
        toast.error(message);
      }
    },

    addPriceHistory: async (propertyId, entry) => {
      const previous = get().properties;
      const property = previous.find((p) => p.id === propertyId);
      if (!property) return;
      const updatedPriceHistory = [...property.priceHistory, entry];
      set((s) => ({
        properties: s.properties.map((p) =>
          p.id === propertyId ? { ...p, priceHistory: updatedPriceHistory } : p
        ),
      }));
      try {
        const res = await fetch(apiUrl(`/api/offmarketproperties/${propertyId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceHistory: updatedPriceHistory }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: OffMarketProperty = await res.json();
        set((s) => ({
          properties: s.properties.map((p) => (p.id === propertyId ? updated : p)),
        }));
      } catch (err) {
        set({ properties: previous });
        const message = err instanceof Error ? err.message : 'Failed to add price history';
        set({ error: message });
        toast.error(message);
      }
    },

    addDealProperty: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/dealproperties'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newDp: DealProperty = await res.json();
        set((s) => ({ dealProperties: [...s.dealProperties, newDp] }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add deal property';
        set({ error: message });
        toast.error(message);
      }
    },

    updateDealProperty: async (id, patch) => {
      const previous = get().dealProperties;
      set((s) => ({
        dealProperties: s.dealProperties.map((dp) => (dp.id === id ? { ...dp, ...patch } : dp)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/dealproperties/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: DealProperty = await res.json();
        set((s) => ({
          dealProperties: s.dealProperties.map((dp) => (dp.id === id ? updated : dp)),
        }));
      } catch (err) {
        set({ dealProperties: previous });
        const message = err instanceof Error ? err.message : 'Failed to update deal property';
        set({ error: message });
        toast.error(message);
      }
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
    setSuburbFilter: (suburb) => set({ suburbFilter: suburb }),
    setStatusFilter: (status) => set({ statusFilter: status }),
  })
);
