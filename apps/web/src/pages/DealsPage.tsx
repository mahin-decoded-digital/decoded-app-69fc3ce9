import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Users, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { DealStatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { NewDealDialog } from '@/components/NewDealDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Deal } from '@/types';

function formatBudget(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

export default function DealsPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchDeals = useDealStore((s) => s.fetchDeals);
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);
  // === end auto fetch-on-mount ===

  const fetchDeals = useDealStore((s) => s.fetchDeals);
  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const navigate = useNavigate();
  const deals = useDealStore((s) => s.deals);
  const searchQuery = useDealStore((s) => s.searchQuery);
  const statusFilter = useDealStore((s) => s.statusFilter);
  const setSearchQuery = useDealStore((s) => s.setSearchQuery);
  const setStatusFilter = useDealStore((s) => s.setStatusFilter);
  const deleteDeal = useDealStore((s) => s.deleteDeal);

  const [newDealOpen, setNewDealOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return deals.filter((d) => {
      const matchQ = !q || d.title.toLowerCase().includes(q) || d.suburb.toLowerCase().includes(q);
      const matchStatus = !statusFilter || d.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [deals, searchQuery, statusFilter]);

  function handleDelete(id: string) {
    deleteDeal(id);
    setDeleteId(null);
    toast.success('Engagement deleted.');
  }

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div
          className="rounded-2xl p-6 flex items-center justify-between gap-4"
          style={{ background: 'var(--gradient-card-blue)', boxShadow: '0 4px 20px hsl(214 70% 40% / 0.20)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(210 80% 80%)' }}>
              Client Management
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(0 0% 100%)' }}>Engagements</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(210 60% 80%)' }}>
              Every client relationship, from brief to settlement.
            </p>
          </div>
          <button
            onClick={() => setNewDealOpen(true)}
            className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
            style={{ background: 'hsl(0 0% 100% / 0.20)', boxShadow: 'none', border: '1px solid hsl(0 0% 100% / 0.30)' }}
          >
            + New engagement
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by client name or suburb…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative flex items-center gap-1">
            <Filter size={14} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 max-w-[180px]"
            >
              <option value="">All statuses</option>
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="due-diligence">Due Diligence</option>
              <option value="offer">Offer</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </Select>
          </div>
          <span className="self-center text-xs text-muted-foreground ml-1">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            heading="No engagements yet."
            description="Each client relationship starts here. Create your first engagement to begin the search."
            ctaLabel="+ New engagement"
            onCta={() => setNewDealOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isMenuOpen={openMenuId === deal.id}
                onMenuToggle={() => setOpenMenuId(openMenuId === deal.id ? null : deal.id)}
                onMenuClose={() => setOpenMenuId(null)}
                onNavigate={() => navigate(`/deals/${deal.id}`)}
                onDelete={() => { setDeleteId(deal.id); setOpenMenuId(null); }}
              />
            ))}
          </div>
        )}
      </div>

      <NewDealDialog open={newDealOpen} onOpenChange={setNewDealOpen} />

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete engagement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete this engagement and all associated data. Are you sure?
          </p>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Yes, delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

interface DealCardProps {
  deal: Deal;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onNavigate: () => void;
  onDelete: () => void;
}

function DealCard({ deal, isMenuOpen, onMenuToggle, onMenuClose, onNavigate, onDelete }: DealCardProps) {
  return (
    <div
      className="group relative flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/40 transition-all duration-150"
      style={{ borderColor: 'hsl(214 60% 90%)' }}
    >
      {/* Color stripe */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ background: 'var(--gradient-cta)' }}
      />
      <button className="flex-1 text-left pl-2" onClick={onNavigate}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{deal.title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{deal.suburb} · {deal.geoSegment}</p>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'var(--blue-mist)', color: 'var(--blue-deep)' }}
            >
              {formatBudget(deal.budgetMin)} – {formatBudget(deal.budgetMax)}
            </span>
            <DealStatusBadge status={deal.status} />
          </div>
        </div>
        <div className="sm:hidden mt-1.5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatBudget(deal.budgetMin)} – {formatBudget(deal.budgetMax)}
          </span>
          <DealStatusBadge status={deal.status} />
        </div>
      </button>
      <div className="relative shrink-0">
        <button
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-tinted)] transition-colors"
          onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
        >
          <MoreHorizontal size={16} />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
            <button
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-tinted)] transition-colors"
              onClick={() => { onNavigate(); onMenuClose(); }}
            >
              View detail
            </button>
            <button
              className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/5 transition-colors"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}