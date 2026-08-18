import React from 'react';

export interface FlagProps {
  className?: string;
}

/** Union Jack on a 3:2 canvas — simplified for small sizes. */
export const FlagUK: React.FC<FlagProps> = ({ className = '' }) => (
  <svg viewBox="0 0 60 40" preserveAspectRatio="none" className={className} aria-hidden focusable="false">
    <rect width="60" height="40" fill="#012169" />
    <path stroke="#fff" strokeWidth="8" d="M0 0 60 40M60 0 0 40" />
    <path stroke="#C8102E" strokeWidth="3" d="M0 0 60 40M60 0 0 40" />
    <path stroke="#fff" strokeWidth="13" d="M30 0v40M0 20h60" />
    <path stroke="#C8102E" strokeWidth="8" d="M30 0v40M0 20h60" />
  </svg>
);

/** Cambodian flag on a 3:2 canvas with a simplified Angkor Wat silhouette. */
export const FlagKH: React.FC<FlagProps> = ({ className = '' }) => (
  <svg viewBox="0 0 60 40" preserveAspectRatio="none" className={className} aria-hidden focusable="false">
    <rect width="60" height="40" fill="#032EA1" />
    <rect y="10" width="60" height="20" fill="#E00025" />
    <path
      fill="#fff"
      d="M21 28v-2h2v-3l2-2.5 2 2.5v1h1v-6l2-3 2 3v6h1v-1l2-2.5 2 2.5v3h2v2z"
    />
  </svg>
);

/** Language code → flag. Add a row here when adding a language in i18n.ts. */
export const LANGUAGE_FLAGS: Record<string, React.FC<FlagProps>> = {
  en: FlagUK,
  km: FlagKH,
};
