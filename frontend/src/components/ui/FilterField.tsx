import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface FilterFieldProps {
  label: string;
  /** Small leading glyph, sized by the caller to h-3.5 w-3.5. */
  icon?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control for one filter in a toolbar row.
 *
 * Toolbars mix shared filters (useCommonFilters) with page-specific ones, and
 * they used to style their labels independently — three variants could end up
 * side by side. Every filter label goes through here so the row reads as one.
 */
export function FilterField({ label, icon, htmlFor, className, children }: FilterFieldProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
