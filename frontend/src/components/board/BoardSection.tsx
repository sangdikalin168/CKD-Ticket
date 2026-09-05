import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BoardSectionProps {
  title: ReactNode;
  /** Right-hand slot on the heading row: a tally, a filter, an action. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use "h3" inside a page that already has an h2. */
  as?: "h2" | "h3";
}

/** A titled region of the board: heading in marker weight, a 2px rule, content. */
export function BoardSection({ title, aside, children, className, as: Tag = "h2" }: BoardSectionProps) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <Tag className="text-title font-black leading-snug text-ink">{title}</Tag>
        {aside && <div className="flex flex-wrap items-center gap-2">{aside}</div>}
      </div>
      <div className="marker-rule mb-3 mt-2" />
      {children}
    </section>
  );
}
