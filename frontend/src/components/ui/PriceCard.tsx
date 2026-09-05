import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FacilityRef } from '@/lib/facility';
import { formatMoney } from '@/lib/money';
import { useFacilityName } from './FacilityMark';

export interface PriceCardProps {
  price: number;
  /** Age group, written in the caption line when present. */
  ageGroup?: string | null;
  facilities?: readonly FacilityRef[] | null;
  /** Tap sells. Omit and the card is a read-only entry in a price list. */
  onSelect?: () => void;
  busy?: boolean;
  disabled?: boolean;
  /** Extra content on the card's trailing header edge (an edit menu, a photo). */
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
 *
 * The whole card is the target — there is no button inside it. A grid of ten
 * prices is a grid of ten committing actions, and giving each its own amber
 * button turned the one accent into wallpaper; the amber appears here only on
 * the card currently being sold, which is the "selected option" the accent is
 * reserved for. Flat at rest; hover tints the ground and press deepens it.
 *
 * The name is the facility set, always from the i18n labels (see lib/facility)
 * so one viewport speaks one language; it wraps to two lines rather than
 * truncating, because a tap-to-sell target has to say what it sells. The
 * facility dots are not repeated here — the name already is the facility, and
 * the group heading above carries the dot.
 */
export function PriceCard({
  price,
  ageGroup,
  facilities,
  onSelect,
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
      <div className="mt-0.5 truncate text-caption text-ink-soft">{captionText}</div>
      <div className="mt-2 flex items-end gap-2">
        <span className="figure text-2xl font-semibold leading-none text-ink">
          {formatMoney(price)}
        </span>
        {busy && (
          <Loader2 className="mb-0.5 ml-auto h-4 w-4 shrink-0 animate-spin text-ink" aria-hidden="true" />
        )}
      </div>
    </>
  );

  const base = cn('flex min-w-0 flex-col rounded-lg border p-3 text-left', className);

  if (!interactive) {
    return <div className={cn(base, 'border-rule bg-card')}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-label={`${title} — ${formatMoney(price)}`}
      className={cn(
        base,
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        busy
          ? 'cursor-progress border-amber-deep bg-amber-tint'
          : disabled
            ? 'cursor-not-allowed border-rule bg-card opacity-60'
            : 'border-rule bg-card hover:bg-wash/70 active:bg-wash'
      )}
    >
      {body}
    </button>
  );
}

export default PriceCard;
