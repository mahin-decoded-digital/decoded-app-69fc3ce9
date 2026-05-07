import { useMemo, useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useMeetingStore } from '@/stores/useMeetingStore';
import { useDealStore } from '@/stores/useDealStore';
import { Input } from '@/components/ui/input';
import type { MeetingNote } from '@/types';

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MeetingsPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchMeetingnotes = useMeetingStore((s) => s.fetchMeetingnotes);
  useEffect(() => {
    fetchMeetingnotes();
  }, [fetchMeetingnotes]);
  // === end auto fetch-on-mount ===

  const notes = useMeetingStore((s) => s.notes);
  const addNote = useMeetingStore((s) => s.addNote);
  const generateSummary = useMeetingStore((s) => s.generateSummary);
  const toggleActionItem = useMeetingStore((s) => s.toggleActionItem);
  const deleteNote = useMeetingStore((s) => s.deleteNote);
  const deals = useDealStore((s) => s.deals);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generatedNoteId, setGeneratedNoteId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [dealId, setDealId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [consent, setConsent] = useState(false);
  const [visibility, setVisibility] = useState<MeetingNote['visibility']>('internal');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const sorted = useMemo(() =>
    [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notes]
  );

  const generatedNote = useMemo(
    () => (generatedNoteId ? notes.find((n) => n.id === generatedNoteId) : null),
    [generatedNoteId, notes]
  );

  function resetForm() {
    setTitle(''); setDealId(''); setTranscript(''); setConsent(false);
    setVisibility('internal'); setFormErrors({}); setGeneratedNoteId(null);
  }

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!dealId) errs.dealId = 'Please select an engagement.';
    if (!consent) errs.consent = 'Client consent must be confirmed.';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    addNote({
      dealId,
      title: title.trim(),
      rawTranscript: transcript,
      aiSummary: '',
      actionItems: [],
      consentConfirmed: consent,
      visibility,
    });
    toast.success('Meeting note saved.');
    resetForm();
    setAddOpen(false);
  }

  function handleGenerate() {
    if (!transcript.trim()) { toast.error('Transcript is required to generate a summary.'); return; }
    if (!consent) { toast.error('Confirm client consent to enable AI summary.'); return; }
    if (!dealId || !title.trim()) { toast.error('Please fill in all required fields first.'); return; }

    addNote({
      dealId,
      title: title.trim(),
      rawTranscript: transcript,
      aiSummary: '',
      actionItems: [],
      consentConfirmed: consent,
      visibility,
    });
    // Use getState to get the just-added note synchronously
    const allNotes = useMeetingStore.getState().notes;
    const newest = allNotes.find((n) => n.dealId === dealId && n.title === title.trim());
    if (newest) {
      generateSummary(newest.id);
      setGeneratedNoteId(newest.id);
      toast.success('Summary generated.');
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Meeting Notes & AI Summaries</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Privacy-first AI summarisation — client consent is required before any recording is processed.</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add meeting note</Button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={22} />}
            heading="No meeting notes recorded yet."
            description="After your next client call or site visit, paste the transcript here and let the AI extract the key points."
            ctaLabel="+ Add first meeting note"
            onCta={() => setAddOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {sorted.map((note) => {
              const deal = deals.find((d) => d.id === note.dealId);
              const isExpanded = selectedId === note.id;
              return (
                <div
                  key={note.id}
                  className="rounded-lg border border-border bg-card shadow-[var(--shadow-card)]"
                >
                  <button
                    className="w-full text-left px-4 py-3"
                    onClick={() => setSelectedId(isExpanded ? null : note.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground">{deal?.title ?? 'Unknown engagement'} · {formatDate(note.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{note.actionItems.length} action{note.actionItems.length !== 1 ? 's' : ''}</span>
                        <Badge variant={note.visibility === 'client-visible' ? 'default' : 'secondary'} className="text-xs">
                          {note.visibility === 'client-visible' ? 'Client visible' : 'Internal'}
                        </Badge>
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(note.id); }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {note.aiSummary && !isExpanded && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{note.aiSummary}</p>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border space-y-3 pt-3">
                      {note.aiSummary ? (
                        <div className="rounded-md bg-[var(--surface-subtle)] p-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">AI Summary</p>
                          <p className="text-sm text-foreground">{note.aiSummary}</p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => {
                            if (!note.rawTranscript) { toast.error('Transcript is required to generate a summary.'); return; }
                            generateSummary(note.id);
                            toast.success('Summary generated.');
                          }}
                        >
                          Generate summary
                        </Button>
                      )}
                      {note.rawTranscript && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Transcript</p>
                          <p className="text-xs text-muted-foreground line-clamp-4">{note.rawTranscript}</p>
                        </div>
                      )}
                      {note.actionItems.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Action Items</p>
                          <div className="space-y-1.5">
                            {note.actionItems.map((item, i) => (
                              <label key={i} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={() => toggleActionItem(note.id, i)}
                                  className="rounded border-border"
                                />
                                <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {item.task}
                                  {item.assignee && ` — ${item.assignee}`}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add meeting note dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) resetForm(); setAddOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Meeting Note</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Initial brief call — Smith Family" />
              {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Engagement</Label>
              <Select value={dealId} onChange={(e) => setDealId(e.target.value)}>
                <option value="">— Select engagement —</option>
                {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </Select>
              {formErrors.dealId && <p className="text-xs text-destructive">{formErrors.dealId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Transcript</Label>
              <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={6} placeholder="Paste the raw transcript or notes here…" />
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={visibility} onChange={(e) => setVisibility(e.target.value as MeetingNote['visibility'])}>
                <option value="internal">Internal only</option>
                <option value="client-visible">Client visible</option>
              </Select>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-sm text-foreground">Client has consented to AI summarisation</span>
            </label>
            {formErrors.consent && <p className="text-xs text-destructive">{formErrors.consent}</p>}

            {generatedNote?.aiSummary && (
              <div className="rounded-md bg-[var(--surface-subtle)] p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Generated Summary</p>
                <p className="text-sm text-foreground">{generatedNote.aiSummary}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              type="button"
              disabled={!consent}
              title={!consent ? 'Confirm client consent to enable AI summary.' : undefined}
              onClick={handleGenerate}
            >
              Generate summary
            </Button>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button onClick={handleSave}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete meeting note</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Are you sure you want to delete this meeting note?</p>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={() => {
              if (deleteId) {
                deleteNote(deleteId);
                setDeleteId(null);
                toast.success('Meeting note deleted.');
              }
            }}>
              Yes, delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}