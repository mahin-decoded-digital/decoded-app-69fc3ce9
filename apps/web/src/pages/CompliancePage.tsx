import { useMemo, useState, useEffect } from 'react'
import { CheckSquare, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useComplianceStore } from '@/stores/useComplianceStore';
import { useDealStore } from '@/stores/useDealStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ComplianceChecklist } from '@/types';

function formatDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

export default function CompliancePage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchDeals = useDealStore((s) => s.fetchDeals);
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);
  // === end auto fetch-on-mount ===

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

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Compliance Checklists</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Internal audit-ready workflow checklists tied to deal stages.</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} className="mr-1" /> New checklist
          </Button>
        </div>

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
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 truncate">
                      {deal?.title ?? 'Unknown engagement'}
                    </p>
                    <div className="space-y-1.5">
                      {cls.map((cl) => {
                        const pct = cl.items.length > 0
                          ? (cl.items.filter((i) => i.completed).length / cl.items.length) * 100
                          : 0;
                        return (
                          <button
                            key={cl.id}
                            className={`w-full text-left rounded-lg border p-3 bg-card shadow-[var(--shadow-card)] hover:border-primary/40 transition-colors ${selectedId === cl.id ? 'border-primary' : 'border-border'}`}
                            onClick={() => setSelectedId(cl.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="capitalize text-xs">{cl.stage}</Badge>
                              <span className="text-xs text-muted-foreground">{cl.items.filter((i) => i.completed).length}/{cl.items.length}</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
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
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">Select a checklist to view and edit items.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Badge variant="secondary" className="capitalize">{selected.stage}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {deals.find((d) => d.id === selected.dealId)?.title ?? 'Unknown'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selected.items.filter((i) => i.completed).length}/{selected.items.length} completed
                    </span>
                  </div>
                  <Progress
                    value={selected.items.length > 0 ? (selected.items.filter((i) => i.completed).length / selected.items.length) * 100 : 0}
                    className="mb-4"
                  />

                  <div className="space-y-2">
                    {selected.items.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">No items yet — add one below.</p>
                    )}
                    {selected.items.map((item, idx) => (
                      <label key={idx} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleItem(selected.id, idx, currentUser?.name ?? 'Agent')}
                          className="mt-0.5 rounded border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.label}
                          </p>
                          {item.completed && item.completedBy && (
                            <p className="text-xs text-muted-foreground">
                              {item.completedBy}{item.completedAt ? ` · ${formatDate(item.completedAt)}` : ''}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Add item */}
                  <div className="mt-4 flex gap-2 pt-4 border-t border-border">
                    <Input
                      placeholder="Add checklist item…"
                      className="h-8 text-sm"
                      value={newItemInputs[selected.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewItemInputs((prev) => ({ ...prev, [selected.id]: val }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = newItemInputs[selected.id]?.trim();
                          if (v) {
                            addItem(selected.id, v);
                            setNewItemInputs((prev) => ({ ...prev, [selected.id]: '' }));
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => {
                        const v = newItemInputs[selected.id]?.trim();
                        if (v) {
                          addItem(selected.id, v);
                          setNewItemInputs((prev) => ({ ...prev, [selected.id]: '' }));
                        }
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