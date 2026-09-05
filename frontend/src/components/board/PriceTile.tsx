import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { facilityByCode, facilityOfSet, type FacilityRef } from "@/lib/facility";
import { formatMoney } from "@/lib/money";
import { FacilityDot, useFacilityName } from "./FacilityMark";

export interface PriceTileProps {
  price: number;
  /** Age group, written in the caption line when present. */
  ageGroup?: string | null;
  facilities?: readonly FacilityRef[] | null;
  /** Tap sells: the tile presses and a marker stroke draws across it while busy. */
  onSelect?: () => void;
  busy?: boolean;
  disabled?: boolean;
  /** Extra content pinned to the top-left corner (a key photo, an edit menu). */
  corner?: ReactNode;
  /**
   * Replaces the caption line. The price-setup surface writes the stored label
   * here, because that label is the admin's own text and belongs on the screen
   * where it is edited — never on the counter's tile, where it would put a
   * second language next to the Khmer facility name.
   */
  caption?: ReactNode;
  className?: string;
}

/**
 * The sale unit: a 160×112 magnet card with a marker-coloured stripe along the
 * top, the facility dot top-right, the product name, and the price written
 * large in the marker colour.
 *
 * The name is the facility set, always from the i18n labels (see lib/facility),
 * so one viewport speaks one language; it wraps to two lines rather than
 * truncating, because a tap-to-sell target has to say what it sells.
 */
export function PriceTile({
  price,
  ageGroup,
  facilities,
  onSelect,
  busy = false,
  disabled = false,
  corner,
  caption,
  className,
}: PriceTileProps) {
  const { t } = useTranslation();
  const name = useFacilityName();
  const list = facilities ?? [];
  const meta = facilityOfSet(list);
  const interactive = !!onSelect;
  const title = list.length ? list.map((f) => name(f)).join(" + ") : t("facility.none");
  const captionText = caption ?? (
    ageGroup ? <span className="font-medium text-ink">{ageGroup}</span> : t("board.oneEntry")
  );

  const stripe = (
    <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-[3px] overflow-hidden rounded-t-xl">
      {(list.length ? list : [{ code: "OFF" }]).map((f, i) => (
        <span
          key={`${f.facility_id ?? f.code ?? i}`}
          className="h-full flex-1"
          style={{ background: `hsl(var(${facilityByCode(f.code).cssVar}))` }}
        />
      ))}
    </span>
  );

  const body = (
    <>
      {stripe}
      <span className="absolute right-3 top-3 inline-flex items-center">
        {(list.length ? list : [{ code: "OFF" }]).map((f, i) => (
          <FacilityDot
            key={`${f.facility_id ?? f.code ?? i}`}
            code={f.code}
            size={10}
            overlap={list.length > 1}
            className={i > 0 ? "-ml-1" : undefined}
          />
        ))}
      </span>
      {corner && <span className="absolute left-3 top-3">{corner}</span>}
      <span
        title={title}
        className={cn(
          "line-clamp-2 block w-full pr-7 text-sm font-semibold leading-5 text-ink",
          corner && "pl-8"
        )}
      >
        {title}
      </span>
      <span className={cn("mt-auto block truncate text-price font-black leading-none", meta.text)}>
        {formatMoney(price)}
      </span>
      <span className="mt-1 block truncate text-caption text-ink-soft">{captionText}</span>
      {busy && (
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-3 right-3 h-[3px] origin-left rounded-full animate-board-stroke"
          style={{ background: `hsl(var(${meta.cssVar}))` } as CSSProperties}
        />
      )}
    </>
  );

  // min-h, not a fixed height: 112px is the floor, and a two-line facility name
  // grows the tile instead of clipping. Siblings in a flex row stretch to match.
  // overflow-hidden: a <button>'s contents are not width-constrained in Chromium.
  const base = cn(
    "relative flex h-full min-h-[7rem] w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-rule bg-card p-3 text-left",
    className
  );

  if (!interactive) {
    return <div className={base}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        base,
        "transition-[transform,box-shadow,opacity] duration-150 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        busy
          ? "scale-[.98] cursor-progress"
          : disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:-translate-y-px hover:shadow-magnet active:scale-[.98] active:shadow-none"
      )}
    >
      {body}
    </button>
  );
}
