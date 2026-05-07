import { cn } from '@/lib/utils';
import type { Deal, OffMarketProperty } from '@/types';

type DealStatus = Deal['status'];
type PropertyStatus = OffMarketProperty['status'];

const dealStatusConfig: Record<DealStatus, { label: string; bg: string; color: string }> = {
  lead:           { label: 'Lead',           bg: 'hsl(214 65% 52% / 0.12)', color: 'hsl(214 65% 38%)' },
  active:         { label: 'Active',         bg: 'hsl(150 55% 42% / 0.12)', color: 'hsl(150 55% 30%)' },
  'due-diligence':{ label: 'Due Diligence',  bg: 'hsl(39 80% 52% / 0.14)',  color: 'hsl(39 70% 36%)' },
  offer:          { label: 'Offer',          bg: 'hsl(280 50% 55% / 0.12)', color: 'hsl(280 50% 38%)' },
  won:            { label: 'Won',            bg: 'hsl(142 60% 40% / 0.12)', color: 'hsl(142 55% 28%)' },
  lost:           { label: 'Lost',           bg: 'hsl(0 55% 52% / 0.10)',   color: 'hsl(0 55% 40%)' },
};

const propertyStatusConfig: Record<PropertyStatus, { label: string; bg: string; color: string }> = {
  available:     { label: 'Available',     bg: 'hsl(150 55% 42% / 0.12)', color: 'hsl(150 55% 30%)' },
  'under-offer': { label: 'Under Offer',   bg: 'hsl(39 80% 52% / 0.14)',  color: 'hsl(39 70% 36%)' },
  sold:          { label: 'Sold',          bg: 'hsl(0 55% 52% / 0.10)',   color: 'hsl(0 55% 40%)' },
};

interface DealStatusBadgeProps { status: DealStatus; }

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  const cfg = dealStatusConfig[status] || { label: status, bg: 'hsl(214 40% 90%)', color: 'hsl(214 40% 40%)' };
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

interface PropertyStatusBadgeProps { status: PropertyStatus; }

export function PropertyStatusBadge({ status }: PropertyStatusBadgeProps) {
  const cfg = propertyStatusConfig[status] || { label: status, bg: 'hsl(214 40% 90%)', color: 'hsl(214 40% 40%)' };
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// Generic inline badge used in other contexts
interface StatusBadgeProps { label: string; variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'default'; }

export function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  const map = {
    blue:    { bg: 'hsl(214 65% 52% / 0.12)', color: 'hsl(214 65% 38%)' },
    green:   { bg: 'hsl(142 55% 42% / 0.12)', color: 'hsl(142 55% 30%)' },
    amber:   { bg: 'hsl(39 80% 52% / 0.14)',  color: 'hsl(39 70% 36%)' },
    red:     { bg: 'hsl(0 55% 52% / 0.10)',   color: 'hsl(0 55% 40%)' },
    purple:  { bg: 'hsl(280 50% 55% / 0.12)', color: 'hsl(280 50% 38%)' },
    default: { bg: 'hsl(214 40% 92%)',        color: 'hsl(214 55% 38%)' },
  };
  const style = map[variant];
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}