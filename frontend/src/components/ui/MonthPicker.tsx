import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon as Calendar, ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, ChevronDownIcon as ChevronDown } from '@heroicons/react/24/outline';

const MONTH_SHORT_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];
const MONTH_LONG_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** "YYYY-MM" → { year, month } (month is 0-indexed) */
const parseMonth = (value: string): { year: number; month: number } => {
  const [y, m] = value.split('-').map(Number);
  return { year: y, month: (m || 1) - 1 };
};

const formatMonth = (year: number, month: number): string =>
  `${year}-${String(month + 1).padStart(2, '0')}`;

type PresetKey = 'this_month' | 'last_month' | 'two_months_ago' | 'three_months_ago';

const QUICK_PRESETS: { key: PresetKey; labelKey: string }[] = [
  { key: 'this_month', labelKey: 'ui.dateRange.thisMonth' },
  { key: 'last_month', labelKey: 'ui.dateRange.lastMonth' },
  { key: 'two_months_ago', labelKey: 'ui.monthPicker.twoMonthsAgo' },
  { key: 'three_months_ago', labelKey: 'ui.monthPicker.threeMonthsAgo' },
];

const getPresetValue = (key: PresetKey): string => {
  const now = new Date();
  const offset = { this_month: 0, last_month: -1, two_months_ago: -2, three_months_ago: -3 }[key];
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return formatMonth(d.getFullYear(), d.getMonth());
};

export interface MonthPickerProps {
  /** Currently selected month as "YYYY-MM" */
  value: string;
  /** Called with the new "YYYY-MM" when the user picks a month */
  onChange: (value: string) => void;
  className?: string;
  /** Show the label above the trigger (default: true) */
  showLabel?: boolean;
}

/**
 * Month picker styled to match DateRangeFilter — trigger button + dropdown panel
 * with quick presets on the left and a year-navigated 12-month grid on the right.
 */
export function MonthPicker({ value, onChange, className = '', showLabel = true }: MonthPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { year: selectedYear, month: selectedMonth } = useMemo(() => parseMonth(value), [value]);
  const [viewYear, setViewYear] = useState(selectedYear);

  // Resync view year when value changes externally
  useEffect(() => { setViewYear(selectedYear); }, [selectedYear]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlePreset = (key: PresetKey) => {
    onChange(getPresetValue(key));
    setOpen(false);
  };

  const handleMonthClick = (monthIdx: number) => {
    onChange(formatMonth(viewYear, monthIdx));
    setOpen(false);
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const displayLabel = `${t(`ui.calendar.months.${MONTH_LONG_KEYS[selectedMonth]}`)} ${selectedYear}`;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label and trigger match the shared filter scale (FilterField +
          MultiSelectDropdown) so a toolbar row keeps one baseline. */}
      {showLabel && (
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {t('common.month')}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-10 w-full min-w-[180px] items-center gap-2.5 rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors hover:border-ring/60 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-left truncate font-medium">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 bg-popover border border-border rounded-xl shadow-xl flex overflow-hidden animate-in fade-in-0 zoom-in-95">

          {/* Left: Quick presets */}
          <div className="flex flex-col gap-0.5 p-3 border-r border-border min-w-[150px]">
            <div className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {t('ui.dateRange.quickSelect')}
            </div>
            {QUICK_PRESETS.map(opt => {
              const presetValue = getPresetValue(opt.key);
              const isActive = value === presetValue;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handlePreset(opt.key)}
                  className={`text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Right: Year nav + month grid */}
          <div className="p-3 min-w-[260px]">
            <div className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {t('ui.monthPicker.clickToSelect')}
            </div>

            {/* Year navigation */}
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setViewYear(y => y - 1)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
                aria-label={t('ui.monthPicker.previousYear')}
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-sm font-semibold text-foreground tabular-nums">{viewYear}</span>
              <button
                type="button"
                onClick={() => setViewYear(y => y + 1)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
                aria-label={t('ui.monthPicker.nextYear')}
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* 12-month grid (3 columns × 4 rows) */}
            <div className="grid grid-cols-3 gap-1.5 select-none">
              {MONTH_SHORT_KEYS.map((key, idx) => {
                const isSelected = viewYear === selectedYear && idx === selectedMonth;
                const isCurrent = viewYear === currentYear && idx === currentMonth;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleMonthClick(idx)}
                    className={`px-2 py-2 text-sm rounded-lg transition-colors font-medium ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                          ? 'border border-primary text-primary hover:bg-primary/10'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {t(`ui.calendar.monthsShort.${key}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
