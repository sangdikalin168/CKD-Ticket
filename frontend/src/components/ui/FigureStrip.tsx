import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface Figure {
  label: string;
  /** Already formatted — money through formatMoney, counts through formatCount. */
  value: string;
  /** A second line under the figure: a count, a comparison, a scope. */
  meta?: ReactNode;
  tone?: 'default' | 'paid' | 'void' | 'muted';
}

const COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-3 lg:grid-cols-5',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
};

const TONE: Record<NonNullable<Figure['tone']>, string> = {
  default: 'text-ink',
  paid: 'text-paid-deep',
  void: 'text-void-deep',
  muted: 'text-ink-soft',
};

/**
 * A compact strip of figures — one white bar ruled into cells by hairline
 * gaps, each holding a tabular figure with its label on the same baseline.
 * This is the system's answer to a grid of same-size stat cards, ported from
 * CKD-POS: a page that wants four numbers gets one bar with four cells.
 */
export function FigureStrip({
  items,
  loading = false,
  className,
  ...props
}: HTMLAttributes<HTMLDListElement> & { items: Figure[]; loading?: boolean }) {
  const cols = COLS[Math.min(6, Math.max(1, items.length))];
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule',
        cols,
        className
      )}
      {...props}
    >
      {items.map((f, i) => (
        <div key={i} className="min-w-0 bg-card px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <dd className={cn('figure text-2xl font-semibold leading-tight', TONE[f.tone ?? 'default'])}>
                {f.value}
              </dd>
            )}
            <dt className="truncate text-sm text-ink-soft">{f.label}</dt>
          </div>
          {f.meta && <div className="mt-1 text-caption text-ink-soft">{f.meta}</div>}
        </div>
      ))}
    </dl>
  );
}

export default FigureStrip;
