
import { Bars3Icon as Rows3, Bars4Icon as Rows4 } from '@heroicons/react/24/outline';
import type { ComponentType, ComponentProps } from 'react';
import { cn } from '../../lib/utils';
import { TableDensity } from '../../types/datatable';

import { t } from '@/lib/khmer';
interface DensityToggleProps {
  value: TableDensity;
  onChange: (density: TableDensity) => void;
  className?: string;
}

// Derived from the icon itself: heroicons ships forwardRef components whose
// ref type does not fit a plain ComponentType<SVGProps<...>>.
type IconComponent = ComponentType<ComponentProps<typeof Rows3>>;

const DENSITY_OPTIONS: { value: TableDensity; icon: IconComponent; labelKey: string }[] = [
  { value: 'comfortable', icon: Rows3, labelKey: 'ui.dataTable.density.comfortable' },
  { value: 'compact', icon: Rows4, labelKey: 'ui.dataTable.density.compact' },
];

export function DensityToggle({ value, onChange, className = '' }: DensityToggleProps) {
  return (
    <div
      role="group"
      aria-label={'ទំហំជួរ'}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md border border-input bg-background p-0.5',
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
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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
