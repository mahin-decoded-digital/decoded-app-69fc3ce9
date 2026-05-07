import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function EmptyState({ icon, heading, description, ctaLabel, onCta, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl', className)}
      style={{ background: 'var(--blue-frost)', border: '1px dashed hsl(214 60% 84%)' }}
    >
      {icon && (
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--gradient-cta)', boxShadow: 'var(--shadow-cta)' }}
        >
          <span style={{ color: 'hsl(0 0% 100%)', opacity: 0.95 }}>{icon}</span>
        </div>
      )}
      <h3 className="text-base font-bold text-foreground mb-2">{heading}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="btn-gradient mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}