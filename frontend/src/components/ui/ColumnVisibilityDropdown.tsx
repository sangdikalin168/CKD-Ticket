import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Columns3 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ColumnVisibilityItem {
  key: string;
  header: string;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnVisibilityItem[];
  hiddenKeys: Set<string>;
  onChange: (hiddenKeys: Set<string>) => void;
  label?: string;
  className?: string;
  triggerClassName?: string;
}

export function ColumnVisibilityDropdown({
  columns,
  hiddenKeys,
  onChange,
  label,
  className = '',
  triggerClassName = '',
}: ColumnVisibilityDropdownProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('ui.columns.label');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const toggle = (key: string) => {
    const next = new Set(hiddenKeys);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(next);
  };

  const showAll = () => onChange(new Set());
  const hideAll = () => onChange(new Set(columns.map((c) => c.key)));

  const hiddenCount = columns.filter((c) => hiddenKeys.has(c.key)).length;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={t('ui.columns.showOrHide')}
        aria-expanded={open}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-rule bg-card px-3 text-sm font-medium text-ink ring-offset-background transition-colors hover:bg-wash focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          triggerClassName
        )}
      >
        <Columns3 className="size-4" aria-hidden="true" />
        <span>{resolvedLabel}</span>
        {hiddenCount > 0 && (
          <span className="rounded-full bg-ink px-1.5 text-caption font-semibold text-white">
            {columns.length - hiddenCount}/{columns.length}
          </span>
        )}
      </button>

      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-rule bg-popover shadow-overlay animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-rule px-3 py-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={showAll}
              className="text-xs font-medium text-ink hover:underline"
            >
              {t('ui.columns.showAll')}
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={hideAll}
              className="text-xs text-ink-soft hover:underline"
            >
              {t('ui.columns.hideAll')}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {columns.map((column) => {
              const isVisible = !hiddenKeys.has(column.key);
              return (
                <button
                  key={column.key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(column.key)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-wash"
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
 isVisible ? 'border-ink bg-ink text-chalk' : 'border-rule'
                    }`}
                  >
                    {isVisible && <Check className="h-3 w-3" />}
                  </div>
                  <span className="truncate">{column.header}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
