import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface ActionTileProps {
  to: string;
  icon: ReactNode;
  label: string;
  className?: string;
}

/**
 * A quick action pinned to the board, built to the PriceTile's anatomy — the
 * same 160×112 magnet card, a 3px stripe, a marker dot top-right, the name at
 * the top and the icon standing where a price would be. Ink rather than a
 * marker colour, because an action belongs to no facility.
 *
 * Deliberately not icon + heading + caption: the day's figures are the ledger
 * strip's job, so a tile carries only the name and its mark.
 */
export function ActionTile({ to, icon, label, className }: ActionTileProps) {
  return (
    <Link
      to={to}
      className={cn(
        "relative flex h-full min-h-[7rem] w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-rule bg-card p-3 text-left text-ink",
        "transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-magnet active:scale-[.98] active:shadow-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        className
      )}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] rounded-t-xl bg-ink" />
      <span
        aria-hidden="true"
        className="marker-dot absolute right-3 top-3"
        style={{ "--marker": "var(--ink)" } as CSSProperties}
      />
      <span className="line-clamp-2 block w-full pr-7 text-sm font-semibold leading-5">{label}</span>
      <span className="mt-auto block [&_svg]:size-6 [&_svg]:text-ink" aria-hidden="true">
        {icon}
      </span>
    </Link>
  );
}
