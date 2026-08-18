/**
 * Translation shim for components carried over from NAN-HR.
 *
 * Historically this held a hardcoded Khmer string table because the app had no
 * i18n layer. The app now runs i18next (src/i18n/i18n.ts) with these keys in
 * BOTH locales (`common.*` / `ui.*` merged from NAN-HR's reviewed files), so
 * this module is just a thin delegate: the same `t` / `useTranslation` names
 * keep the copied components working unchanged, but strings now follow the
 * language switcher.
 */
import i18n from '../i18n/i18n';
import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Look up a string in the ACTIVE language. Note: a bare `t` call is not
 * reactive on its own — the component shows the new language when it next
 * renders (a language switch re-renders any tree containing useTranslation,
 * which in practice covers the pages these components sit in).
 */
export function t(key: string, params?: Record<string, unknown>): string {
  // String() pins down i18next's union return type; with returnObjects unset
  // the value is always a string at runtime.
  return String(i18n.t(key, params as never));
}

/** Reactive hook — re-exported from react-i18next so consumers re-render on switch. */
export function useTranslation() {
  return useI18nTranslation();
}
