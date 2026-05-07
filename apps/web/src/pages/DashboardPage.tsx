import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import {Building2, Users, Rocket, FileSearch, ArrowRight, Plus} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { DealStatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDealStore } from '@/stores/useDealStore';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { useAgentStore } from '@/stores/useAgentStore';
import { useDDStore } from '@/stores/useDDStore';
import { NewDealDialog } from '@/components/NewDealDialog';

export default function DashboardPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchOffmarketproperties = usePropertyStore((s) => s.fetchOffmarketproperties);
  useEffect(() => {
    fetchOffmarketproperties();
  }, [fetchOffmarketproperties]);
  // === end auto fetch-on-mount ===

  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const deals = useDealStore((s) => s.deals);
  const properties = usePropertyStore((s) => s.properties);
  const agents = useAgentStore((s) => s.agents);
  const ddRecords = useDDStore((s) => s.records);

  const [newDealOpen, setNewDealOpen] = useState(false);

  const activeDeals = useMemo(
    () => deals.filter((d) => d.status === 'active' || d.status === 'due-diligence' || d.status === 'offer'),
    [deals]
  );
  const ddDeals = useMemo(() => deals.filter((d) => d.status === 'due-diligence'), [deals]);
  const recentDeals = useMemo(
    () => [...deals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [deals]
  );

  const metrics = [
    { label: 'Active Engagements', value: activeDeals.length, icon: Users, color: 'text-primary' },
    { label: 'Off-Market Properties', value: properties.length, icon: Building2, color: 'text-primary' },
    { label: 'Agent Rocket', value: agents.length, icon: Rocket, color: 'text-primary' },
    { label: 'In Due Diligence', value: ddDeals.length, icon: FileSearch, color: 'text-[var(--gold-muted)]' },
  ];

  // ddRecords used for metric count (suppress unused warning)
  void ddRecords;

  const greeting = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Good morning, {greeting}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Here's what's on your desk today.</p>
          </div>
          <Button onClick={() => setNewDealOpen(true)} size="sm">
            <Plus size={14} className="mr-1.5" />
            + New engagement
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <Card key={m.label} className="shadow-[var(--shadow-card)]">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</span>
                  <m.icon size={15} className={m.color} />
                </div>
                <p className="text-3xl font-bold text-foreground">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions + Recent deals */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Actions</h2>
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground hover:bg-[var(--surface-tinted)] transition-colors text-left"
                onClick={() => setNewDealOpen(true)}
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Users size={14} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">New engagement</p>
                  <p className="text-xs text-muted-foreground">Create a client brief</p>
                </div>
                <ArrowRight size={14} className="ml-auto text-muted-foreground" />
              </button>
              <button
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground hover:bg-[var(--surface-tinted)] transition-colors text-left"
                onClick={() => navigate('/properties')}
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building2 size={14} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">Add property</p>
                  <p className="text-xs text-muted-foreground">Expand the off-market database</p>
                </div>
                <ArrowRight size={14} className="ml-auto text-muted-foreground" />
              </button>
              <button
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground hover:bg-[var(--surface-tinted)] transition-colors text-left"
                onClick={() => navigate('/agents')}
              >
                <div className="h-8 w-8 rounded-md bg-[var(--gold-subtle)] flex items-center justify-center">
                  <Rocket size={14} className="text-[var(--gold-muted)]" />
                </div>
                <div>
                  <p className="font-medium">Send requirement blast</p>
                  <p className="text-xs text-muted-foreground">Reach your agent network</p>
                </div>
                <ArrowRight size={14} className="ml-auto text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Recent deals */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Recent Engagements</h2>
              <button className="text-xs text-primary hover:underline" onClick={() => navigate('/deals')}>
                View all
              </button>
            </div>
            <Card className="shadow-[var(--shadow-card)]">
              {recentDeals.length === 0 ? (
                <EmptyState
                  heading="Your workspace is ready."
                  description="Start by creating your first client engagement — everything flows from there."
                  ctaLabel="Create first engagement"
                  onCta={() => setNewDealOpen(true)}
                />
              ) : (
                <div className="divide-y divide-border">
                  {recentDeals.map((deal) => (
                    <button
                      key={deal.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-subtle)] transition-colors text-left"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{deal.suburb}</p>
                      </div>
                      <DealStatusBadge status={deal.status} />
                      <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Dashboard hero image — uses dashboard-hero slot */}
        <div className="rounded-xl overflow-hidden h-48 relative">
          <img
            src="https://images.pexels.com/photos/20297143/pexels-photo-20297143.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Modern premium interior"
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink-deep)]/60 to-transparent flex items-end p-6">
            <div>
              <p className="text-primary-foreground font-semibold text-lg">Auckland's finest off-market properties</p>
              <p className="text-primary-foreground/70 text-sm">Exclusively managed by Martelli Buyers</p>
            </div>
          </div>
        </div>
      </div>

      <NewDealDialog open={newDealOpen} onOpenChange={setNewDealOpen} />
    </AppShell>
  );
}