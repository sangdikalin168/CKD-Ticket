import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * The one chip. Record state renders through this and nothing else: a tint
 * ground with the mark's deep text, fully round, caption type, flat. `muted`
 * carries a label that is not a state (an age group, a count, a tag); `ink`
 * is the one solid emphasis chip.
 *
 * Ported from CKD-POS's `Chip` with the same four marks and the same roles, so
 * a paid sale looks the same at the till and at the counter.
 */
export type ChipTone = 'paid' | 'pending' | 'void' | 'notice' | 'muted' | 'ink';

const TONES: Record<ChipTone, string> = {
  paid: 'bg-paid-tint text-paid-deep',
  pending: 'bg-pending-tint text-pending-deep',
  void: 'bg-void-tint text-void-deep',
  notice: 'bg-notice-tint text-notice-deep',
  muted: 'bg-wash text-ink-soft',
  ink: 'bg-ink text-chalk',
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  /** Route the label through the tabular figure treatment. */
  mono?: boolean;
}

export function Chip({ tone = 'muted', mono = false, className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-medium',
        TONES[tone],
        mono && 'figure',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Map the status strings the backend writes — the v1 "Pending"/"Approved"
 * spelling and the v2 upper-case one — onto one of the four marks. A state
 * this app does not know reads as informational rather than inventing a fifth
 * colour.
 */
export function statusTone(status?: string | null): ChipTone {
  const s = (status ?? '').toUpperCase();
  if (s === 'APPROVED' || s === 'PROCESSED' || s === 'DONE' || s === 'ACTIVE' || s === 'PAID') return 'paid';
  if (s === 'PENDING' || s === 'WAITING' || s === 'CHECKED') return 'pending';
  if (s === 'REJECTED' || s === 'EXPIRED' || s === 'FAILED') return 'void';
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'INACTIVE' || s === '') return 'muted';
  return 'notice';
}

const DOT: Record<ChipTone, string> = {
  paid: 'bg-paid',
  pending: 'bg-pending',
  void: 'bg-void',
  notice: 'bg-notice',
  muted: 'bg-rule',
  ink: 'bg-ink',
};

/**
 * A flat state dot, for a list of steps or samples where a chip's label would
 * repeat what the line already says. Solid colour, no highlight, no shadow —
 * the thing it replaced was a moulded disc, and that world is gone.
 */
export function StateDot({
  tone = 'muted',
  size = 8,
  className,
  title,
}: {
  tone?: ChipTone;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      className={cn('inline-block shrink-0 rounded-full', DOT[tone], className)}
      style={{ width: size, height: size }}
    />
  );
}

export default Chip;
