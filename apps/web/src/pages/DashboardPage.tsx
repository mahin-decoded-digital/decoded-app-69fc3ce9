import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Rocket, FileSearch, ArrowRight, Plus, TrendingUp, Zap } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { DealStatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDealStore } from '@/stores/useDealStore';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { useAgentStore } from '@/stores/useAgentStore';
import { useDDStore } from '@/stores/useDDStore';
import { NewDealDialog } from '@/components/NewDealDialog';

export default function DashboardPage() {
  const fetchOffmarketproperties = usePropertyStore((s) => s.fetchOffmarketproperties);
  useEffect(() => {
    fetchOffmarketproperties();
  }, [fetchOffmarketproperties]);

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

  void ddRecords;

  const greeting = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';

  const metrics = [
    {
      label: 'Active Engagements',
      value: activeDeals.length,
      icon: Users,
      gradient: 'linear-gradient(135deg, hsl(222, 84%, 16%) 0%, hsl(218, 72%, 30%) 100%)',
      glow: '0 4px 20px hsl(222 80% 20% / 0.40)',
      textColor: 'hsl(210 85% 72%)',
      subColor: 'hsl(215 40% 60%)',
    },
    {
      label: 'Off-Market Properties',
      value: properties.length,
      icon: Building2,
      gradient: 'linear-gradient(135deg, hsl(214, 72%, 32%) 0%, hsl(210, 85%, 50%) 100%)',
      glow: '0 4px 20px hsl(214 72% 40% / 0.40)',
      textColor: 'hsl(205 90% 80%)',
      subColor: 'hsl(210 55% 65%)',
    },
    {
      label: 'Agent Network',
      value: agents.length,
      icon: Rocket,
      gradient: 'linear-gradient(135deg, hsl(210, 80%, 40%) 0%, hsl(200, 90%, 58%) 100%)',
      glow: '0 4px 20px hsl(210 80% 48% / 0.40)',
      textColor: 'hsl(200 90% 85%)',
      subColor: 'hsl(205 60% 70%)',
    },
    {
      label: 'In Due Diligence',
      value: ddDeals.length,
      icon: FileSearch,
      gradient: 'linear-gradient(135deg, hsl(200, 88%, 36%) 0%, hsl(190, 90%, 52%) 100%)',
      glow: '0 4px 20px hsl(200 88% 44% / 0.40)',
      textColor: 'hsl(190 90% 85%)',
      subColor: 'hsl(196 60% 70%)',
    },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Martelli Connect
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Good morning, {greeting} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's what's on your desk today.
            </p>
          </div>
          <button
            onClick={() => setNewDealOpen(true)}
            className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            <Plus size={15} />
            New engagement
          </button>
        </div>

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: m.gradient, boxShadow: m.glow }}
            >
              {/* Decorative circle */}
              <div
                className="absolute -top-5 -right-5 h-20 w-20 rounded-full opacity-20"
                style={{ background: 'hsl(0 0% 100% / 0.15)' }}
              />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: m.subColor }}>
                  {m.label}
                </span>
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'hsl(0 0% 100% / 0.15)' }}
                >
                  <m.icon size={15} style={{ color: m.textColor }} />
                </div>
              </div>
              <p className="text-4xl font-bold relative z-10" style={{ color: m.textColor }}>
                {m.value}
              </p>
              <div
                className="mt-2 flex items-center gap-1 text-xs relative z-10"
                style={{ color: m.subColor }}
              >
                <TrendingUp size={11} />
                <span>All time</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick actions + Recent deals ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-sm text-foreground hover:border-primary/40 hover:bg-[var(--blue-mist)] transition-all duration-150 text-left group"
                onClick={() => setNewDealOpen(true)}
                style={{ borderColor: 'hsl(214 60% 88%)' }}
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--gradient-cta)', boxShadow: 'var(--shadow-cta)' }}
                >
                  <Users size={15} style={{ color: 'hsl(0 0% 100%)' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">New engagement</p>
                  <p className="text-xs text-muted-foreground">Create a client brief</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              <button
                className="w-full flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-sm text-foreground hover:border-primary/40 hover:bg-[var(--blue-mist)] transition-all duration-150 text-left group"
                onClick={() => navigate('/properties')}
                style={{ borderColor: 'hsl(214 60% 88%)' }}
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, hsl(214,72%,42%) 0%, hsl(205,85%,56%) 100%)' }}
                >
                  <Building2 size={15} style={{ color: 'hsl(0 0% 100%)' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Add property</p>
                  <p className="text-xs text-muted-foreground">Expand the off-market database</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              <button
                className="w-full flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-sm text-foreground hover:border-primary/40 hover:bg-[var(--blue-mist)] transition-all duration-150 text-left group"
                onClick={() => navigate('/agents')}
                style={{ borderColor: 'hsl(214 60% 88%)' }}
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, hsl(200,88%,40%) 0%, hsl(190,90%,54%) 100%)' }}
                >
                  <Rocket size={15} style={{ color: 'hsl(0 0% 100%)' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Send requirement blast</p>
                  <p className="text-xs text-muted-foreground">Reach your agent network</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          {/* Recent deals */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Recent Engagements</h2>
              <button
                className="text-xs font-semibold text-primary hover:text-[var(--blue-deep)] transition-colors flex items-center gap-1"
                onClick={() => navigate('/deals')}
              >
                View all <ArrowRight size={11} />
              </button>
            </div>
            <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)] overflow-hidden" style={{ borderColor: 'hsl(214 60% 88%)' }}>
              {recentDeals.length === 0 ? (
                <EmptyState
                  heading="Your workspace is ready."
                  description="Start by creating your first client engagement — everything flows from there."
                  ctaLabel="Create first engagement"
                  onCta={() => setNewDealOpen(true)}
                />
              ) : (
                <div className="divide-y" style={{ borderColor: 'hsl(214 50% 92%)' }}>
                  {recentDeals.map((deal) => (
                    <button
                      key={deal.id}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--blue-frost)] transition-colors text-left"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{
                          background: 'var(--gradient-cta)',
                          color: 'hsl(0 0% 100%)',
                          opacity: 0.85,
                        }}
                      >
                        {deal.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{deal.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{deal.suburb}</p>
                      </div>
                      <DealStatusBadge status={deal.status} />
                      <ArrowRight size={13} className="text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Hero banner ── */}
        <div className="rounded-2xl overflow-hidden h-52 relative">
          <img
            src="https://images.pexels.com/photos/20297143/pexels-photo-20297143.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Modern premium interior"
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          <div
            className="absolute inset-0 flex items-end p-7"
            style={{ background: 'linear-gradient(90deg, var(--blue-midnight) 0%, hsl(210 85% 38% / 0.7) 60%, transparent 100%)' }}
          >
            <div>
              <p className="font-bold text-xl" style={{ color: 'hsl(0 0% 100%)' }}>
                Auckland's finest off-market properties
              </p>
              <p className="text-sm mt-1" style={{ color: 'hsl(210 80% 80%)' }}>
                Exclusively managed by Martelli Buyers
              </p>
            </div>
          </div>
        </div>
      </div>

      <NewDealDialog open={newDealOpen} onOpenChange={setNewDealOpen} />
    </AppShell>
  );
}