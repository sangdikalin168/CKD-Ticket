import React, { useEffect, useRef, useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

/**
 * Small click-to-reveal hint icon, used in place of always-on helper text —
 * e.g. explaining where a payroll amount comes from, or what a toggle does.
 * Keyboard: Enter/Space toggles, Escape closes. Click outside closes.
 */
export interface HintButtonProps {
  /** Accessible name for the icon button (what is this hint about). */
  label: string;
  children: React.ReactNode;
  /** Tooltip alignment relative to the icon; use 'left' near a container's left edge. */
  align?: 'center' | 'left' | 'right';
}

const ALIGN_CLASSES = {
  center: 'left-1/2 -translate-x-1/2',
  left: 'left-0',
  right: 'right-0',
} as const;

export const HintButton: React.FC<HintButtonProps> = ({ label, children, align = 'center' }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-info hover:text-info/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-info/40 transition-colors"
      >
        <InformationCircleIcon className="w-4 h-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute ${ALIGN_CLASSES[align]} top-full mt-1.5 z-20 w-64 rounded-md border border-border bg-popover shadow-md px-3 py-2 text-xs leading-relaxed text-popover-foreground`}
        >
          {children}
        </span>
      )}
    </span>
  );
};

export default HintButton;
