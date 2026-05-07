import { cn } from '@/lib/utils';
import type { Deal, OffMarketProperty } from '@/types';

type DealStatus = Deal['status'];
type PropertyStatus = OffMarketProperty['status'];

const dealStatusConfig: Record<DealStatus, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-[var(--surface-tinted)] text-[var(--status-lead)] border border-[var(--status-lead)]/30' },
  active: { label: 'Active', className: 'bg-[var(--status-active)]/10 text-[var(--status-active)] border border-[var(--status-active)]/30' },
  'due-diligence': { label: 'Due Diligence', className: 'bg-[var(--gold-subtle)] text-[var(--gold-muted)] border border-[var(--gold-muted)]/30' },
  offer: { label: 'Offer', className: 'bg-[var(--status-offer)]/10 text-[var(--status-offer)] border border-[var(--status-offer)]/30' },
  won: { label: 'Won', className: 'bg-[var(--status-won)]/10 text-[var(--status-won)] border border-[var(--status-won)]/30' },
  lost: { label: 'Lost', className: 'bg-[var(--status-lost)]/10 text-[var(--status-lost)] border border-[var(--status-lost)]/30' },
};

const propertyStatusConfig: Record<PropertyStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-[var(--status-active)]/10 text-[var(--status-active)] border border-[var(--status-active)]/30' },
  'under-offer': { label: 'Under Offer', className: 'bg-[var(--gold-subtle)] text-[var(--gold-muted)] border border-[var(--gold-muted)]/30' },
  sold: { label: 'Sold', className: 'bg-[var(--status-lost)]/10 text-[var(--status-lost)] border border-[var(--status-lost)]/30' },
};

interface DealStatusBadgeProps {
  status: DealStatus;
}

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  const cfg = dealStatusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border whitespace-nowrap', cfg.className)}>
      {cfg.label}
    </span>
  );
}

interface PropertyStatusBadgeProps {
  status: PropertyStatus;
}

export function PropertyStatusBadge({ status }: PropertyStatusBadgeProps) {
  const cfg = propertyStatusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border whitespace-nowrap', cfg.className)}>
      {cfg.label}
    </span>
  );
}