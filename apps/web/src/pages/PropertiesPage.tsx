import { useMemo, useState, useEffect } from 'react'
import { MoreHorizontal, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/AppShell';
import { PropertyStatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { useAgentStore } from '@/stores/useAgentStore';
import type { OffMarketProperty } from '@/types';

const PROP_IMAGES = [
  'https://images.pexels.com/photos/5252546/pexels-photo-5252546.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/17875142/pexels-photo-17875142.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/22927128/pexels-photo-22927128.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

function formatBudget(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

export default function PropertiesPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchOffmarketproperties = usePropertyStore((s) => s.fetchOffmarketproperties);
  useEffect(() => {
    fetchOffmarketproperties();
  }, [fetchOffmarketproperties]);
  // === end auto fetch-on-mount ===

  const properties = usePropertyStore((s) => s.properties);
  const searchQuery = usePropertyStore((s) => s.searchQuery);
  const statusFilter = usePropertyStore((s) => s.statusFilter);
  const setSearchQuery = usePropertyStore((s) => s.setSearchQuery);
  const setStatusFilter = usePropertyStore((s) => s.setStatusFilter);
  const addProperty = usePropertyStore((s) => s.addProperty);
  const updateProperty = usePropertyStore((s) => s.updateProperty);
  const agents = useAgentStore((s) => s.agents);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editProp, setEditProp] = useState<OffMarketProperty | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form state
  const [streetAddress, setStreetAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const [priceGuide, setPriceGuide] = useState('');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('2');
  const [sourceAgentId, setSourceAgentId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OffMarketProperty['status']>('available');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return properties.filter((p) => {
      const matchQ = !q || p.streetAddress.toLowerCase().includes(q) || p.suburb.toLowerCase().includes(q);
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [properties, searchQuery, statusFilter]);

  function resetForm() {
    setStreetAddress(''); setSuburb(''); setPriceGuide(''); setBedrooms('3');
    setBathrooms('2'); setSourceAgentId(''); setNotes(''); setStatus('available');
    setFormErrors({});
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!streetAddress.trim()) errs.streetAddress = 'Street address is required.';
    if (!suburb.trim()) errs.suburb = 'Suburb is required.';
    if (!priceGuide) errs.priceGuide = 'Price guide is required.';
    if (!sourceAgentId) errs.sourceAgentId = 'Please select a source agent.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleAdd() {
    if (!validate()) return;
    addProperty({
      streetAddress: streetAddress.trim(),
      suburb: suburb.trim(),
      priceGuide: Number(priceGuide),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      sourceAgentId,
      notes: notes.trim(),
      status,
      attachments: [],
      priceHistory: [],
    });
    toast.success('Property added to database.');
    resetForm();
    setAddOpen(false);
  }

  function handleEditOpen(p: OffMarketProperty) {
    setEditProp(p);
    setStreetAddress(p.streetAddress);
    setSuburb(p.suburb);
    setPriceGuide(String(p.priceGuide));
    setBedrooms(String(p.bedrooms));
    setBathrooms(String(p.bathrooms));
    setSourceAgentId(p.sourceAgentId);
    setNotes(p.notes);
    setStatus(p.status);
    setOpenMenuId(null);
  }

  function handleEditSave() {
    if (!editProp) return;
    if (!validate()) return;
    updateProperty(editProp.id, {
      streetAddress: streetAddress.trim(),
      suburb: suburb.trim(),
      priceGuide: Number(priceGuide),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      sourceAgentId,
      notes: notes.trim(),
      status,
    });
    toast.success('Property updated.');
    setEditProp(null);
    resetForm();
  }

  function handleDelete(id: string) {
    updateProperty(id, { status: 'sold' });
    setDeleteId(null);
    toast.success('Property deleted.');
  }

  const formDialog = (
    <Dialog open={addOpen || !!editProp} onOpenChange={(v) => { if (!v) { setAddOpen(false); setEditProp(null); resetForm(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProp ? 'Edit Property' : 'Add Off-Market Property'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Street address</Label>
            <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="12 Ponsonby Road" />
            {formErrors.streetAddress && <p className="text-xs text-destructive">{formErrors.streetAddress}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Suburb</Label>
            <Input value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Ponsonby" />
            {formErrors.suburb && <p className="text-xs text-destructive">{formErrors.suburb}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Price guide ($)</Label>
            <Input type="number" value={priceGuide} onChange={(e) => setPriceGuide(e.target.value)} placeholder="1800000" />
            {formErrors.priceGuide && <p className="text-xs text-destructive">{formErrors.priceGuide}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bedrooms</Label>
              <Select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bathrooms</Label>
              <Select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Source agent</Label>
            <Select value={sourceAgentId} onChange={(e) => setSourceAgentId(e.target.value)}>
              <option value="">— Select agent —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.agency}</option>
              ))}
            </Select>
            {formErrors.sourceAgentId && <p className="text-xs text-destructive">{formErrors.sourceAgentId}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as OffMarketProperty['status'])}>
              <option value="available">Available</option>
              <option value="under-offer">Under Offer</option>
              <option value="sold">Sold</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this property…" rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild><Button variant="outline" onClick={resetForm}>Cancel</Button></DialogClose>
          <Button onClick={editProp ? handleEditSave : handleAdd}>
            {editProp ? 'Save changes' : 'Save property'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Off-Market Database</h1>
            <p className="text-sm text-muted-foreground mt-0.5">A global library of properties reusable across all engagements.</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>+ Add property</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by address or suburb…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[180px]">
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="under-offer">Under Offer</option>
            <option value="sold">Sold</option>
          </Select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 size={22} />}
            heading="Your off-market database is empty."
            description="Every property tip from your agent network belongs here — never lose a lead to a spreadsheet again."
            ctaLabel="+ Add first property"
            onCta={() => setAddOpen(true)}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, idx) => {
              const sourceAgent = agents.find((a) => a.id === p.sourceAgentId);
              const imgSrc = PROP_IMAGES[idx % PROP_IMAGES.length];
              return (
                <div key={p.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
                  <div className="relative h-40 overflow-hidden">
                    <img src={imgSrc} alt={p.streetAddress} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    <div className="absolute top-2 right-2">
                      <PropertyStatusBadge status={p.status} />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.streetAddress}</p>
                        <p className="text-xs text-muted-foreground">{p.suburb}</p>
                      </div>
                      <div className="relative shrink-0">
                        <button
                          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-tinted)]"
                          onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenuId === p.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-md border border-border bg-card shadow-[var(--shadow-elevated)]">
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-tinted)] transition-colors"
                              onClick={() => handleEditOpen(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/5 transition-colors"
                              onClick={() => { setDeleteId(p.id); setOpenMenuId(null); }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatBudget(p.priceGuide)}</span>
                      <span>{p.bedrooms}b · {p.bathrooms}ba</span>
                    </div>
                    {sourceAgent && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">Via {sourceAgent.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {formDialog}

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete property</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Are you sure you want to permanently delete this property from the database?</p>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Yes, delete permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}