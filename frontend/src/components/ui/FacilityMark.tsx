import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { FACILITIES, facilityByCode, type FacilityCode, type FacilityRef } from '@/lib/facility';

/**
 * A facility's quiet dot. Eight pixels of solid colour beside a name — the
 * facility hues no longer stripe a card, ground a column or colour a price;
 * they identify a facility in a list of facilities and stop there.
 */
export function FacilityDot({
  code,
  size = 8,
  className,
}: {
  code?: string | null;
  size?: number;
  className?: string;
}) {
  const meta = facilityByCode(code);
  return (
    <span
      aria-hidden="true"
      className={cn('facility-dot', className)}
      style={{ '--facility': `var(${meta.cssVar})`, width: size, height: size } as CSSProperties}
    />
  );
}

/**
 * The display name of a facility.
 *
 * The i18n label wins over the name stored on the row: the database spells its
 * facilities in English ("Swimming", "Steam / Sauna") and the counter reads
 * Khmer, so taking the stored name put two languages in one viewport. A code
 * this app does not know falls back to whatever the row carries.
 */
export function useFacilityName() {
  const { t } = useTranslation();
  return (f: FacilityRef | FacilityCode): string => {
    if (typeof f === 'string') return t(FACILITIES[f].labelKey);
    const meta = facilityByCode(f.code);
    if (meta.code !== 'OFF') return t(meta.labelKey);
    return f.name || t(meta.labelKey);
  };
}

export interface FacilityMarksProps {
  facilities?: readonly (FacilityRef | FacilityCode)[] | null;
  /** Write the names after the dots, joined with " + ". */
  names?: boolean;
  size?: number;
  className?: string;
  /** Text class for the names (defaults to ink). */
  textClassName?: string;
}

/**
 * A product's facilities: one dot each, then the names in ink. Dots sit in a
 * row with a small gap — they do not overlap, blend or stripe.
 */
export function FacilityMarks({
  facilities,
  names = true,
  size = 8,
  className,
  textClassName,
}: FacilityMarksProps) {
  const name = useFacilityName();
  const list = (facilities ?? []).map((f) =>
    typeof f === 'string' ? ({ code: f } as FacilityRef) : f
  );
  if (list.length === 0) {
    return <span className={cn('text-ink-soft', className)}>—</span>;
  }
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className="inline-flex items-center gap-1">
        {list.map((f, i) => (
          <FacilityDot key={`${f.facility_id ?? f.code ?? i}`} code={f.code} size={size} />
        ))}
      </span>
      {names && (
        <span className={cn('truncate text-ink', textClassName)}>
          {list.map((f) => name(f)).join(' + ')}
        </span>
      )}
    </span>
  );
}
