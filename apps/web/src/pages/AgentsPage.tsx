import { useMemo, useState, useEffect } from 'react'
import {MoreHorizontal, Rocket, Send} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAgentStore } from '@/stores/useAgentStore';
import { useDealStore } from '@/stores/useDealStore';
import type { Agent, RequirementBlast } from '@/types';

function formatDate(d: Date | string | null) {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AgentsPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchDeals = useDealStore((s) => s.fetchDeals);
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);
  // === end auto fetch-on-mount ===

  const agents = useAgentStore((s) => s.agents);
  const blasts = useAgentStore((s) => s.blasts);
  const searchQuery = useAgentStore((s) => s.searchQuery);
  const geoFilter = useAgentStore((s) => s.geoFilter);
  const preferredOnly = useAgentStore((s) => s.preferredOnly);
  const setSearchQuery = useAgentStore((s) => s.setSearchQuery);
  const setGeoFilter = useAgentStore((s) => s.setGeoFilter);
  const setPreferredOnly = useAgentStore((s) => s.setPreferredOnly);
  const addAgent = useAgentStore((s) => s.addAgent);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const deleteAgent = useAgentStore((s) => s.deleteAgent);
  const addBlast = useAgentStore((s) => s.addBlast);
  const sendBlast = useAgentStore((s) => s.sendBlast);
  const deals = useDealStore((s) => s.deals);

  const [addOpen, setAddOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [blastOpen, setBlastOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Agent form state
  const [agName, setAgName] = useState('');
  const [agEmail, setAgEmail] = useState('');
  const [agPhone, setAgPhone] = useState('');
  const [agAgency, setAgAgency] = useState('');
  const [agGeo, setAgGeo] = useState<Agent['geoSegment']>('Central');
  const [agSuburb, setAgSuburb] = useState('');
  const [agPreferred, setAgPreferred] = useState(false);
  const [agNotes, setAgNotes] = useState('');
  const [agErrors, setAgErrors] = useState<Record<string, string>>({});

  // Blast form state
  const [blastDealId, setBlastDealId] = useState('');
  const [blastGeo, setBlastGeo] = useState<RequirementBlast['geoSegment']>('All');
  const [blastPreferred, setBlastPreferred] = useState(false);
  const [blastSubject, setBlastSubject] = useState('New Client Requirement — Martelli Buyers');
  const [blastBody, setBlastBody] = useState('');
  const [blastErrors, setBlastErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return agents.filter((a) => {
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.agency.toLowerCase().includes(q);
      const matchGeo = !geoFilter || a.geoSegment === geoFilter;
      const matchPref = !preferredOnly || a.isPreferred;
      return matchQ && matchGeo && matchPref;
    });
  }, [agents, searchQuery, geoFilter, preferredOnly]);

  const blastRecipients = useMemo(() => {
    return agents.filter((a) => {
      const matchGeo = blastGeo === 'All' || a.geoSegment === blastGeo;
      const matchPref = !blastPreferred || a.isPreferred;
      return matchGeo && matchPref;
    });
  }, [agents, blastGeo, blastPreferred]);

  function resetAgentForm() {
    setAgName(''); setAgEmail(''); setAgPhone(''); setAgAgency('');
    setAgGeo('Central'); setAgSuburb(''); setAgPreferred(false); setAgNotes('');
    setAgErrors({});
  }

  function validateAgent(): boolean {
    const errs: Record<string, string> = {};
    if (!agName.trim()) errs.name = 'Name is required.';
    if (!agEmail.trim()) errs.email = 'Email is required.';
    if (!agGeo) errs.geo = 'Geo segment is required.';
    setAgErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleAddAgent() {
    if (!validateAgent()) return;
    addAgent({
      name: agName.trim(),
      email: agEmail.trim(),
      phone: agPhone.trim(),
      agency: agAgency.trim(),
      geoSegment: agGeo,
      suburb: agSuburb.trim(),
      isPreferred: agPreferred,
      notes: agNotes.trim(),
      lastContactedAt: null,
    });
    toast.success('Agent added.');
    resetAgentForm();
    setAddOpen(false);
  }

  function handleEditOpen(a: Agent) {
    setEditAgent(a);
    setAgName(a.name); setAgEmail(a.email); setAgPhone(a.phone); setAgAgency(a.agency);
    setAgGeo(a.geoSegment); setAgSuburb(a.suburb); setAgPreferred(a.isPreferred); setAgNotes(a.notes);
    setOpenMenuId(null);
  }

  function handleEditSave() {
    if (!editAgent) return;
    if (!validateAgent()) return;
    updateAgent(editAgent.id, {
      name: agName.trim(), email: agEmail.trim(), phone: agPhone.trim(),
      agency: agAgency.trim(), geoSegment: agGeo, suburb: agSuburb.trim(),
      isPreferred: agPreferred, notes: agNotes.trim(),
    });
    toast.success('Agent updated.');
    setEditAgent(null);
    resetAgentForm();
  }

  function handleDeleteAgent(id: string) {
    deleteAgent(id);
    setDeleteId(null);
    toast.success('Agent removed from network.');
  }

  function handleSendBlast() {
    const errs: Record<string, string> = {};
    if (!blastDealId) errs.deal = 'Please select an engagement.';
    if (blastRecipients.length === 0) errs.recipients = 'No agents match the selected filters — adjust geo segment or preferred filter.';
    setBlastErrors(errs);
    if (Object.keys(errs).length > 0) return;

    addBlast({
      dealId: blastDealId,
      geoSegment: blastGeo,
      preferredOnly: blastPreferred,
      agentIds: blastRecipients.map((a) => a.id),
      subject: blastSubject,
      body: blastBody,
      sentAt: null,
      status: 'draft',
      recipientCount: blastRecipients.length,
    });
    const newBlast = useAgentStore.getState().blasts.slice(-1)[0];
    if (newBlast) {
      sendBlast(newBlast.id);
      // Update lastContactedAt for recipients
      blastRecipients.forEach((a) => updateAgent(a.id, { lastContactedAt: new Date() }));
    }
    toast.success(`Requirement blast sent to ${blastRecipients.length} agents.`);
    setBlastOpen(false);
    setBlastDealId(''); setBlastGeo('All'); setBlastPreferred(false);
    setBlastSubject('New Client Requirement — Martelli Buyers'); setBlastBody('');
    setBlastErrors({});
  }

  const sentBlasts = useMemo(() => blasts.filter((b) => b.status === 'sent'), [blasts]);

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Agent Rocket</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your contacts and send geo-targeted requirement blasts.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>+ Add agent</Button>
            <Button size="sm" onClick={() => setBlastOpen(true)}>
              <Send size={13} className="mr-1.5" />
              New requirement blast
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by name or agency…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={geoFilter} onChange={(e) => setGeoFilter(e.target.value)} className="max-w-[150px]">
            <option value="">All segments</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="North">North</option>
            <option value="Central">Central</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <Switch checked={preferredOnly} onCheckedChange={setPreferredOnly} />
            Preferred only
          </label>
          <span className="text-xs text-muted-foreground">{filtered.length} agent{filtered.length !== 1 ? 's' : ''} matched</span>
        </div>

        {/* Agent list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Rocket size={22} />}
            heading="No agents in your network yet."
            description="Add your contacts to unlock geo-targeted requirement blasts and off-market sourcing."
            ctaLabel="+ Add first agent"
            onCta={() => setAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[var(--surface-subtle)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Agency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Last contacted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((agent) => (
                  <tr key={agent.id} className="border-b border-border last:border-0 hover:bg-[var(--surface-subtle)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{agent.agency}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{agent.geoSegment}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{formatDate(agent.lastContactedAt)}</td>
                    <td className="px-4 py-3">
                      {agent.isPreferred && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--gold-subtle)] text-[var(--gold-muted)]">
                          Preferred
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-tinted)]"
                        onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenuId === agent.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-md border border-border bg-card shadow-[var(--shadow-elevated)]">
                          <button className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-tinted)]" onClick={() => handleEditOpen(agent)}>Edit</button>
                          <button className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/5" onClick={() => { setDeleteId(agent.id); setOpenMenuId(null); }}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Blast history */}
        {sentBlasts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Requirement Blast History</h2>
            <div className="rounded-lg border border-border bg-card shadow-[var(--shadow-card)] divide-y divide-border">
              {sentBlasts.map((b) => {
                const deal = deals.find((d) => d.id === b.dealId);
                return (
                  <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.subject}</p>
                      <p className="text-xs text-muted-foreground">{deal?.title ?? 'Unknown engagement'} · {b.geoSegment} · {b.recipientCount} recipients</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatDate(b.sentAt)}</span>
                      <Badge variant="default" className="text-xs">Sent</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit agent dialog */}
      <Dialog open={addOpen || !!editAgent} onOpenChange={(v) => { if (!v) { setAddOpen(false); setEditAgent(null); resetAgentForm(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editAgent ? 'Edit Agent' : 'Add Agent'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={agName} onChange={(e) => setAgName(e.target.value)} placeholder="James Chen" />
              {agErrors.name && <p className="text-xs text-destructive">{agErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={agEmail} onChange={(e) => setAgEmail(e.target.value)} placeholder="james@realestate.co.nz" />
              {agErrors.email && <p className="text-xs text-destructive">{agErrors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={agPhone} onChange={(e) => setAgPhone(e.target.value)} placeholder="+64 21 …" />
              </div>
              <div className="space-y-1.5">
                <Label>Agency</Label>
                <Input value={agAgency} onChange={(e) => setAgAgency(e.target.value)} placeholder="Ray White" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Geo segment</Label>
                <Select value={agGeo} onChange={(e) => setAgGeo(e.target.value as Agent['geoSegment'])}>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="Central">Central</option>
                </Select>
                {agErrors.geo && <p className="text-xs text-destructive">{agErrors.geo}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Suburb</Label>
                <Input value={agSuburb} onChange={(e) => setAgSuburb(e.target.value)} placeholder="Remuera" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={agPreferred} onCheckedChange={setAgPreferred} />
              <span className="text-sm text-foreground">Preferred agent</span>
            </label>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={agNotes} onChange={(e) => setAgNotes(e.target.value)} rows={2} placeholder="Any notes about this agent…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={editAgent ? handleEditSave : handleAddAgent}>
              {editAgent ? 'Save changes' : '+ Add agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blast dialog */}
      <Dialog open={blastOpen} onOpenChange={(v) => { if (!v) { setBlastDealId(''); setBlastBody(''); setBlastErrors({}); } setBlastOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Requirement Blast</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Engagement</Label>
              <Select value={blastDealId} onChange={(e) => setBlastDealId(e.target.value)}>
                <option value="">— Select engagement —</option>
                {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </Select>
              {blastErrors.deal && <p className="text-xs text-destructive">{blastErrors.deal}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Geo segment</Label>
                <Select value={blastGeo} onChange={(e) => setBlastGeo(e.target.value as RequirementBlast['geoSegment'])}>
                  <option value="All">All</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="Central">Central</option>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={blastPreferred} onCheckedChange={setBlastPreferred} />
                  <span className="text-sm text-foreground">Preferred only</span>
                </label>
              </div>
            </div>
            <div className="rounded-md bg-[var(--surface-tinted)] px-3 py-2 text-sm">
              <span className="font-medium text-foreground">{blastRecipients.length}</span>
              <span className="text-muted-foreground"> agent{blastRecipients.length !== 1 ? 's' : ''} will receive this blast</span>
            </div>
            {blastErrors.recipients && <p className="text-xs text-destructive">{blastErrors.recipients}</p>}
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={blastSubject} onChange={(e) => setBlastSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email body</Label>
              <Textarea value={blastBody} onChange={(e) => setBlastBody(e.target.value)} rows={5} placeholder="Describe the client requirement and property brief…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSendBlast}>Send requirement blast</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete agent dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove agent</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Are you sure you want to remove this agent from your network?</p>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={() => deleteId && handleDeleteAgent(deleteId)}>Yes, delete permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}