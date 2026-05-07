import { useMemo, useState, useEffect } from 'react';
import { MoreHorizontal, Rocket, Send, Search, Users } from 'lucide-react';
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

  const fetchDeals = useDealStore((s) => s.fetchDeals);
  useEffect(() => { fetchDeals(); }, [fetchDeals]);

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

  const [agName, setAgName] = useState('');
  const [agEmail, setAgEmail] = useState('');
  const [agPhone, setAgPhone] = useState('');
  const [agAgency, setAgAgency] = useState('');
  const [agGeo, setAgGeo] = useState<Agent['geoSegment']>('Central');
  const [agSuburb, setAgSuburb] = useState('');
  const [agPreferred, setAgPreferred] = useState(false);
  const [agNotes, setAgNotes] = useState('');
  const [agErrors, setAgErrors] = useState<Record<string, string>>({});

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
      name: agName.trim(), email: agEmail.trim(), phone: agPhone.trim(),
      agency: agAgency.trim(), geoSegment: agGeo, suburb: agSuburb.trim(),
      isPreferred: agPreferred, notes: agNotes.trim(), lastContactedAt: null,
    });
    toast.success('Agent added.');
    resetAgentForm(); setAddOpen(false);
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
    setEditAgent(null); resetAgentForm();
  }

  function handleDeleteAgent(id: string) {
    deleteAgent(id); setDeleteId(null);
    toast.success('Agent removed from network.');
  }

  function handleSendBlast() {
    const errs: Record<string, string> = {};
    if (!blastDealId) errs.deal = 'Please select an engagement.';
    if (blastRecipients.length === 0) errs.recipients = 'No agents match the selected filters.';
    setBlastErrors(errs);
    if (Object.keys(errs).length > 0) return;

    addBlast({
      dealId: blastDealId, geoSegment: blastGeo, preferredOnly: blastPreferred,
      agentIds: blastRecipients.map((a) => a.id), subject: blastSubject, body: blastBody,
      sentAt: null, status: 'draft', recipientCount: blastRecipients.length,
    });
    const newBlast = useAgentStore.getState().blasts.slice(-1)[0];
    if (newBlast) {
      sendBlast(newBlast.id);
      blastRecipients.forEach((a) => updateAgent(a.id, { lastContactedAt: new Date() }));
    }
    toast.success(`Requirement blast sent to ${blastRecipients.length} agents.`);
    setBlastOpen(false);
    setBlastDealId(''); setBlastGeo('All'); setBlastPreferred(false);
    setBlastSubject('New Client Requirement — Martelli Buyers'); setBlastBody('');
    setBlastErrors({});
  }

  const sentBlasts = useMemo(() => blasts.filter((b) => b.status === 'sent'), [blasts]);

  const GEO_COLORS: Record<string, string> = {
    East: 'hsl(200 85% 40%)',
    West: 'hsl(222 78% 38%)',
    North: 'hsl(210 80% 52%)',
    Central: 'hsl(214 70% 44%)',
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div
          className="rounded-2xl p-6 flex items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, hsl(200,88%,32%) 0%, hsl(210,85%,50%) 100%)', boxShadow: '0 4px 20px hsl(210 80% 40% / 0.25)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(205 80% 80%)' }}>
              Geo-Targeted Network
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(0 0% 100%)' }}>Agent Rocket</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(210 60% 82%)' }}>
              Manage your contacts and send geo-targeted requirement blasts.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: 'hsl(0 0% 100% / 0.15)', color: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 100% / 0.25)' }}
            >
              + Add agent
            </button>
            <button
              onClick={() => setBlastOpen(true)}
              className="btn-gradient flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              <Send size={13} />
              New blast
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total agents', value: agents.length, color: 'var(--blue-core)' },
            { label: 'Preferred agents', value: agents.filter((a) => a.isPreferred).length, color: 'var(--blue-bright)' },
            { label: 'Blasts sent', value: sentBlasts.length, color: 'var(--blue-sky)' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border p-4 bg-card shadow-[var(--shadow-card)]"
              style={{ borderColor: 'hsl(214 60% 90%)' }}
            >
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or agency…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-xs"
            />
          </div>
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
          <span className="text-xs text-muted-foreground ml-1">{filtered.length} agent{filtered.length !== 1 ? 's' : ''} matched</span>
        </div>

        {/* ── Agent table ── */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Rocket size={22} />}
            heading="No agents in your network yet."
            description="Add your contacts to unlock geo-targeted requirement blasts and off-market sourcing."
            ctaLabel="+ Add first agent"
            onCta={() => setAddOpen(true)}
          />
        ) : (
          <div
            className="rounded-2xl border overflow-hidden bg-card shadow-[var(--shadow-card)]"
            style={{ borderColor: 'hsl(214 60% 90%)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--blue-mist)', borderBottom: '1px solid hsl(214 60% 88%)' }}>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blue-deep)' }}>Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide hidden sm:table-cell" style={{ color: 'var(--blue-deep)' }}>Agency</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blue-deep)' }}>Segment</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--blue-deep)' }}>Last contacted</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blue-deep)' }}>Status</th>
                  <th className="w-10 px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((agent, idx) => (
                  <tr
                    key={agent.id}
                    className="border-b last:border-0 hover:bg-[var(--blue-frost)] transition-colors"
                    style={{ borderColor: 'hsl(214 50% 93%)' }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: `hsl(${210 + (idx * 7) % 20} 75% ${42 + (idx * 5) % 18}%)`,
                            color: 'hsl(0 0% 100%)',
                          }}
                        >
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{agent.agency}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{
                          background: `${GEO_COLORS[agent.geoSegment] ?? 'var(--blue-core)'}20`,
                          color: GEO_COLORS[agent.geoSegment] ?? 'var(--blue-core)',
                        }}
                      >
                        {agent.geoSegment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden md:table-cell">{formatDate(agent.lastContactedAt)}</td>
                    <td className="px-5 py-3.5">
                      {agent.isPreferred && (
                        <span
                          className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={{ background: 'var(--blue-mist)', color: 'var(--blue-core)' }}
                        >
                          ★ Preferred
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 relative">
                      <button
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-tinted)] transition-colors"
                        onClick={() => setOpenMenuId(openMenuId === agent.id ? null : agent.id)}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {openMenuId === agent.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
                          <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-tinted)] transition-colors" onClick={() => handleEditOpen(agent)}>Edit</button>
                          <button className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/5 transition-colors" onClick={() => { setDeleteId(agent.id); setOpenMenuId(null); }}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Blast history ── */}
        {sentBlasts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Send size={13} className="text-primary" />
              Requirement Blast History
            </h2>
            <div
              className="rounded-2xl border bg-card shadow-[var(--shadow-card)] divide-y overflow-hidden"
              style={{ borderColor: 'hsl(214 60% 90%)', borderTopColor: 'hsl(214 60% 90%)' }}
            >
              {sentBlasts.map((b) => {
                const deal = deals.find((d) => d.id === b.dealId);
                return (
                  <div key={b.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--blue-frost)] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{b.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{deal?.title ?? 'Unknown engagement'} · {b.geoSegment} · {b.recipientCount} recipients</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatDate(b.sentAt)}</span>
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{ background: 'var(--blue-mist)', color: 'var(--blue-core)' }}
                      >
                        Sent
                      </span>
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
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'var(--blue-mist)' }}
            >
              <span className="font-bold" style={{ color: 'var(--blue-core)' }}>{blastRecipients.length}</span>
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
            <Button onClick={handleSendBlast}>
              <Send size={13} className="mr-1.5" />
              Send requirement blast
            </Button>
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