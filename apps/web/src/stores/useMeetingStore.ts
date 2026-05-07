import { create } from 'zustand';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import type { MeetingNote } from '@/types';

interface MeetingState {
  notes: MeetingNote[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchMeetingnotes: () => Promise<void>;
  addNote: (input: Omit<MeetingNote, 'id' | 'createdAt'>) => Promise<void>;
  updateNote: (id: string, patch: Partial<Omit<MeetingNote, 'id' | 'createdAt'>>) => Promise<void>;
  generateSummary: (id: string) => Promise<void>;
  toggleActionItem: (noteId: string, index: number) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useMeetingStore = create<MeetingState>()(
  (set, get) => ({
    notes: [],
    loading: false,
    error: null,
    loaded: false,

    fetchMeetingnotes: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/meetingnotes'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const notes = await res.json();
        set({ notes, loading: false, loaded: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load meeting notes';
        set({ loading: false, error: message });
        toast.error(message);
      }
    },

    addNote: async (input) => {
      try {
        const res = await fetch(apiUrl('/api/meetingnotes'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newNote: MeetingNote = await res.json();
        set((s) => ({ notes: [...s.notes, newNote] }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create meeting note';
        set({ error: message });
        toast.error(message);
      }
    },

    updateNote: async (id, patch) => {
      const previous = get().notes;
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/meetingnotes/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: MeetingNote = await res.json();
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? updated : n)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update meeting note';
        set({ notes: previous, error: message });
        toast.error(message);
      }
    },

    generateSummary: async (id) => {
      const note = get().notes.find((n) => n.id === id);
      if (!note || !note.rawTranscript) return;
      const excerpt = note.rawTranscript.slice(0, 300);
      const aiSummary = `Summary: ${excerpt}`;
      const defaultItem = { task: 'Follow up on meeting', assignee: 'Agent', dueDate: '', completed: false };
      const patch = {
        aiSummary,
        actionItems: [...note.actionItems, defaultItem],
      };
      const previous = get().notes;
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/meetingnotes/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: MeetingNote = await res.json();
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? updated : n)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate summary';
        set({ notes: previous, error: message });
        toast.error(message);
      }
    },

    toggleActionItem: async (noteId, index) => {
      const previous = get().notes;
      const note = previous.find((n) => n.id === noteId);
      if (!note) return;
      const actionItems = note.actionItems.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item
      );
      set((s) => ({
        notes: s.notes.map((n) => (n.id === noteId ? { ...n, actionItems } : n)),
      }));
      try {
        const res = await fetch(apiUrl(`/api/meetingnotes/${noteId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionItems }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: MeetingNote = await res.json();
        set((s) => ({
          notes: s.notes.map((n) => (n.id === noteId ? updated : n)),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle action item';
        set({ notes: previous, error: message });
        toast.error(message);
      }
    },

    deleteNote: async (id) => {
      const previous = get().notes;
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      try {
        const res = await fetch(apiUrl(`/api/meetingnotes/${id}`), {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not delete the note — restoring it';
        set({ notes: previous, error: message });
        toast.error('Could not delete the note — restoring it');
      }
    },
  })
);
