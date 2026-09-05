/**
 * The one facility palette.
 *
 * Swim, gym and steam are the axis of every price table, ticket tile and chip;
 * a combination package is the fourth colour. Staff read a product by its
 * colour before its name, so the colour must be the same on every screen —
 * this module replaces the three per-page copies that used to disagree (one
 * of them read a `badge` key that did not exist).
 *
 * The class strings are literal so Tailwind's scanner can see them.
 */

export type FacilityCode = "SWIM" | "GYM" | "STEAM" | "COMBO" | "OFF";

export interface FacilityMeta {
  code: FacilityCode;
  /** i18n key for the facility's name (Khmer + English in the locale files). */
  labelKey: string;
  /** Name of the CSS custom property that holds the marker colour. */
  cssVar: string;
  /** Tailwind utilities in this facility's marker colour. */
  text: string;
  bg: string;
  tint: string;
  border: string;
}

export const FACILITIES: Record<FacilityCode, FacilityMeta> = {
  SWIM: {
    code: "SWIM",
    labelKey: "facility.swim",
    cssVar: "--swim",
    text: "text-swim",
    bg: "bg-swim",
    tint: "bg-swim/10",
    border: "border-swim",
  },
  GYM: {
    code: "GYM",
    labelKey: "facility.gym",
    cssVar: "--gym",
    text: "text-gym",
    bg: "bg-gym",
    tint: "bg-gym/10",
    border: "border-gym",
  },
  STEAM: {
    code: "STEAM",
    labelKey: "facility.steam",
    cssVar: "--steam",
    text: "text-steam",
    bg: "bg-steam",
    tint: "bg-steam/10",
    border: "border-steam",
  },
  COMBO: {
    code: "COMBO",
    labelKey: "facility.combo",
    cssVar: "--combo",
    text: "text-combo",
    bg: "bg-combo",
    tint: "bg-combo/10",
    border: "border-combo",
  },
  OFF: {
    code: "OFF",
    labelKey: "facility.none",
    cssVar: "--magnet-off",
    text: "text-ink-soft",
    bg: "bg-magnet-off",
    tint: "bg-tray",
    border: "border-rule",
  },
};

/** Column order on the ticket board and in price tables. */
export const FACILITY_ORDER: FacilityCode[] = ["SWIM", "GYM", "STEAM", "COMBO"];

export interface FacilityRef {
  facility_id?: number | null;
  code?: string | null;
  name?: string | null;
}

/** Meta for a single facility code as stored by the backend (SWIM / GYM / STEAM). */
export function facilityByCode(code?: string | null): FacilityMeta {
  const key = (code ?? "").toUpperCase() as FacilityCode;
  return FACILITIES[key] ?? FACILITIES.OFF;
}

/**
 * The colour of a product that grants a set of facilities: one facility is its
 * own colour, two or more are the combination colour, none is grey.
 */
export function facilityOfSet(list?: readonly FacilityRef[] | null): FacilityMeta {
  if (!list || list.length === 0) return FACILITIES.OFF;
  if (list.length === 1) return facilityByCode(list[0].code);
  return FACILITIES.COMBO;
}

/** Which board column a product belongs to (the four fixed facility columns). */
export function facilityColumn(list?: readonly FacilityRef[] | null): FacilityCode {
  const meta = facilityOfSet(list);
  return meta.code === "OFF" ? "COMBO" : meta.code;
}

/**
 * The member price table stores a service type rather than a facility list
 * ("Swim", "SwimGym", "SwimSteam", "SwimGymSteam"). Expand it so the same
 * marker dots can be drawn.
 */
export function facilitiesOfServiceType(serviceType?: string | null): FacilityCode[] {
  const s = (serviceType ?? "").toLowerCase();
  const out: FacilityCode[] = [];
  if (s.includes("swim")) out.push("SWIM");
  if (s.includes("gym")) out.push("GYM");
  if (s.includes("steam")) out.push("STEAM");
  return out;
}

/** Inline-style colour for a facility, for the rare place a class cannot reach. */
export function facilityColor(code?: string | null): string {
  return `hsl(var(${facilityByCode(code).cssVar}))`;
}
