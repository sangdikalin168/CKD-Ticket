import { useState, useEffect, useRef } from 'react';
import { CalendarIcon as Calendar, ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, ChevronDownIcon as ChevronDown } from '@heroicons/react/24/outline';

import { t } from '@/lib/khmer';
export type DatePreset = '' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

// Use local date formatting to avoid UTC offset issues in non-UTC timezones
const toLocalISO = (d: Date): string => {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dd}`;
};

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

export function getDateRangeForPreset(preset: DatePreset): { start: string; end: string } {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { start: toLocalISO(today), end: toLocalISO(today) };
    case 'this_week': {
      const day = today.getDay(); // 0 = Sun
      const mon = new Date(today);
      mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start: toLocalISO(mon), end: toLocalISO(sun) };
    }
    case 'this_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: toLocalISO(first), end: toLocalISO(last) };
    }
    case 'last_month': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toLocalISO(first), end: toLocalISO(last) };
    }
    default:
      return { start: '', end: '' };
  }
}

/** Build an array of ISO date strings (or null for leading empty slots) for a month grid */
function buildMonthDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mo = String(month + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    days.push(`${year}-${mo}-${day}`);
  }
  return days;
}

const QUICK_PRESETS: { value: DatePreset; labelKey: string }[] = [
  { value: '', labelKey: 'ui.dateRange.allDate' },
  { value: 'today', labelKey: 'common.today' },
  { value: 'this_week', labelKey: 'ui.dateRange.thisWeek' },
  { value: 'this_month', labelKey: 'ui.dateRange.thisMonth' },
  { value: 'last_month', labelKey: 'ui.dateRange.lastMonth' },
];

function formatDisplayLabel(preset: DatePreset, customStart: string, customEnd: string): string {
  if (preset === 'today') return 'ថ្ងៃនេះ';
  if (preset === 'this_week') return 'សប្តាហ៍នេះ';
  if (preset === 'this_month') return 'ខែនេះ';
  if (preset === 'last_month') return 'ខែមុន';
  if (preset === 'custom') {
    const fmt = (s: string) => s.split('-').reverse().join('/');
    if (customStart && customEnd) {
      return customStart === customEnd ? fmt(customStart) : `${fmt(customStart)} – ${fmt(customEnd)}`;
    }
    if (customStart) return `ចាប់ពី ${fmt(customStart)}`;
    return 'ចន្លោះផ្ទាល់ខ្លួន';
  }
  return 'គ្រប់កាលបរិច្ឆេទ';
}

export interface DateRangeFilterProps {
  /** Called whenever the effective date range changes */
  onChange: (startDate: string, endDate: string) => void;
  /** Initial preset selection (defaults to '') */
  defaultPreset?: DatePreset;
  className?: string;
  /** Show the "Date Range" label above the trigger (default: true). Set false when embedding as a chip. */
  showLabel?: boolean;
  /** Which side of the trigger the popup aligns to (default: 'left'). Use 'right' when the trigger sits on the right edge of a container so the popup stays on-screen. */
  align?: 'left' | 'right';
}

/**
 * Reusable date range filter component.
 * Shows a button that opens a calendar popup with quick presets (left panel)
 * and a two-month calendar for custom range selection (right panel).
 * Calls `onChange(startDate, endDate)` on every change.
 */
export function DateRangeFilter({
  onChange,
  defaultPreset = '',
  className = '',
  showLabel = true,
  align = 'left',
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<DatePreset>(defaultPreset);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [hoverDate, setHoverDate] = useState('');
  // true = waiting for start click; false = waiting for end click
  const [selectingStart, setSelectingStart] = useState(true);

  // Calendar navigation — two months shown starting from viewMonth
  const todayDate = new Date();
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

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

  // Notify parent whenever selection changes
  useEffect(() => {
    if (preset === 'custom') {
      onChangeRef.current(customStart, customEnd);
    } else {
      const range = getDateRangeForPreset(preset);
      onChangeRef.current(range.start, range.end);
    }
  }, [preset, customStart, customEnd]);

  const applyPreset = (p: DatePreset) => {
    setPreset(p);
    setCustomStart('');
    setCustomEnd('');
    setSelectingStart(true);
    setOpen(false);
  };

  const handleDayClick = (dateStr: string) => {
    if (selectingStart) {
      // First click: select start. Also pre-set end = start so it's already a valid
      // single-day selection. User can click a second day to extend the range.
      setCustomStart(dateStr);
      setCustomEnd(dateStr);
      setSelectingStart(false);
      setPreset('custom');
    } else {
      if (dateStr === customStart) {
        // Clicking the same day again confirms it as a single-day selection
        setCustomEnd(dateStr);
        setSelectingStart(true);
      } else {
        // Ensure start <= end by swapping if needed
        const [s, e] = dateStr < customStart
          ? [dateStr, customStart]
          : [customStart, dateStr];
        setCustomStart(s);
        setCustomEnd(e);
        setSelectingStart(true);
      }
      setPreset('custom');
    }
  };

  // Second visible month
  const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const year2 = viewMonth === 11 ? viewYear + 1 : viewYear;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const getDayClass = (dateStr: string): string => {
    const todayStr = toLocalISO(new Date());

    // Resolve the effective highlighted range
    let rStart = '';
    let rEnd = '';
    if (preset === 'custom') {
      rStart = customStart;
      rEnd = customEnd || (!selectingStart && hoverDate ? hoverDate : '');
      if (rStart && rEnd && rStart > rEnd) [rStart, rEnd] = [rEnd, rStart];
    } else {
      const r = getDateRangeForPreset(preset);
      rStart = r.start;
      rEnd = r.end;
    }

    const isRangeStart = dateStr === rStart && !!rEnd;
    const isRangeEnd = dateStr === rEnd && !!rStart;
    const isSingleDay = !!rStart && rStart === rEnd && dateStr === rStart;
    const isOnlyStart = dateStr === rStart && !rEnd && preset === 'custom';
    const inRange = !!rStart && !!rEnd && dateStr > rStart && dateStr < rEnd;
    const isToday = dateStr === todayStr;

    if (isRangeStart || isRangeEnd || isSingleDay || isOnlyStart) {
      return 'w-8 h-8 flex items-center justify-center text-xs rounded-full cursor-pointer bg-primary text-primary-foreground font-semibold';
    }
    if (inRange) {
      return 'w-8 h-8 flex items-center justify-center text-xs cursor-pointer bg-primary/20 text-foreground rounded-none';
    }
    if (isToday) {
      return 'w-8 h-8 flex items-center justify-center text-xs rounded-full cursor-pointer border border-primary text-primary hover:bg-primary/10 transition-colors';
    }
    return 'w-8 h-8 flex items-center justify-center text-xs rounded-full cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors';
  };

  const renderMonthGrid = (year: number, month: number) => {
    const days = buildMonthDays(year, month);
    return (
      <div className="select-none w-[224px]">
        <div className="grid grid-cols-7 mb-1">
          {DAY_KEYS.map(d => (
            <div key={d} className="w-8 h-6 flex items-center justify-center text-caption text-muted-foreground font-medium">
              {t(`ui.calendar.days.${d}`)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((dateStr, i) => (
            <div key={i} className="w-8 h-8 flex items-center justify-center">
              {dateStr ? (
                <button
                  type="button"
                  className={getDayClass(dateStr)}
                  onClick={() => handleDayClick(dateStr)}
                  onMouseEnter={() => { if (!selectingStart) setHoverDate(dateStr); }}
                  onMouseLeave={() => setHoverDate('')}
                >
                  {parseInt(dateStr.split('-')[2])}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const displayLabel = formatDisplayLabel(preset, customStart, customEnd);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {showLabel && (
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {'ចន្លោះកាលបរិច្ឆេទ'}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center gap-2 px-3 py-2 border border-input rounded-xl text-sm bg-card text-foreground hover:border-ring/60 hover:bg-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${showLabel ? 'h-10' : 'h-14'}`}
      >
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-left truncate font-medium">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className={`absolute z-50 top-full mt-1.5 ${align === 'right' ? 'right-0' : 'left-0'} bg-popover border border-border rounded-xl shadow-xl flex overflow-hidden animate-in fade-in-0 zoom-in-95`}>

          {/* Left: Quick presets */}
          <div className="flex flex-col gap-0.5 p-3 border-r border-border min-w-[130px]">
            <div className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {'ជម្រើសរហ័ស'}
            </div>
            {QUICK_PRESETS.map(opt => (
              <button
                key={opt.value || '__all__'}
                type="button"
                onClick={() => applyPreset(opt.value)}
                className={`text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${preset === opt.value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}

            {/* Applied custom range summary with Apply button */}
            {preset === 'custom' && customStart && customEnd && (
              <div className="mt-3 pt-2 border-t border-border">
                <div className="text-caption text-muted-foreground uppercase tracking-wider font-semibold mb-1 px-1">
                  {'បានជ្រើសរើស'}
                </div>
                <div className="px-1 text-xs text-foreground font-medium leading-5">
                  {customStart.split('-').reverse().join('/')}
                  <span className="text-muted-foreground"> – </span>
                  {customEnd.split('-').reverse().join('/')}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-2 w-full px-2 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {'អនុវត្ត'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Two-month calendar */}
          <div className="p-3">
            <div className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 h-4">
              {!selectingStart
                ? 'ចុចថ្ងៃដដែលសម្រាប់ ១ ថ្ងៃ ឬចុចថ្ងៃផ្សេងដើម្បីកំណត់ចន្លោះ'
                : customStart
                  ? 'ចុចដើម្បីចាប់ផ្តើមចន្លោះថ្មី'
                  : 'ចុចដើម្បីកំណត់ថ្ងៃចាប់ផ្តើម'}
            </div>

            {/* Month navigation header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <div className="flex gap-10 text-sm font-semibold text-foreground">
                <span>{t(`ui.calendar.months.${MONTH_KEYS[viewMonth]}`)} {viewYear}</span>
                <span>{t(`ui.calendar.months.${MONTH_KEYS[month2]}`)} {year2}</span>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Two month grids side by side */}
            <div className="flex gap-4">
              {renderMonthGrid(viewYear, viewMonth)}
              {renderMonthGrid(year2, month2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
