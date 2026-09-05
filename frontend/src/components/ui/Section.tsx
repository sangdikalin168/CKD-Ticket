import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps {
  title: ReactNode;
  /** Right-hand slot on the heading row: a tally, a filter, an action. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use "h3" inside a page that already has an h2. */
  as?: 'h2' | 'h3';
}

/**
 * A titled region of a page: an 18px/600 heading, an optional aside on the
 * same row, then the content. Separation is spacing, not a rule — the one
 * hairline in this system draws a card edge or a table divider, never a
 * section break.
 */
export function Section({ title, aside, children, className, as: Tag = 'h2' }: SectionProps) {
  return (
    <section className={cn('min-w-0', className)}>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <Tag className="text-lg font-semibold leading-snug text-ink">{title}</Tag>
        {aside && <div className="flex flex-wrap items-center gap-2">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export default Section;
