import { useMemo, useState, useEffect } from 'react';
import { FileSearch, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useDDStore } from '@/stores/useDDStore';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { useDealStore } from '@/stores/useDealStore';
import type { DueDiligenceRecord } from '@/types';

function formatDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DueDiligencePage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchOffmarketproperties = usePropertyStore((s) => s.fetchOffmarketproperties);
  useEffect(() => {
    fetchOffmarketproperties();
  }, [fetchOffmarketproperties]);
  // === end auto fetch-on-mount ===

  const fetchOffmarketproperties = usePropertyStore((s) => s.fetchOffmarketproperties);
  useEffect(() => { fetchOffmarketproperties(); }, [fetchOffmarketproperties]);

  const navigate = useNavigate();
  const records = useDDStore((s) => s.records);
  const updateRecord = useDDStore((s) => s.updateRecord);
  const addComparableSale = useDDStore((s) => s.addComparableSale);
  const toggleChecklistItem = useDDStore((s) => s.toggleChecklistItem);
  const markReportGenerated = useDDStore((s) => s.markReportGenerated);
  const dealProperties = usePropertyStore((s) => s.dealProperties);
  const properties = usePropertyStore((s) => s.properties);
  const deals = useDealStore((s) => s.deals);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [addCompOpen, setAddCompOpen] = useState(false);

  const [compAddress, setCompAddress] = useState('');
  const [compPrice, setCompPrice] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compBeds, setCompBeds] = useState('3');
  const [compBaths, setCompBaths] = useState('2');
  const [compNotes, setCompNotes] = useState('');

  const [floodUrl, setFloodUrl] = useState('');
  const [hazardUrl, setHazardUrl] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');

  const selected = useMemo(() => records.find((r) => r.id === selectedId), [records, selectedId]);

  function getProperty(ddRecord: DueDiligenceRecord) {
    const dp = dealProperties.find((dp) => dp.id === ddRecord.dealPropertyId);
    if (!dp) return null;
    return properties.find((p) => p.id === dp.propertyId) ?? null;
  }

  function getDeal(ddRecord: DueDiligenceRecord) {
    const dp = dealProperties.find((dp) => dp.id === ddRecord.dealPropertyId);
    if (!dp) return null;
    return deals.find((d) => d.id === dp.dealId) ?? null;
  }

  const filtered = useMemo(() => {
    if (!searchQ) return records;
    const q = searchQ.toLowerCase();
    return records.filter((r) => {
      const prop = getProperty(r);
      const deal = getDeal(r);
      return (
        prop?.streetAddress.toLowerCase().includes(q) ||
        prop?.suburb.toLowerCase().includes(q) ||
        deal?.title.toLowerCase().includes(q)
      );
    });
  }, [records, searchQ, dealProperties, properties, deals]);

  function handleSelectRecord(id: string) {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    setSelectedId(id);
    setFloodUrl(r.floodMapUrl);
    setHazardUrl(r.naturalHazardsUrl);
    setSummaryNotes(r.summaryNotes);
  }

  function handleSaveFlood() {
    if (!selectedId) return;
    updateRecord(selectedId, { floodMapUrl: floodUrl });
    toast.success('Flood map link saved.');
  }

  function handleSaveHazard() {
    if (!selectedId) return;
    updateRecord(selectedId, { naturalHazardsUrl: hazardUrl });
    toast.success('Natural hazards link saved.');
  }

  function handleSaveSummary() {
    if (!selectedId) return;
    updateRecord(selectedId, { summaryNotes });
    toast.success('Summary notes saved.');
  }

  function handleAddComp() {
    if (!selectedId || !compAddress || !compPrice || !compDate) return;
    addComparableSale(selectedId, {
      address: compAddress, salePrice: Number(compPrice), saleDate: compDate,
      bedrooms: Number(compBeds), bathrooms: Number(compBaths), notes: compNotes,
    });
    setCompAddress(''); setCompPrice(''); setCompDate(''); setCompBeds('3'); setCompBaths('2'); setCompNotes('');
    setAddCompOpen(false);
    toast.success('Comparable sale added.');
  }

  function handleGenerateReport() {
    if (!selected) return;
    if (selected.comparableSales.length < 5) {
      toast.warning('Add at least 5 comparable sales before generating the report.');
      return;
    }
    markReportGenerated(selected.id);
    toast.success('Due diligence report generated.');
  }

  const completedItems = selected ? selected.checklistItems.filter((i) => i.completed).length : 0;
  const totalItems = selected ? selected.checklistItems.length : 0;

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div
          className="rounded-2xl p-6 flex items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, hsl(210,82%,28%) 0%, hsl(200,88%,48%) 100%)', boxShadow: '0 4px 20px hsl(210 80% 36% / 0.28)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(200 85% 78%)' }}>
              Risk Assessment
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(0 0% 100%)' }}>Due Diligence</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(205 65% 80%)' }}>
              DD records are tied to shortlisted properties within engagements.
            </p>
          </div>
          <div className="relative max-w-xs">
            <Input
              placeholder="Search by address or engagement…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="border-0"
              style={{ background: 'hsl(0 0% 100% / 0.15)', color: 'hsl(0 0% 100%)', '--tw-placeholder-color': 'hsl(210 60% 80%)' } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── DD record list ── */}
          <div className="lg:col-span-1 space-y-2">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<FileSearch size={22} />}
                heading="No due diligence records yet."
                description="DD records are created when you shortlist a property within an engagement."
                ctaLabel="Go to Engagements"
                onCta={() => navigate('/deals')}
              />
            ) : (
              filtered.map((r) => {
                const prop = getProperty(r);
                const deal = getDeal(r);
                const checkedPct = r.checklistItems.length > 0
                  ? (r.checklistItems.filter((i) => i.completed).length / r.checklistItems.length) * 100
                  : 0;
                return (
                  <button
                    key={r.id}
                    className="w-full text-left rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all duration-150"
                    style={{
                      borderColor: selectedId === r.id ? 'hsl(214 70% 60%)' : 'hsl(214 60% 90%)',
                      boxShadow: selectedId === r.id ? '0 0 0 2px hsl(214 70% 70% / 0.30)' : undefined,
                    }}
                    onClick={() => handleSelectRecord(r.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--gradient-cta)' }}
                      >
                        <FileSearch size={14} style={{ color: 'hsl(0 0% 100%)' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{prop?.streetAddress ?? 'Unknown property'}</p>
                        <p className="text-xs text-muted-foreground truncate">{deal?.title ?? 'Unknown engagement'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={checkedPct} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground shrink-0">{r.comparableSales.length} comps</span>
                      {r.reportGeneratedAt && (
                        <span
                          className="rounded-lg px-2 py-0.5 text-xs font-semibold shrink-0"
                          style={{ background: 'hsl(142 55% 40% / 0.12)', color: 'hsl(142 50% 30%)' }}
                        >
                          Report ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* ── DD detail panel ── */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{ borderColor: 'hsl(214 60% 90%)', background: 'var(--blue-frost)' }}
              >
                <FileSearch size={32} className="mx-auto mb-3 opacity-30 text-primary" />
                <p className="text-sm text-muted-foreground">Select a DD record to view details.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Hazard maps */}
                <div
                  className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]"
                  style={{ borderColor: 'hsl(214 60% 90%)' }}
                >
                  <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: 'var(--blue-mist)', color: 'var(--blue-core)' }}
                    >
                      🌊
                    </span>
                    Hazard Map Links
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Flood map URL</Label>
                        <Input
                          value={floodUrl}
                          onChange={(e) => setFloodUrl(e.target.value)}
                          placeholder="https://gis.aucklandcouncil.govt.nz/…"
                          className="text-xs h-9"
                        />
                        {!selected.floodMapUrl && (
                          <p className="text-xs" style={{ color: 'var(--gold-muted)' }}>Flood map link not yet recorded.</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="self-end h-9 shrink-0" onClick={handleSaveFlood}>Save</Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Natural hazards URL</Label>
                        <Input value={hazardUrl} onChange={(e) => setHazardUrl(e.target.value)} placeholder="https://…" className="text-xs h-9" />
                      </div>
                      <Button size="sm" variant="outline" className="self-end h-9 shrink-0" onClick={handleSaveHazard}>Save</Button>
                    </div>
                  </div>
                </div>

                {/* Comparable sales */}
                <div
                  className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]"
                  style={{ borderColor: 'hsl(214 60% 90%)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-foreground">
                      Comparable Sales
                      <span
                        className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: 'var(--blue-mist)', color: 'var(--blue-core)' }}
                      >
                        {selected.comparableSales.length}
                      </span>
                    </p>
                    <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={() => setAddCompOpen(true)}>
                      <Plus size={12} className="mr-1" /> Add comp
                    </Button>
                  </div>
                  {selected.comparableSales.length < 5 && (
                    <div className="mb-4 rounded-xl px-4 py-2.5 text-xs" style={{ background: 'hsl(39 80% 52% / 0.10)', color: 'hsl(39 70% 38%)' }}>
                      Add at least 5 comparable sales before generating the report. ({selected.comparableSales.length}/5 added)
                    </div>
                  )}
                  {selected.comparableSales.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No comparable sales recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ borderBottom: '1px solid hsl(214 50% 92%)' }}>
                            <th className="text-left py-2 pr-4 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Address</th>
                            <th className="text-left py-2 pr-4 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Price</th>
                            <th className="text-left py-2 pr-4 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Date</th>
                            <th className="text-left py-2 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Spec</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.comparableSales.map((c, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid hsl(214 50% 95%)' }}>
                              <td className="py-2.5 pr-4 text-foreground font-medium">{c.address}</td>
                              <td className="py-2.5 pr-4 font-bold" style={{ color: 'var(--blue-core)' }}>${c.salePrice.toLocaleString()}</td>
                              <td className="py-2.5 pr-4 text-muted-foreground">{c.saleDate}</td>
                              <td className="py-2.5 text-muted-foreground">{c.bedrooms}b{c.bathrooms}ba</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                {selected.checklistItems.length > 0 && (
                  <div
                    className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]"
                    style={{ borderColor: 'hsl(214 60% 90%)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-foreground">DD Checklist</p>
                      <span className="text-sm font-bold text-primary">{completedItems}/{totalItems}</span>
                    </div>
                    <Progress value={(completedItems / Math.max(totalItems, 1)) * 100} className="mb-4 h-2" />
                    <div className="space-y-2">
                      {selected.checklistItems.map((item, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[var(--blue-frost)] transition-colors">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(selected.id, i)}
                            className="rounded border-border accent-primary"
                          />
                          <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.item}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary notes */}
                <div
                  className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]"
                  style={{ borderColor: 'hsl(214 60% 90%)' }}
                >
                  <p className="text-sm font-bold text-foreground mb-3">Summary Notes</p>
                  <Textarea value={summaryNotes} onChange={(e) => setSummaryNotes(e.target.value)} rows={3} placeholder="Internal notes about this property's due diligence…" />
                  <Button size="sm" variant="outline" className="mt-3 h-8 text-xs" onClick={handleSaveSummary}>Save notes</Button>
                </div>

                {/* Generate report */}
                <div
                  className="flex items-center justify-between rounded-2xl border bg-card p-5"
                  style={{ borderColor: selected.reportGeneratedAt ? 'hsl(142 50% 70%)' : 'hsl(214 60% 90%)' }}
                >
                  {selected.reportGeneratedAt ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center"
                        style={{ background: 'hsl(142 55% 40% / 0.12)' }}
                      >
                        <Check size={16} style={{ color: 'hsl(142 55% 38%)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Report generated</p>
                        <p className="text-xs text-muted-foreground">{formatDate(selected.reportGeneratedAt)}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-foreground">Ready to generate?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Requires 5+ comparable sales.</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={handleGenerateReport}
                    disabled={!!selected.reportGeneratedAt}
                    className="btn-gradient border-0"
                  >
                    Generate DD report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add comparable sale dialog */}
      <Dialog open={addCompOpen} onOpenChange={setAddCompOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Comparable Sale</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={compAddress} onChange={(e) => setCompAddress(e.target.value)} placeholder="14 Example Street, Ponsonby" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sale price ($)</Label>
                <Input type="number" value={compPrice} onChange={(e) => setCompPrice(e.target.value)} placeholder="1750000" />
              </div>
              <div className="space-y-1.5">
                <Label>Sale date</Label>
                <Input type="date" value={compDate} onChange={(e) => setCompDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bedrooms</Label>
                <Input type="number" value={compBeds} onChange={(e) => setCompBeds(e.target.value)} min={1} />
              </div>
              <div className="space-y-1.5">
                <Label>Bathrooms</Label>
                <Input type="number" value={compBaths} onChange={(e) => setCompBaths(e.target.value)} min={1} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={compNotes} onChange={(e) => setCompNotes(e.target.value)} rows={2} placeholder="Any notes about this sale…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAddComp} disabled={!compAddress || !compPrice || !compDate}>Add comparable sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}