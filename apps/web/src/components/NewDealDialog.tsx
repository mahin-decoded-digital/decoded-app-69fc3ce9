import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useDealStore } from '@/stores/useDealStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Deal } from '@/types';

interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillDealId?: string;
}

export function NewDealDialog({ open, onOpenChange }: NewDealDialogProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const addDeal = useDealStore((s) => s.addDeal);

  const [title, setTitle] = useState('');
  const [suburb, setSuburb] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [geoSegment, setGeoSegment] = useState<Deal['geoSegment']>('Central');
  const [brief, setBrief] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setTitle(''); setSuburb(''); setBudgetMin(''); setBudgetMax('');
    setBedrooms('2'); setBathrooms('1'); setGeoSegment('Central'); setBrief('');
    setErrors({});
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Required field.';
    if (!suburb.trim()) errs.suburb = 'Required field.';
    const min = Number(budgetMin);
    const max = Number(budgetMax);
    if (!budgetMin) errs.budgetMin = 'Required field.';
    if (!budgetMax) errs.budgetMax = 'Required field.';
    if (budgetMin && budgetMax && max <= min) errs.budgetMax = 'Maximum must exceed minimum.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const dealInput: Omit<Deal, 'id' | 'createdAt'> = {
      title: title.trim(),
      suburb: suburb.trim(),
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      geoSegment,
      brief: brief.trim(),
      status: 'lead',
      clientId: currentUser?.id ?? '',
      agentId: currentUser?.id ?? '',
      aiConsentGiven: false,
      agreementStatus: 'none',
      invoiceStatus: 'none',
    };
    addDeal(dealInput);
    toast.success('Engagement created.');
    reset();
    onOpenChange(false);
    const allDeals = useDealStore.getState().deals;
    const newest = allDeals[0];
    if (newest) navigate(`/deals/${newest.id}`);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Engagement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="new-deal-form" className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="deal-title">Client / Engagement name</Label>
            <Input
              id="deal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smith Family — Ponsonby Search"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-suburb">Preferred suburb</Label>
            <Input
              id="deal-suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder="e.g. Ponsonby"
            />
            {errors.suburb && <p className="text-xs text-destructive">{errors.suburb}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="budget-min">Budget min ($)</Label>
              <Input
                id="budget-min"
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="1500000"
              />
              {errors.budgetMin && <p className="text-xs text-destructive">{errors.budgetMin}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-max">Budget max ($)</Label>
              <Input
                id="budget-max"
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="2000000"
              />
              {errors.budgetMax && <p className="text-xs text-destructive">{errors.budgetMax}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deal-beds">Bedrooms</Label>
              <Select id="deal-beds" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-baths">Bathrooms</Label>
              <Select id="deal-baths" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="geo-segment">Geo segment</Label>
            <Select id="geo-segment" value={geoSegment} onChange={(e) => setGeoSegment(e.target.value as Deal['geoSegment'])}>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="North">North</option>
              <option value="Central">Central</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deal-brief">Client brief</Label>
            <Textarea
              id="deal-brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the client's property requirements, lifestyle preferences, and must-haves…"
              rows={3}
            />
          </div>
        </form>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="new-deal-form">Create engagement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
