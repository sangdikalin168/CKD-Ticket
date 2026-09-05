import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MagnetChip, type MagnetTone } from "./MagnetChip";

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
  /** The state magnet on the card. */
  tone: MagnetTone;
  toneLabel: string;
  /** A second magnet, for flows with two decisions (checker, approver). */
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
 * Holds and transfers as three columns on the board grid — Requested,
 * Checked, Processed — each request a small magnet card. When a request's
 * state changes it moves to the next column and slides in there.
 */
export function RequestColumns({ columns, cards, emptyLabel, className }: RequestColumnsProps) {
  // Remember where each card was so only a card that moved gets the slide.
  const previous = useRef<Map<string | number, string>>(new Map());
  const moved = new Set<string | number>();
  for (const card of cards) {
    const was = previous.current.get(card.id);
    if (was !== undefined && was !== card.column) moved.add(card.id);
  }
  useEffect(() => {
    previous.current = new Map(cards.map((c) => [c.id, c.column]));
  });

  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>
      {columns.map((col) => {
        const items = cards.filter((c) => c.column === col.key);
        return (
          <section
            key={col.key}
            aria-label={col.label}
            className="board-grid min-w-0 rounded-lg border border-rule p-2"
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-2 pt-1">
              <h3 className="marker-caps text-ink">{col.label}</h3>
              <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-ink px-1.5 text-caption font-black text-white shadow-magnet">
                {items.length}
              </span>
            </div>
            <div className="marker-rule mb-2" />
            {items.length === 0 ? (
              <p className="px-2 py-6 text-center text-caption text-ink-soft">{emptyLabel}</p>
            ) : (
              <ul className="flex flex-col gap-2 md:max-h-[calc(100vh-16rem)] md:overflow-y-auto md:pr-1">
                {items.map((card) => {
                  const Wrapper = card.onClick ? "button" : "div";
                  return (
                    <li key={card.id} className={cn(moved.has(card.id) && "animate-board-card-in")}>
                      <div
                        className={cn(
                          "rounded-lg border border-rule bg-card shadow-[0_1px_2px_rgb(0_0_0/0.12)]",
                          "transition-[box-shadow,transform] duration-150",
                          card.onClick && "hover:-translate-y-px hover:shadow-magnet"
                        )}
                      >
                        <Wrapper
                          type={card.onClick ? "button" : undefined}
                          onClick={card.onClick}
                          className={cn(
                            "block w-full rounded-t-lg p-3 text-left",
                            card.onClick && "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                            !card.actions && "rounded-b-lg"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink">{card.title}</p>
                              {card.subtitle && (
                                <p className="truncate text-caption text-ink-soft">{card.subtitle}</p>
                              )}
                            </div>
                            <MagnetChip tone={card.tone} size="md" className="shrink-0">
                              {card.toneLabel}
                            </MagnetChip>
                          </div>
                          {card.lines && card.lines.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-caption text-ink">
                              {card.lines.map((line, i) => (
                                <li key={i} className="truncate">{line}</li>
                              ))}
                            </ul>
                          )}
                          {card.extra && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{card.extra}</div>}
                        </Wrapper>
                        {card.actions && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-rule bg-tray px-3 py-2">
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
