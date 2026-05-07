import { useMemo, useState, useEffect } from 'react';
import { CheckSquare, Plus, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useComplianceStore } from '@/stores/useComplianceStore';
import { useDealStore } from '@/stores/useDealStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ComplianceChecklist } from '@/types';

function formatDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  engagement: { bg: 'hsl(222 84% 16% / 0.12)', text: 'hsl(222 75% 38%)' },
  search: { bg: 'hsl(210 85% 52% / 0.12)', text: 'hsl(210 78% 38%)' },
  offer: { bg: 'hsl(200 88% 50% / 0.12)', text: 'hsl(200 80% 35%)' },
  settlement: { bg: 'hsl(142 60% 40% / 0.12)', text: 'hsl(142 55% 32%)' },
};

export default function CompliancePage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchCompliancechecklists = useComplianceStore((s) => s.fetchCompliancechecklists);
  useEffect(() => {
    fetchCompliancechecklists();
  }, [fetchCompliancechecklists]);
  // === end auto fetch-on-mount ===

  const fetchDeals = useDealStore((s) => s.fetchDeals);
  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const navigate = useNavigate();
  const checklists = useComplianceStore((s) => s.checklists);
  const addChecklist = useComplianceStore((s) => s.addChecklist);
  const toggleItem = useComplianceStore((s) => s.toggleItem);
  const addItem = useComplianceStore((s) => s.addItem);
  const deals = useDealStore((s) => s.deals);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newDealId, setNewDealId] = useState('');
  const [newStage, setNewStage] = useState<ComplianceChecklist['stage']>('engagement');
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

  const selected = useMemo(() => checklists.find((c) => c.id === selectedId), [checklists, selectedId]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof checklists>();
    for (const cl of checklists) {
      const existing = map.get(cl.dealId) ?? [];
      map.set(cl.dealId, [...existing, cl]);
    }
    return Array.from(map.entries());
  }, [checklists]);

  function handleAddChecklist() {
    if (!newDealId) { toast.error('Please select an engagement.'); return; }
    addChecklist({ dealId: newDealId, items: [], stage: newStage });
    toast.success('Compliance checklist created.');
    setAddOpen(false);
    setNewDealId(''); setNewStage('engagement');
  }

  const totalCompleted = useMemo(() =>
    checklists.reduce((acc, cl) => acc + cl.items.filter((i) => i.completed).length, 0), [checklists]);
  const totalItems = useMemo(() =>
    checklists.reduce((acc, cl) => acc + cl.items.length, 0), [checklists]);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div
          className="rounded-2xl p-6 flex items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, hsl(222,78%,18%) 0%, hsl(214,72%,40%) 100%)', boxShadow: '0 4px 20px hsl(222 75% 25% / 0.30)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(210 75% 78%)' }}>
              Audit Ready
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(0 0% 100%)' }}>Compliance</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(210 60% 80%)' }}>
              Internal audit-ready workflow checklists tied to deal stages.
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            <Plus size={14} />
            New checklist
          </button>
        </div>

        {/* ── Summary stats ── */}
        {checklists.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Checklists', value: checklists.length, color: 'var(--blue-core)' },
              { label: 'Items completed', value: totalCompleted, color: 'var(--blue-bright)' },
              { label: 'Total items', value: totalItems, color: 'var(--blue-sky)' },
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
        )}

        {checklists.length === 0 ? (
          <EmptyState
            icon={<CheckSquare size={22} />}
            heading="No compliance checklists created."
            description="Checklists are tied to deal stages and keep your workflow audit-ready."
            ctaLabel="Go to Engagements"
            onCta={() => navigate('/deals')}
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: grouped list */}
            <div className="lg:col-span-1 space-y-4">
              {grouped.map(([dealId, cls]) => {
                const deal = deals.find((d) => d.id === dealId);
                return (
                  <div key={dealId}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 truncate">
                      {deal?.title ?? 'Unknown engagement'}
                    </p>
                    <div className="space-y-2">
                      {cls.map((cl) => {
                        const pct = cl.items.length > 0
                          ? (cl.items.filter((i) => i.completed).length / cl.items.length) * 100
                          : 0;
                        const stageStyle = STAGE_COLORS[cl.stage] ?? STAGE_COLORS.engagement;
                        return (
                          <button
                            key={cl.id}
                            className="w-full text-left rounded-xl border p-4 bg-card shadow-[var(--shadow-card)] transition-all duration-150"
                            style={{
                              borderColor: selectedId === cl.id ? 'hsl(214 70% 60%)' : 'hsl(214 60% 90%)',
                              boxShadow: selectedId === cl.id ? '0 0 0 2px hsl(214 70% 70% / 0.3)' : undefined,
                            }}
                            onClick={() => setSelectedId(cl.id)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold capitalize"
                                style={stageStyle}
                              >
                                {cl.stage}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {cl.items.filter((i) => i.completed).length}/{cl.items.length}
                              </span>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: detail */}
            <div className="lg:col-span-2">
              {!selected ? (
                <div
                  className="rounded-2xl border p-12 text-center"
                  style={{ borderColor: 'hsl(214 60% 90%)', background: 'var(--blue-frost)' }}
                >
                  <Shield size={32} className="mx-auto mb-3 opacity-30 text-primary" />
                  <p className="text-sm text-muted-foreground">Select a checklist to view and edit items.</p>
                </div>
              ) : (
                <div
                  className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elevated)]"
                  style={{ borderColor: 'hsl(214 60% 88%)' }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <span
                        className="inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold capitalize"
                        style={STAGE_COLORS[selected.stage] ?? STAGE_COLORS.engagement}
                      >
                        {selected.stage}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {deals.find((d) => d.id === selected.dealId)?.title ?? 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {selected.items.filter((i) => i.completed).length}
                        <span className="text-base text-muted-foreground font-normal">/{selected.items.length}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">completed</p>
                    </div>
                  </div>

                  <Progress
                    value={selected.items.length > 0 ? (selected.items.filter((i) => i.completed).length / selected.items.length) * 100 : 0}
                    className="mb-5 h-2"
                  />

                  <div className="space-y-2.5">
                    {selected.items.length === 0 && (
                      <p className="text-sm text-muted-foreground py-6 text-center">No items yet — add one below.</p>
                    )}
                    {selected.items.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors"
                        style={{ background: item.completed ? 'hsl(142 40% 50% / 0.06)' : 'transparent' }}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleItem(selected.id, idx, currentUser?.name ?? 'Agent')}
                          className="mt-0.5 rounded border-border accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                            {item.label}
                          </p>
                          {item.completed && item.completedBy && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.completedBy}{item.completedAt ? ` · ${formatDate(item.completedAt)}` : ''}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Add item */}
                  <div className="mt-5 flex gap-2 pt-5" style={{ borderTop: '1px solid hsl(214 50% 92%)' }}>
                    <Input
                      placeholder="Add checklist item…"
                      className="h-9 text-sm"
                      value={newItemInputs[selected.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewItemInputs((prev) => ({ ...prev, [selected.id]: val }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = newItemInputs[selected.id]?.trim();
                          if (v) { addItem(selected.id, v); setNewItemInputs((prev) => ({ ...prev, [selected.id]: '' })); }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => {
                        const v = newItemInputs[selected.id]?.trim();
                        if (v) { addItem(selected.id, v); setNewItemInputs((prev) => ({ ...prev, [selected.id]: '' })); }
                      }}
                    >
                      Add item
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add checklist dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Compliance Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Engagement</Label>
              <Select value={newDealId} onChange={(e) => setNewDealId(e.target.value)}>
                <option value="">— Select engagement —</option>
                {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={newStage} onChange={(e) => setNewStage(e.target.value as ComplianceChecklist['stage'])}>
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