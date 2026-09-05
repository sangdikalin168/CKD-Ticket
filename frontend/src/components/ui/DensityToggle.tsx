import { useTranslation } from 'react-i18next';
import { Rows3, Rows4 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TableDensity } from '../../types/datatable';

interface DensityToggleProps {
  value: TableDensity;
  onChange: (density: TableDensity) => void;
  className?: string;
}

const DENSITY_OPTIONS: { value: TableDensity; icon: LucideIcon; labelKey: string }[] = [
  { value: 'comfortable', icon: Rows3, labelKey: 'ui.dataTable.density.comfortable' },
  { value: 'compact', icon: Rows4, labelKey: 'ui.dataTable.density.compact' },
];

export function DensityToggle({ value, onChange, className = '' }: DensityToggleProps) {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('ui.dataTable.density.label')}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md border border-rule bg-card p-0.5',
        className
      )}
    >
      {DENSITY_OPTIONS.map(({ value: option, icon: Icon, labelKey }) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={isActive}
            title={t(labelKey)}
            className={cn(
              'inline-flex h-full min-w-[28px] items-center justify-center rounded-[3px] px-1.5 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-ink text-white'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
