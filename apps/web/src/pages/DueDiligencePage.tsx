import { useMemo, useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge';
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

  // Comparable sale form
  const [compAddress, setCompAddress] = useState('');
  const [compPrice, setCompPrice] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compBeds, setCompBeds] = useState('3');
  const [compBaths, setCompBaths] = useState('2');
  const [compNotes, setCompNotes] = useState('');

  // DD record inline edit fields
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
      address: compAddress,
      salePrice: Number(compPrice),
      saleDate: compDate,
      bedrooms: Number(compBeds),
      bathrooms: Number(compBaths),
      notes: compNotes,
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Due Diligence</h1>
            <p className="text-sm text-muted-foreground mt-0.5">DD records are tied to shortlisted properties within engagements.</p>
          </div>
          <Input
            placeholder="Search by address or engagement…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* DD record list */}
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
                    className={`w-full text-left rounded-lg border bg-card p-3 shadow-[var(--shadow-card)] hover:border-primary/40 transition-colors ${selectedId === r.id ? 'border-primary' : 'border-border'}`}
                    onClick={() => handleSelectRecord(r.id)}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{prop?.streetAddress ?? 'Unknown property'}</p>
                    <p className="text-xs text-muted-foreground truncate">{deal?.title ?? 'Unknown engagement'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={checkedPct} className="flex-1 h-1.5" />
                      <span className="text-xs text-muted-foreground">{r.comparableSales.length} comps</span>
                      {r.reportGeneratedAt && (
                        <Badge variant="default" className="text-xs">Report</Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* DD detail panel */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Select a DD record to view details.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-semibold text-foreground mb-3">Hazard Map Links</p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Flood map URL</Label>
                        <Input
                          value={floodUrl}
                          onChange={(e) => setFloodUrl(e.target.value)}
                          placeholder="https://gis.aucklandcouncil.govt.nz/…"
                          className="text-xs h-8"
                        />
                        {!selected.floodMapUrl && (
                          <p className="text-xs text-[var(--gold-muted)]">Flood map link not yet recorded.</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="self-end h-8" onClick={handleSaveFlood}>Save link</Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Natural hazards URL</Label>
                        <Input
                          value={hazardUrl}
                          onChange={(e) => setHazardUrl(e.target.value)}
                          placeholder="https://…"
                          className="text-xs h-8"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="self-end h-8" onClick={handleSaveHazard}>Save link</Button>
                    </div>
                  </div>
                </div>

                {/* Comparable sales */}
                <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">Comparable Sales ({selected.comparableSales.length})</p>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => setAddCompOpen(true)}>
                      <Plus size={12} className="mr-1" /> Add comparable sale
                    </Button>
                  </div>
                  {selected.comparableSales.length < 5 && (
                    <div className="mb-3 rounded-md bg-[var(--gold-subtle)] px-3 py-2 text-xs text-[var(--gold-muted)]">
                      Add at least 5 comparable sales before generating the report. ({selected.comparableSales.length}/5 added)
                    </div>
                  )}
                  {selected.comparableSales.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No comparable sales recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">Address</th>
                            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">Price</th>
                            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground">Date</th>
                            <th className="text-left py-1.5 font-medium text-muted-foreground">Beds/Baths</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.comparableSales.map((c, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              <td className="py-2 pr-3 text-foreground">{c.address}</td>
                              <td className="py-2 pr-3">${c.salePrice.toLocaleString()}</td>
                              <td className="py-2 pr-3 text-muted-foreground">{c.saleDate}</td>
                              <td className="py-2">{c.bedrooms}b{c.bathrooms}ba</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                {selected.checklistItems.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-foreground">Checklist</p>
                      <span className="text-xs text-muted-foreground">{completedItems}/{totalItems}</span>
                    </div>
                    <Progress value={(completedItems / Math.max(totalItems, 1)) * 100} className="mb-3" />
                    <div className="space-y-2">
                      {selected.checklistItems.map((item, i) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(selected.id, i)}
                            className="rounded border-border"
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
                <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-semibold text-foreground mb-2">Summary Notes</p>
                  <Textarea value={summaryNotes} onChange={(e) => setSummaryNotes(e.target.value)} rows={3} placeholder="Internal notes about this property's due diligence…" />
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={handleSaveSummary}>Save notes</Button>
                </div>

                {/* Generate report */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  {selected.reportGeneratedAt ? (
                    <div className="flex items-center gap-2">
                      <Check size={15} className="text-[var(--status-active)]" />
                      <span className="text-sm text-foreground">Report generated {formatDate(selected.reportGeneratedAt)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Report not yet generated</span>
                  )}
                  <Button size="sm" onClick={handleGenerateReport} disabled={!!selected.reportGeneratedAt}>
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