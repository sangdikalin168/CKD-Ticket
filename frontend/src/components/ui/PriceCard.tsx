import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { FacilityRef } from '@/lib/facility';
import { formatMoney } from '@/lib/money';
import { FacilityMarks, useFacilityName } from './FacilityMark';

export interface PriceCardProps {
  price: number;
  /** Age group, written in the caption line when present. */
  ageGroup?: string | null;
  facilities?: readonly FacilityRef[] | null;
  /** Tap sells. Omit and the card is a read-only entry in a price list. */
  onSelect?: () => void;
  /** Label on the card's action ("Sell"); the card is the button. */
  actionLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  /** Extra content on the card's trailing header edge (an edit menu). */
  corner?: ReactNode;
  /**
   * Replaces the caption line. The price-setup surface writes the stored label
   * here, because that label is the admin's own text and belongs on the screen
   * where it is edited — never on the counter's card, where it would put a
   * second language next to the Khmer facility name.
   */
  caption?: ReactNode;
  className?: string;
}

/**
 * One sellable price: a white card with one hairline, the product named in
 * ink, the entitlement in caption, and the price in tabular ink figures.
 * Flat at rest; hover tints the ground and press deepens it — nothing lifts.
 *
 * The name is the facility set, always from the i18n labels (see lib/facility)
 * so one viewport speaks one language; it wraps to two lines rather than
 * truncating, because a tap-to-sell target has to say what it sells.
 */
export function PriceCard({
  price,
  ageGroup,
  facilities,
  onSelect,
  actionLabel,
  busy = false,
  disabled = false,
  corner,
  caption,
  className,
}: PriceCardProps) {
  const { t } = useTranslation();
  const name = useFacilityName();
  const list = facilities ?? [];
  const interactive = !!onSelect;
  const title = list.length ? list.map((f) => name(f)).join(' + ') : t('facility.none');
  const captionText = caption ?? (ageGroup ? ageGroup : t('price.oneEntry'));

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span title={title} className="line-clamp-2 text-sm font-medium leading-5 text-ink">
          {title}
        </span>
        {corner && <span className="-mr-1 -mt-1 shrink-0">{corner}</span>}
      </div>
      <div className="mt-1 min-h-[1.2rem] truncate text-caption text-ink-soft">{captionText}</div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="figure text-2xl font-semibold leading-none text-ink">
          {formatMoney(price)}
        </span>
        <FacilityMarks facilities={list} names={false} className="pb-1" />
      </div>
      {interactive && (
        <span
          className={cn(
            'mt-3 inline-flex h-8 w-full items-center justify-center rounded-md text-sm font-semibold transition-colors',
            busy
              ? 'bg-amber-deep text-ink'
              : disabled
                ? 'bg-muted text-muted-foreground'
                : 'bg-amber text-ink group-hover:shadow-[inset_0_-3px_0_rgb(var(--amber-deep))] group-active:bg-amber-deep'
          )}
        >
          {busy ? t('common.loading') : (actionLabel ?? t('price.sell'))}
        </span>
      )}
    </>
  );

  const base = cn(
    'flex min-w-0 flex-col rounded-lg border border-rule bg-card p-3 text-left',
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
        'group transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        busy
          ? 'cursor-progress bg-wash'
          : disabled
            ? 'cursor-not-allowed opacity-60'
            : 'hover:bg-wash/60 active:bg-wash'
      )}
    >
      {body}
    </button>
  );
}

export default PriceCard;
