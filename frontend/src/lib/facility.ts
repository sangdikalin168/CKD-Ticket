/**
 * The one facility definition.
 *
 * Swim, gym and steam are the axis of every price table and ticket card; a
 * combination package is the fourth. This module replaces the three per-page
 * copies that used to disagree (one of them read a `badge` key that did not
 * exist), and no page may declare its own.
 *
 * What a facility drives is deliberately small: a name and a quiet 8px dot.
 * It no longer stripes a card, grounds a column or colours a price — prices
 * are ink, like every other figure in the system — so the palette holds one
 * accent and four state marks and nothing competes with them.
 */

export type FacilityCode = "SWIM" | "GYM" | "STEAM" | "COMBO" | "OFF";

export interface FacilityMeta {
  code: FacilityCode;
  /** i18n key for the facility's name (Khmer + English in the locale files). */
  labelKey: string;
  /** Name of the CSS custom property holding this facility's dot colour. */
  cssVar: string;
}

export const FACILITIES: Record<FacilityCode, FacilityMeta> = {
  SWIM: { code: "SWIM", labelKey: "facility.swim", cssVar: "--swim" },
  GYM: { code: "GYM", labelKey: "facility.gym", cssVar: "--gym" },
  STEAM: { code: "STEAM", labelKey: "facility.steam", cssVar: "--steam" },
  COMBO: { code: "COMBO", labelKey: "facility.combo", cssVar: "--combo" },
  OFF: { code: "OFF", labelKey: "facility.none", cssVar: "--ink-soft" },
};

/** Grouping order in price lists and price tables. */
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
 * The facility a product belongs to: one facility is its own, two or more are
 * the combination, none is unassigned.
 */
export function facilityOfSet(list?: readonly FacilityRef[] | null): FacilityMeta {
  if (!list || list.length === 0) return FACILITIES.OFF;
  if (list.length === 1) return facilityByCode(list[0].code);
  return FACILITIES.COMBO;
}

/** Which group heading a product is filed under in a price list. */
export function facilityGroup(list?: readonly FacilityRef[] | null): FacilityCode {
  const meta = facilityOfSet(list);
  return meta.code === "OFF" ? "COMBO" : meta.code;
}

/**
 * The member price table stores a service type rather than a facility list
 * ("Swim", "SwimGym", "SwimSteam", "SwimGymSteam"). Expand it so the same
 * dots can be drawn.
 */
export function facilitiesOfServiceType(serviceType?: string | null): FacilityCode[] {
  const s = (serviceType ?? "").toLowerCase();
  const out: FacilityCode[] = [];
  if (s.includes("swim")) out.push("SWIM");
  if (s.includes("gym")) out.push("GYM");
  if (s.includes("steam")) out.push("STEAM");
  return out;
}

/** Inline-style colour for a facility's dot, where a class cannot reach. */
export function facilityColor(code?: string | null): string {
  return `hsl(var(${facilityByCode(code).cssVar}))`;
}
