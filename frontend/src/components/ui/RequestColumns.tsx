import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Chip, type ChipTone } from './Chip';

export interface RequestColumnDef {
  key: string;
  label: string;
}

export interface RequestCard {
  id: string | number;
  /** Which column the request sits in right now. */
  column: string;
  title: string;
  subtitle?: string;
  /** Short lines written under the title: dates, reason, who asked. */
  lines?: ReactNode[];
  /** The state chip on the card. */
  tone: ChipTone;
  toneLabel: string;
  /** A second chip, for flows with two decisions (checker, approver). */
  extra?: ReactNode;
  /** Buttons for the next step; rendered on the card's foot. */
  actions?: ReactNode;
  onClick?: () => void;
}

export interface RequestColumnsProps {
  columns: RequestColumnDef[];
  cards: RequestCard[];
  emptyLabel: string;
  className?: string;
}

/**
 * Requests as three plain columns — requested, checked, processed. Each column
 * is a heading with its count, and each request a white card with a hairline
 * and a state chip. Nothing carries a shadow and nothing animates in: a card
 * that moves column simply renders in its new column.
 */
export function RequestColumns({ columns, cards, emptyLabel, className }: RequestColumnsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', className)}>
      {columns.map((col) => {
        const items = cards.filter((c) => c.column === col.key);
        return (
          <section key={col.key} aria-label={col.label} className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">{col.label}</h3>
              <Chip tone="muted" mono className="ml-auto">
                {items.length}
              </Chip>
            </div>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-rule bg-card px-3 py-6 text-center text-caption text-ink-soft">
                {emptyLabel}
              </p>
            ) : (
              <ul className="flex flex-col gap-2 md:max-h-[calc(100vh-16rem)] md:overflow-y-auto md:pr-1">
                {items.map((card) => {
                  const Wrapper = card.onClick ? 'button' : 'div';
                  return (
                    <li key={card.id}>
                      <div className="overflow-hidden rounded-lg border border-rule bg-card transition-colors">
                        <Wrapper
                          type={card.onClick ? 'button' : undefined}
                          onClick={card.onClick}
                          className={cn(
                            'block w-full p-3 text-left transition-colors',
                            card.onClick &&
                              'hover:bg-wash/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">{card.title}</p>
                              {card.subtitle && (
                                <p className="truncate text-caption text-ink-soft">{card.subtitle}</p>
                              )}
                            </div>
                            <Chip tone={card.tone} className="shrink-0">
                              {card.toneLabel}
                            </Chip>
                          </div>
                          {card.lines && card.lines.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-caption text-ink">
                              {card.lines.map((line, i) => (
                                <li key={i} className="truncate">
                                  {line}
                                </li>
                              ))}
                            </ul>
                          )}
                          {card.extra && (
                            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">{card.extra}</div>
                          )}
                        </Wrapper>
                        {card.actions && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-rule bg-wash px-3 py-2">
                            {card.actions}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default RequestColumns;
