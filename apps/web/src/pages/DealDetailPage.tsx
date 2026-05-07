import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckSquare, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { DealStatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useDealStore } from '@/stores/useDealStore';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { useAgentStore } from '@/stores/useAgentStore';
import { useMeetingStore } from '@/stores/useMeetingStore';
import { useComplianceStore } from '@/stores/useComplianceStore';
import { useEmailStore } from '@/stores/useEmailStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Deal, MeetingNote, ComplianceChecklist } from '@/types';

function formatBudget(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function formatDate(d: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DealDetailPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchOffmarketproperties = usePropertyStore((s) => s.fetchOffmarketproperties);
  useEffect(() => {
    fetchOffmarketproperties();
  }, [fetchOffmarketproperties]);
  // === end auto fetch-on-mount ===

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // All hooks must be called unconditionally before any early return
  const deals = useDealStore((s) => s.deals);
  const updateDeal = useDealStore((s) => s.updateDeal);

  const dealProperties = usePropertyStore((s) => s.dealProperties);
  const properties = usePropertyStore((s) => s.properties);
  const addDealProperty = usePropertyStore((s) => s.addDealProperty);
  const updateDealProperty = usePropertyStore((s) => s.updateDealProperty);

  const notes = useMeetingStore((s) => s.notes);
  const addNote = useMeetingStore((s) => s.addNote);
  const generateSummary = useMeetingStore((s) => s.generateSummary);
  const toggleActionItem = useMeetingStore((s) => s.toggleActionItem);
  const deleteNote = useMeetingStore((s) => s.deleteNote);

  const checklists = useComplianceStore((s) => s.checklists);
  const addChecklist = useComplianceStore((s) => s.addChecklist);
  const toggleItem = useComplianceStore((s) => s.toggleItem);
  const addItem = useComplianceStore((s) => s.addItem);

  const templates = useEmailStore((s) => s.templates);
  const currentUser = useAuthStore((s) => s.currentUser);
  const agents = useAgentStore((s) => s.agents);

  // Shortlist property dialog
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [shortlistPropertyId, setShortlistPropertyId] = useState('');

  // Meeting note dialog
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetTranscript, setMeetTranscript] = useState('');
  const [meetConsent, setMeetConsent] = useState(false);
  const [meetVisibility, setMeetVisibility] = useState<MeetingNote['visibility']>('internal');
  const [meetErrors, setMeetErrors] = useState<Record<string, string>>({});

  // Compliance
  const [addChecklistOpen, setAddChecklistOpen] = useState(false);
  const [checklistStage, setChecklistStage] = useState<ComplianceChecklist['stage']>('engagement');
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

  // Edit deal
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<Deal['status']>('lead');
  const [editSuburb, setEditSuburb] = useState('');

  // Guard after all hooks
  if (!id) return <Navigate to="/deals" replace />;

  const deal = deals.find((d) => d.id === id);
  if (!deal) return <Navigate to="/deals" replace />;

  const dealProps = dealProperties.filter((dp) => dp.dealId === id);
  const dealNotes = notes.filter((n) => n.dealId === id);
  const dealChecklists = checklists.filter((c) => c.dealId === id);
  const availableProperties = properties.filter((p) => !dealProps.some((dp) => dp.propertyId === p.id));

  function handleShortlistAdd() {
    if (!shortlistPropertyId) return;
    const alreadyAdded = dealProps.some((dp) => dp.propertyId === shortlistPropertyId);
    if (alreadyAdded) { toast.error('Property already shortlisted for this engagement.'); return; }
    addDealProperty({
      dealId: id,
      propertyId: shortlistPropertyId,
      shortlistStatus: 'considering',
      clientVisible: false,
      internalNotes: '',
      clientNotes: '',
      ddRecordId: null,
    });
    setShortlistOpen(false);
    setShortlistPropertyId('');
    toast.success('Property added to shortlist.');
  }

  function handleSaveMeeting() {
    const errs: Record<string, string> = {};
    if (!meetTitle.trim()) errs.title = 'Title is required.';
    if (!meetConsent) errs.consent = 'Client consent must be confirmed.';
    setMeetErrors(errs);
    if (Object.keys(errs).length > 0) return;

    addNote({
      dealId: id,
      title: meetTitle.trim(),
      rawTranscript: meetTranscript,
      aiSummary: '',
      actionItems: [],
      consentConfirmed: meetConsent,
      visibility: meetVisibility,
    });
    toast.success('Meeting note saved.');
    setMeetTitle(''); setMeetTranscript(''); setMeetConsent(false); setMeetVisibility('internal');
    setMeetErrors({});
    setMeetingOpen(false);
  }

  function handleGenerateSummary(noteId: string) {
    const n = useMeetingStore.getState().notes.find((x) => x.id === noteId);
    if (!n?.rawTranscript) { toast.error('Transcript is required to generate a summary.'); return; }
    generateSummary(noteId);
    toast.success('Summary generated.');
  }

  function openEditDeal() {
    setEditStatus(deal.status);
    setEditSuburb(deal.suburb);
    setEditOpen(true);
  }

  function handleEditSave() {
    updateDeal(deal.id, { status: editStatus, suburb: editSuburb });
    setEditOpen(false);
    toast.success('Engagement updated.');
  }

  function handleAddChecklist() {
    addChecklist({ dealId: id, items: [], stage: checklistStage });
    setAddChecklistOpen(false);
    toast.success('Checklist created.');
  }

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate('/deals')}
        >
          <ArrowLeft size={14} /> Back to engagements
        </button>

        {/* Deal header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">{deal.title}</h1>
              <DealStatusBadge status={deal.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {deal.suburb} · {deal.geoSegment} · {formatBudget(deal.budgetMin)} – {formatBudget(deal.budgetMax)} · {deal.bedrooms}b{deal.bathrooms}ba
            </p>
            {deal.brief && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">{deal.brief}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={openEditDeal}>Edit deal</Button>
            <Select
              className="w-36 text-xs h-8"
              value={deal.agreementStatus}
              onChange={(e) => updateDeal(deal.id, { agreementStatus: e.target.value as Deal['agreementStatus'] })}
            >
              <option value="none">No agreement</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="signed">Signed</option>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties">
          <TabsList className="flex-wrap">
            <TabsTrigger value="properties">Properties ({dealProps.length})</TabsTrigger>
            <TabsTrigger value="meetings">Meeting Notes ({dealNotes.length})</TabsTrigger>
            <TabsTrigger value="compliance">Compliance ({dealChecklists.length})</TabsTrigger>
            <TabsTrigger value="comms">Stakeholder Comms</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShortlistOpen(true)}>
                  <Plus size={14} className="mr-1" /> Add to shortlist
                </Button>
              </div>
              {dealProps.length === 0 ? (
                <EmptyState
                  icon={<CheckSquare size={20} />}
                  heading="No properties shortlisted yet."
                  description="Search the off-market database or add a new property to start building this client's shortlist."
                  ctaLabel="Add to shortlist"
                  onCta={() => setShortlistOpen(true)}
                />
              ) : (
                <div className="space-y-3">
                  {dealProps.map((dp) => {
                    const prop = properties.find((p) => p.id === dp.propertyId);
                    if (!prop) return null;
                    const sourceAgent = agents.find((a) => a.id === prop.sourceAgentId);
                    return (
                      <div key={dp.id} className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-sm text-foreground">{prop.streetAddress}</p>
                            <p className="text-xs text-muted-foreground">{prop.suburb} · {formatBudget(prop.priceGuide)} · {prop.bedrooms}b{prop.bathrooms}ba</p>
                            {sourceAgent && <p className="text-xs text-muted-foreground mt-0.5">Source: {sourceAgent.name}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Select
                              className="text-xs h-7 w-32"
                              value={dp.shortlistStatus}
                              onChange={(e) => updateDealProperty(dp.id, { shortlistStatus: e.target.value as typeof dp.shortlistStatus })}
                            >
                              <option value="considering">Considering</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="rejected">Rejected</option>
                              <option value="offer-made">Offer Made</option>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                            <Switch
                              checked={dp.clientVisible}
                              onCheckedChange={(v) => updateDealProperty(dp.id, { clientVisible: v })}
                            />
                            Client visible
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2"
                            onClick={() => navigate('/due-diligence')}
                          >
                            Due Diligence
                          </Button>
                        </div>
                        {dp.internalNotes && (
                          <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">{dp.internalNotes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Meeting Notes Tab */}
          <TabsContent value="meetings">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setMeetingOpen(true)}>
                  <Plus size={14} className="mr-1" /> + Add meeting note
                </Button>
              </div>
              {dealNotes.length === 0 ? (
                <EmptyState
                  heading="No meeting notes yet."
                  description="After your next client call or site visit, paste the transcript here and let the AI extract the key points."
                  ctaLabel="+ Add meeting note"
                  onCta={() => setMeetingOpen(true)}
                />
              ) : (
                <div className="space-y-3">
                  {dealNotes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-foreground">{note.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={note.visibility === 'client-visible' ? 'default' : 'secondary'}>
                            {note.visibility === 'client-visible' ? 'Client visible' : 'Internal'}
                          </Badge>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => { deleteNote(note.id); toast.success('Meeting note deleted.'); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      {note.aiSummary && (
                        <p className="mt-2 text-xs text-muted-foreground bg-[var(--surface-subtle)] rounded p-2">{note.aiSummary.slice(0, 200)}{note.aiSummary.length > 200 ? '…' : ''}</p>
                      )}
                      {!note.aiSummary && note.rawTranscript && (
                        <Button size="sm" variant="outline" className="mt-2 text-xs h-6 px-2"
                          onClick={() => handleGenerateSummary(note.id)}>
                          Generate summary
                        </Button>
                      )}
                      {note.actionItems.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Items</p>
                          {note.actionItems.map((item, i) => (
                            <label key={i} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleActionItem(note.id, i)}
                                className="rounded border-border"
                              />
                              <span className={`text-xs ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {item.task} — {item.assignee}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setAddChecklistOpen(true)}>
                  <Plus size={14} className="mr-1" /> Add checklist
                </Button>
              </div>
              {dealChecklists.length === 0 ? (
                <EmptyState
                  heading="No compliance checklists created."
                  description="Checklists are tied to deal stages and keep your workflow audit-ready."
                  ctaLabel="Add checklist"
                  onCta={() => setAddChecklistOpen(true)}
                />
              ) : (
                <div className="space-y-4">
                  {dealChecklists.map((cl) => (
                    <div key={cl.id} className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="capitalize">{cl.stage}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {cl.items.filter((i) => i.completed).length}/{cl.items.length} completed
                        </span>
                      </div>
                      <div className="space-y-2">
                        {cl.items.map((item, idx) => (
                          <label key={idx} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleItem(cl.id, idx, currentUser?.name ?? 'Agent')}
                              className="mt-0.5 rounded border-border"
                            />
                            <div className="flex-1">
                              <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {item.label}
                              </span>
                              {item.completed && item.completedBy && (
                                <p className="text-xs text-muted-foreground">{item.completedBy} · {formatDate(item.completedAt)}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Input
                          placeholder="Add checklist item…"
                          className="h-7 text-xs"
                          value={newItemInputs[cl.id] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewItemInputs((prev) => ({ ...prev, [cl.id]: val }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const v = newItemInputs[cl.id]?.trim();
                              if (v) {
                                addItem(cl.id, v);
                                setNewItemInputs((prev) => ({ ...prev, [cl.id]: '' }));
                              }
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            const v = newItemInputs[cl.id]?.trim();
                            if (v) { addItem(cl.id, v); setNewItemInputs((prev) => ({ ...prev, [cl.id]: '' })); }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Stakeholder Comms Tab */}
          <TabsContent value="comms">
            <div className="space-y-4">
              {templates.length === 0 ? (
                <EmptyState
                  heading="No email templates saved yet."
                  description="Build your library of welcome emails, requirement blasts, and post-settlement messages to save time on every engagement."
                  ctaLabel="Go to Email Templates"
                  onCta={() => navigate('/email-templates')}
                />
              ) : (
                <div className="space-y-2">
                  {templates.filter((t) => t.isActive).map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                        <Badge variant="secondary" className="mt-1 capitalize text-xs">{t.category.replace('-', ' ')}</Badge>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toast.success(`Template "${t.name}" marked as sent.`)}>
                        Send to stakeholder
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add to shortlist dialog */}
      <Dialog open={shortlistOpen} onOpenChange={setShortlistOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add property to shortlist</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            {availableProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No more properties available. Add new ones in the Off-Market Database.</p>
            ) : (
              <div className="space-y-1.5">
                <Label>Select property</Label>
                <Select value={shortlistPropertyId} onChange={(e) => setShortlistPropertyId(e.target.value)}>
                  <option value="">— Select —</option>
                  {availableProperties.map((p) => (
                    <option key={p.id} value={p.id}>{p.streetAddress}, {p.suburb}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleShortlistAdd} disabled={!shortlistPropertyId}>Add to shortlist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting note dialog */}
      <Dialog open={meetingOpen} onOpenChange={(v) => {
        if (!v) {
          setMeetTitle('');
          setMeetTranscript('');
          setMeetConsent(false);
          setMeetErrors({});
        }
        setMeetingOpen(v);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Meeting Note</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={meetTitle} onChange={(e) => setMeetTitle(e.target.value)} placeholder="e.g. Initial brief call" />
              {meetErrors.title && <p className="text-xs text-destructive">{meetErrors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Transcript / Notes</Label>
              <Textarea value={meetTranscript} onChange={(e) => setMeetTranscript(e.target.value)} placeholder="Paste the meeting transcript or notes here…" rows={6} />
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={meetVisibility} onChange={(e) => setMeetVisibility(e.target.value as MeetingNote['visibility'])}>
                <option value="internal">Internal only</option>
                <option value="client-visible">Client visible</option>
              </Select>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={meetConsent}
                onChange={(e) => setMeetConsent(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-sm text-foreground">Client has consented to AI summarisation</span>
            </label>
            {meetErrors.consent && <p className="text-xs text-destructive">{meetErrors.consent}</p>}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveMeeting}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit deal dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Engagement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Deal['status'])}>
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="due-diligence">Due Diligence</option>
                <option value="offer">Offer</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Suburb</Label>
              <Input value={editSuburb} onChange={(e) => setEditSuburb(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEditSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add checklist dialog */}
      <Dialog open={addChecklistOpen} onOpenChange={setAddChecklistOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Compliance Checklist</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={checklistStage} onChange={(e) => setChecklistStage(e.target.value as ComplianceChecklist['stage'])}>
                <option value="engagement">Engagement</option>
                <option value="search">Search</option>
                <option value="offer">Offer</option>
                <option value="settlement">Settlement</option>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAddChecklist}>Create checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}