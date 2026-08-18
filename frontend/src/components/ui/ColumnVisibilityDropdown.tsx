import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon as Check, ViewColumnsIcon as Columns3 } from '@heroicons/react/24/outline';
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
        className={cn(
          'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs font-medium md:text-sm ring-offset-background transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          triggerClassName
        )}
      >
        <Columns3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
        <span>{resolvedLabel}</span>
        {hiddenCount > 0 && (
          <span className="rounded-full bg-primary/10 px-1.5 text-caption font-semibold text-primary">
            {columns.length - hiddenCount}/{columns.length}
          </span>
        )}
      </button>

      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={showAll}
              className="text-xs text-primary hover:underline"
            >
              {t('ui.columns.showAll')}
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={hideAll}
              className="text-xs text-muted-foreground hover:underline"
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
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                      isVisible ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
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
