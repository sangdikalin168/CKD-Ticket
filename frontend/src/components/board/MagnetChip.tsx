import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Magnets pin a record's state to the board: green done, yellow pending,
 * red rejected, blue informational, grey off. They are the whole state
 * palette — a new state maps onto one of these or is written in ink.
 */
export type MagnetTone = "done" | "pending" | "rejected" | "info" | "off";

const TONE_CLASS: Record<MagnetTone, string> = {
  done: "magnet-done",
  pending: "magnet-pending",
  rejected: "magnet-rejected",
  info: "magnet-info",
  off: "magnet-off",
};

export interface MagnetDotProps {
  tone: MagnetTone;
  /** md = 22px (cards, headers), sm = 14px (table cells), xs = 10px (inline). */
  size?: "md" | "sm" | "xs";
  className?: string;
  title?: string;
}

export function MagnetDot({ tone, size = "md", className, title }: MagnetDotProps) {
  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      className={cn(
        "magnet",
        TONE_CLASS[tone],
        size === "sm" && "magnet-sm",
        size === "xs" && "magnet-xs",
        className
      )}
    />
  );
}

export interface MagnetChipProps {
  tone: MagnetTone;
  children: ReactNode;
  size?: "md" | "sm";
  className?: string;
}

/** A magnet dot with its label written beside it in ink. */
export function MagnetChip({ tone, children, size = "sm", className }: MagnetChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-ink",
        size === "md" ? "text-sm" : "text-caption",
        className
      )}
    >
      <MagnetDot tone={tone} size={size === "md" ? "md" : "sm"} />
      <span>{children}</span>
    </span>
  );
}

/**
 * Map the request/membership status strings the backend uses (both the v1
 * "Pending"/"Approved" spelling and the v2 upper-case one) onto a magnet.
 */
export function statusTone(status?: string | null): MagnetTone {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED" || s === "PROCESSED" || s === "DONE" || s === "ACTIVE" || s === "PAID") return "done";
  if (s === "PENDING" || s === "WAITING") return "pending";
  if (s === "REJECTED" || s === "EXPIRED" || s === "FAILED") return "rejected";
  if (s === "CANCELLED" || s === "CANCELED" || s === "INACTIVE" || s === "") return "off";
  return "info";
}
