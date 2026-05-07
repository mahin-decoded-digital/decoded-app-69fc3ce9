import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import { toast } from 'sonner';
import type { Agent, RequirementBlast } from '@/types';

interface AgentState {
  agents: Agent[];
  blasts: RequirementBlast[];
  searchQuery: string;
  geoFilter: string;
  preferredOnly: boolean;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchAgents: () => Promise<void>;
  addAgent: (input: Omit<Agent, 'id' | 'createdAt'>) => Promise<void>;
  updateAgent: (id: string, patch: Partial<Omit<Agent, 'id' | 'createdAt'>>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  addBlast: (input: Omit<RequirementBlast, 'id' | 'createdAt'>) => Promise<void>;
  sendBlast: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setGeoFilter: (geo: string) => void;
  setPreferredOnly: (val: boolean) => void;
}

export const useAgentStore = create<AgentState>()(
  (set, get) => ({
    agents: [],
    blasts: [],
    searchQuery: '',
    geoFilter: '',
    preferredOnly: false,
    loading: false,
    error: null,
    loaded: false,

    fetchAgents: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/agents'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const agents = await res.json();
        set({ agents, loading: false, loaded: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load agents';
        set({ loading: false, error: message });
        toast.error(message);
      }
    },

    addAgent: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/agents'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newAgent: Agent = await res.json();
        set((s) => ({ agents: [...s.agents, newAgent] }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add agent';
        set({ error: message });
        toast.error(message);
      }
    },

    updateAgent: async (id, patch) => {
      const previous = get().agents;
      set((s) => ({
        agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/agents/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updatedAgent: Agent = await res.json();
        set((s) => ({
          agents: s.agents.map((a) => (a.id === id ? updatedAgent : a)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update agent';
        set({ agents: previous, error: message });
        toast.error(message);
      }
    },

    deleteAgent: async (id) => {
      const previous = get().agents;
      set((s) => ({ agents: s.agents.filter((a) => a.id !== id) }));
      try {
        const res = await fetch(apiUrl(`/api/agents/${id}`), { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not delete the agent — restoring it';
        set({ agents: previous, error: message });
        toast.error(message);
      }
    },

    addBlast: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/requirementblasts'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newBlast: RequirementBlast = await res.json();
        set((s) => ({ blasts: [...s.blasts, newBlast] }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add blast';
        set({ error: message });
        toast.error(message);
      }
    },

    sendBlast: async (id) => {
      const previous = get().blasts;
      set((s) => ({
        blasts: s.blasts.map((b) =>
          b.id === id ? { ...b, status: 'sent', sentAt: new Date() } : b
        ),
      }));
      try {
        const res = await fetch(apiUrl(`/api/requirementblasts/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'sent', sentAt: new Date() }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updatedBlast: RequirementBlast = await res.json();
        set((s) => ({
          blasts: s.blasts.map((b) => (b.id === id ? updatedBlast : b)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send blast';
        set({ blasts: previous, error: message });
        toast.error(message);
      }
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
    setGeoFilter: (geo) => set({ geoFilter: geo }),
    setPreferredOnly: (val) => set({ preferredOnly: val }),
  })
);
