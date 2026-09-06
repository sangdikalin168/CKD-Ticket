import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { TABLE_DENSITY } from './tableDensity';
import type { PageInfo, TableDensity } from '../../types/datatable';

/** Numbered page list with ellipses: 1 … 4 5 6 … 15 */
const getPageNumbers = (current: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) { pages.add(2); pages.add(3); pages.add(4); }
  if (current >= total - 2) { pages.add(total - 1); pages.add(total - 2); pages.add(total - 3); }
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
    out.push(sorted[i]);
  }
  return out;
};

export interface PaginationProps {
  pageInfo: PageInfo;
  onPageChange: (page: number) => void;
  /** Omit to hide the rows-per-page selector. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** `arrows` is first/prev/next/last; `numbered` lists page buttons with ellipses. */
  variant?: 'arrows' | 'numbered';
  density?: TableDensity;
  className?: string;
}

/**
 * Page navigation for any paged view. DataTable renders it as its footer;
 * views with a hand-built table use it directly so there is one pager
 * implementation rather than one per page.
 */
export function Pagination({
  pageInfo,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  variant = 'arrows',
  density = 'comfortable',
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const tokens = TABLE_DENSITY[density];
  const { current_page: page, page_size: size, total_items: total, total_pages: pages } = pageInfo;

  if (pages <= 0) return null;

  const from = ((page - 1) * size) + 1;
  const to = Math.min(page * size, total);

  const pageSizeSelect = onPageSizeChange && (
    <Select
      value={size.toString()}
      onValueChange={(v: string) => { onPageSizeChange(Number(v)); onPageChange(1); }}
    >
      <SelectTrigger className={cn('w-20', tokens.control, tokens.paginationText)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {pageSizeOptions.map((option) => (
          <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className={cn(tokens.pagination, className)}>
      {/* Mobile — stacked, always arrows: numbered buttons don't fit. */}
      <div className="md:hidden space-y-3">
        <div className="text-xs text-ink-soft text-center">
          {t('ui.dataTable.showingRange', { from, to, total })}
        </div>
        {onPageSizeChange && (
          <div className="flex items-center justify-center gap-2">
            <label className="text-xs text-ink-soft">{t('ui.dataTable.perPage')}</label>
            {pageSizeSelect}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" className="flex-1"
            onClick={() => onPageChange(page - 1)} disabled={!pageInfo.has_previous}>
            <ChevronLeft aria-hidden="true" />
            <span>{t('ui.dataTable.prev')}</span>
          </Button>
          <div className="px-3 py-1.5 text-xs text-ink-soft whitespace-nowrap">
            {page} / {pages}
          </div>
          <Button variant="outline" size="sm" className="flex-1"
            onClick={() => onPageChange(page + 1)} disabled={!pageInfo.has_next}>
            <span>{t('common.next')}</span>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn('text-ink-soft whitespace-nowrap', tokens.paginationText)}>
            {t('ui.dataTable.showingResults', { from, to, total })}
          </div>
          {onPageSizeChange && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <label className={cn('text-ink-soft whitespace-nowrap', tokens.paginationText)}>
                {t('ui.dataTable.itemsPerPage')}
              </label>
              {pageSizeSelect}
            </div>
          )}
        </div>

        {variant === 'numbered' ? (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={!pageInfo.has_previous}
              aria-label={t('ui.dataTable.previousPage')}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-soft hover:bg-wash hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            {getPageNumbers(page, pages).map((p, idx) => p === '…' ? (
              <span key={`gap-${idx}`} className="inline-flex items-center justify-center w-9 h-9 text-sm text-ink-soft">…</span>
            ) : (
              <button key={p} type="button" onClick={() => onPageChange(p)}
                aria-current={page === p ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-md text-sm font-medium transition-colors',
                  page === p ? 'bg-ink text-white' : 'text-ink hover:bg-wash'
                )}>
                {p}
              </button>
            ))}
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={!pageInfo.has_next}
              aria-label={t('ui.dataTable.nextPage')}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-soft hover:bg-wash hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className={tokens.control} title={t('ui.dataTable.firstPage')}
              onClick={() => onPageChange(1)} disabled={!pageInfo.has_previous}>
              <ChevronsLeft aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" className={tokens.control} title={t('ui.dataTable.previousPage')}
              onClick={() => onPageChange(page - 1)} disabled={!pageInfo.has_previous}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className={cn('text-ink-soft', tokens.paginationText)}>
                {t('ui.dataTable.pageOf', { current: page, total: pages })}
              </span>
            </div>
            <Button variant="outline" size="sm" className={tokens.control} title={t('ui.dataTable.nextPage')}
              onClick={() => onPageChange(page + 1)} disabled={!pageInfo.has_next}>
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" className={tokens.control} title={t('ui.dataTable.lastPage')}
              onClick={() => onPageChange(pages)} disabled={!pageInfo.has_next}>
              <ChevronsRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
