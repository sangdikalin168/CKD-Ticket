import { ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Copy, FileSpreadsheet, Plus, Printer } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Skeleton } from './skeleton';
import { ColumnDef, DataTableAction, DataTableProps } from '../../types/datatable';
import { copyToClipboard, printTable } from '../../utils/dataTableUtils';
import { exportToExcel } from '../../utils/excelExport';
import { useDebounce } from '../../hooks/useDebounce';
import { useTableDensity } from '../../hooks/useTableDensity';
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown';
import { DensityToggle } from './DensityToggle';
import { Pagination } from './Pagination';
import { TABLE_DENSITY } from './tableDensity';

type SortDirection = 'asc' | 'desc';
type TableState = 'loading' | 'error' | 'empty';

const toCssLength = (value?: number | string) =>
  value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value;

const rowAlignment = (align?: ColumnDef<any>['align']) =>
  align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

const textAlignment = (align?: ColumnDef<any>['align']) =>
  align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';

/** Colour for a row action, in both the desktop table and the mobile cards. */
const rowActionTone = (variant: DataTableAction['variant']) => {
  if (variant === 'destructive') {
    return { desktop: 'text-void hover:text-void/70', mobile: 'text-void hover:bg-void-tint' };
  }
  if (variant === 'success') {
    return { desktop: 'text-paid hover:text-paid/70', mobile: 'text-paid hover:bg-paid-tint' };
  }
  return { desktop: 'text-ink hover:text-ink/60', mobile: 'text-ink hover:bg-wash' };
};

function renderCellValue<T extends Record<string, any>>(column: ColumnDef<T>, row: T): ReactNode {
  if (column.render) return column.render(row);
  if (column.accessor) return column.accessor(row);
  return row[column.key];
}

function SortIndicator({ direction, subtle }: { direction: SortDirection | null; subtle: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'ml-0.5 inline-flex flex-col transition-opacity',
        subtle && !direction && 'opacity-0 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100'
      )}
    >
      <svg
        className={cn('-mb-1 h-3 w-3', direction === 'asc' ? 'text-ink' : 'text-ink-soft/30')}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7 14l5-5 5 5z" />
      </svg>
      <svg
        className={cn('-mt-1 h-3 w-3', direction === 'desc' ? 'text-ink' : 'text-ink-soft/30')}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </span>
  );
}

function TableStatus({ state, message, columns }: { state: TableState; message: string; columns: number }) {
  if (state === 'loading') {
    // Skeleton rows keep the table's shape while the figures arrive.
    return (
      <div className="px-3 py-2" role="status" aria-live="polite">
        <span className="sr-only">{message}</span>
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="flex items-center gap-3 py-1.5">
            {Array.from({ length: Math.min(Math.max(columns, 2), 6) }).map((__, c) => (
              <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-8' : 'flex-1')} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-void" role="alert">
        <AlertCircle className="h-8 w-8" aria-hidden="true" />
        <p className="text-center text-sm text-ink">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-ink-soft">{message}</p>
    </div>
  );
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pageInfo,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  searchable = true,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  onSearch,
  searchDebounceMs = 500,
  customFilters,
  columnToggle = false,
  onColumnVisibilityChange,
  onSortChange,
  actions = [],
  rowActions,
  onAdd,
  addButtonText,
  exportable = true,
  exportData,
  exportColumns,
  exportFileName = 'export.csv',
  printable = true,
  printTitle,
  loading = false,
  error = null,
  emptyMessage,
  emptyState,
  defaultDensity = 'comfortable',
  densityToggle = true,
  densityStorageKey,
  className = '',
  striped = true,
  hoverable = true,
  rowClassName,
  onRowClick,
  minBodyHeight,
  maxBodyHeight,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.searchPlaceholder');
  const resolvedAddButtonText = addButtonText ?? t('ui.dataTable.addNew');
  const resolvedPrintTitle = printTitle ?? t('ui.dataTable.printTitle');
  const resolvedEmptyMessage = emptyMessage ?? t('common.noData');
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const debouncedSearchValue = useDebounce(localSearchValue, searchDebounceMs);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(
    () => new Set(columns.filter(col => col.defaultHidden && !col.hidden).map(col => col.key))
  );

  // Pages that hide the control opt out of the shared preference entirely.
  const [storedDensity, setStoredDensity] = useTableDensity(defaultDensity, densityStorageKey);
  const density = densityToggle ? storedDensity : defaultDensity;
  const tokens = TABLE_DENSITY[density];
  const showZebra = striped && tokens.zebra;
  const stickyHead = maxBodyHeight ? 'sticky top-0 z-10 bg-wash' : '';

  const handleSort = (columnKey: string) => {
    let nextKey: string | null = columnKey;
    let nextDirection: SortDirection = 'asc';
    if (sortKey === columnKey) {
      if (sortDirection === 'asc') {
        nextDirection = 'desc';
      } else {
        nextKey = null; // Third click: reset sort
      }
    }
    setSortKey(nextKey);
    setSortDirection(nextDirection);
    onSortChange?.(nextKey, nextDirection);
  };

  // Sort data client-side. Server-sorted tables (onSortChange) arrive already
  // ordered across ALL pages — re-sorting the visible page would undo that.
  const sortedData = (() => {
    if (onSortChange) return data;
    if (!sortKey || !data || data.length === 0) return data;
    const col = columns.find(c => c.key === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const valA = col.accessor ? col.accessor(a) : a[col.key];
      const valB = col.accessor ? col.accessor(b) : b[col.key];

      // Handle null/undefined
      if (valA == null && valB == null) return 0;
      if (valA == null) return sortDirection === 'asc' ? -1 : 1;
      if (valB == null) return sortDirection === 'asc' ? 1 : -1;

      // Numeric comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      const cmp = strA.localeCompare(strB);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  })();

  // Keep the parent in sync with what's hidden so its custom export can drop the same columns
  useEffect(() => {
    onColumnVisibilityChange?.(hiddenColumnKeys);
  }, [hiddenColumnKeys]);

  // Columns the visibility control can toggle (export-only `hidden` and pinned
  // identity/action `noToggle` columns stay out of it)
  const toggleableColumns = columns.filter(col => !col.hidden && !col.noToggle);

  // Filter out hidden columns for table display. `noToggle` columns are pinned
  // visible so a user can never hide an identity or action column.
  const visibleColumns = columns.filter(
    col => !col.hidden && (col.noToggle || !hiddenColumnKeys.has(col.key))
  );

  // Compute pagination-aware row number offset
  const rowNumberOffset = pageInfo ? (pageInfo.current_page - 1) * pageInfo.page_size : 0;

  const tableState: TableState | null = loading
    ? 'loading'
    : error
      ? 'error'
      : !sortedData || sortedData.length === 0
        ? 'empty'
        : null;
  const tableStateMessage = loading ? t('common.loading') : error ? error : resolvedEmptyMessage;

  const tableStatusNode = tableState === 'empty' && emptyState
    ? <div className="flex items-center justify-center py-12">{emptyState}</div>
    : tableState && <TableStatus state={tableState} message={tableStateMessage} columns={visibleColumns.length + 1} />;

  // Sync debounced value with parent component
  useEffect(() => {
    const callback = onSearchChange || onSearch;
    if (callback && debouncedSearchValue !== searchValue) {
      callback(debouncedSearchValue);
    }
  }, [debouncedSearchValue]);

  // Sync local value when external searchValue changes
  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  const handleExport = async () => {
    try {
      let dataToExport: T[];

      if (typeof exportData === 'function') {
        // Show loading toast
        showSuccessToast(t('ui.dataTable.fetchingExport'));
        dataToExport = await exportData();

        if (dataToExport.length === 0) {
          showErrorToast(t('ui.dataTable.noExportData'));
          return;
        }
      } else {
        dataToExport = exportData || data;
      }

      // Change extension from .csv to .xlsx
      const fileName = exportFileName.replace(/\.csv$/i, '.xlsx');
      exportToExcel(dataToExport, exportColumns || columns, fileName);
      showSuccessToast(t('ui.dataTable.exportSuccess', { count: dataToExport.length }));
    } catch (err) {
      showErrorToast(t('ui.dataTable.exportFailed'));
      console.error('Export error:', err);
    }
  };

  const handlePrint = async () => {
    try {
      let dataToPrint: T[];

      if (typeof exportData === 'function') {
        showSuccessToast(t('ui.dataTable.fetchingPrint'));
        dataToPrint = await exportData();

        if (dataToPrint.length === 0) {
          showErrorToast(t('ui.dataTable.noPrintData'));
          return;
        }
      } else {
        dataToPrint = exportData || data;
      }

      printTable(dataToPrint, columns, resolvedPrintTitle);
    } catch (err) {
      showErrorToast(t('ui.dataTable.printFailed'));
      console.error('Print error:', err);
    }
  };

  const handleCopy = async () => {
    try {
      let dataToCopy: T[];

      if (typeof exportData === 'function') {
        showSuccessToast(t('ui.dataTable.fetchingCopy'));
        dataToCopy = await exportData();

        if (dataToCopy.length === 0) {
          showErrorToast(t('ui.dataTable.noCopyData'));
          return;
        }
      } else {
        dataToCopy = exportData || data;
      }

      await copyToClipboard(dataToCopy, columns);
      showSuccessToast(t('ui.dataTable.copySuccess'));
    } catch {
      showErrorToast(t('ui.dataTable.copyFailed'));
    }
  };

  // With every control switched off the toolbar is a blank ~25px band — worse,
  // it gets captured by pages that print/PDF the table. Render it only when it
  // will actually contain something.
  const hasToolbar =
    searchable || !!customFilters || densityToggle ||
    (columnToggle && toggleableColumns.length > 0) ||
    exportable || printable || actions.length > 0 || !!onAdd;

  return (
    <div className={`bg-card rounded-lg border border-rule ${className}`}>
      {/* Toolbar */}
      {hasToolbar && (
      <div className={cn('border-b border-rule', tokens.toolbar)}>
        {/* All toolbar items in one row */}
        <div className="flex items-end gap-3 flex-wrap">
          {/* Search */}
          {searchable && (
            <div className={`min-w-[180px] ${customFilters ? 'w-[250px]' : 'flex-1 max-w-sm'}`}>
              <Input
                type="search"
                placeholder={resolvedSearchPlaceholder}
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                className={cn('w-full', tokens.control)}
              />
            </div>
          )}

          {/* Custom Filters */}
          {customFilters && (
            <div className="flex-1 min-w-fit">
              {customFilters}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Row density — the grid it controls is the desktop table, and the
                mobile toolbar is already tight, so the control stays desktop-only */}
            {densityToggle && (
              <DensityToggle
                value={density}
                onChange={setStoredDensity}
                className={cn('hidden md:inline-flex', tokens.control)}
              />
            )}

            {/* Column visibility */}
            {columnToggle && toggleableColumns.length > 0 && (
              <ColumnVisibilityDropdown
                columns={toggleableColumns.map(col => ({ key: col.key, header: col.header }))}
                hiddenKeys={hiddenColumnKeys}
                onChange={setHiddenColumnKeys}
                triggerClassName={tokens.control}
              />
            )}

            {/* Add button */}
            {onAdd && (
              <Button
                onClick={onAdd}
                size="sm"
                className={cn('whitespace-nowrap', tokens.control)}
              >
                <Plus aria-hidden="true" />
                <span>{resolvedAddButtonText}</span>
              </Button>
            )}

            {/* Custom actions */}
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                size="sm"
                className={cn('whitespace-nowrap', tokens.control)}
              >
                {action.icon}
                <span>{action.label}</span>
              </Button>
            ))}

            {/* Export buttons */}
            {exportable && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  size="sm"
                  title={t('ui.dataTable.exportToExcel')}
                  className={cn('whitespace-nowrap', tokens.control)}
                >
                  <FileSpreadsheet aria-hidden="true" />
                  <span>{t('common.export')}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  size="sm"
                  title={t('ui.dataTable.copyToClipboard')}
                  className={cn('whitespace-nowrap', tokens.control)}
                >
                  <Copy aria-hidden="true" />
                  <span>{t('ui.dataTable.copy')}</span>
                </Button>
              </>
            )}

            {/* Print button */}
            {printable && (
              <Button
                variant="outline"
                onClick={handlePrint}
                size="sm"
                title={t('ui.dataTable.printTable')}
                className={cn('whitespace-nowrap', tokens.control)}
              >
                <Printer aria-hidden="true" />
                <span>{t('common.print')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden">
        {tableState ? (
          tableStatusNode
        ) : (
          <div className="divide-y divide-rule">
            {sortedData.map((row, rowIndex) => (
              <div
                key={rowIndex}
                onClick={onRowClick && (() => onRowClick(row))}
                className={cn(
                  'transition-colors hover:bg-wash/60',
                  tokens.mobileCard,
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row)
                )}
              >
                <div className={cn('flex justify-between', tokens.mobileRow)}>
                  <span className={cn('font-medium text-ink-soft', tokens.mobileLabel)}>
                    {t('ui.dataTable.no')}
                  </span>
                  <span className={cn('ml-2 text-right text-ink', tokens.mobileValue)}>
                    {rowNumberOffset + rowIndex + 1}
                  </span>
                </div>
                {visibleColumns.map((column, colIndex) => (
                  <div key={colIndex} className={cn('flex justify-between', tokens.mobileRow)}>
                    <span className={cn('font-medium text-ink-soft', tokens.mobileLabel)}>
                      {column.header}
                    </span>
                    <span className={cn('ml-2 text-right text-ink', tokens.mobileValue)}>
                      {renderCellValue(column, row)}
                    </span>
                  </div>
                ))}
                {rowActions && (
                  <div
                    className="flex gap-2 mt-2 pt-2 border-t border-rule"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rowActions(row).map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        type="button"
                        onClick={action.onClick}
                        title={action.label}
                        aria-label={action.label}
                        className={cn(
                          'inline-flex min-h-9 min-w-9 items-center justify-center rounded px-2 text-xs transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          rowActionTone(action.variant).mobile
                        )}
                      >
                        {action.icon ? action.icon : action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div
        className={cn('hidden md:block overflow-x-auto', maxBodyHeight && 'overflow-y-auto')}
        style={{ minHeight: toCssLength(minBodyHeight), maxHeight: toCssLength(maxBodyHeight) }}
      >
        {tableState ? (
          tableStatusNode
        ) : (
          <table className={cn('min-w-full divide-y', tokens.divider)}>
            <thead className="bg-wash">
              <tr className={tokens.rowGrid}>
                <th
                  scope="col"
                  className={cn(
                    'text-left font-medium text-ink-soft',
                    tokens.headCell,
                    tokens.rowNumberCell,
                    stickyHead
                  )}
                >
                  {t('ui.dataTable.no')}
                </th>
                {visibleColumns.map((column, index) => {
                  const isSortable = column.sortable !== false;
                  const activeDirection = sortKey === column.key ? sortDirection : null;
                  return (
                    <th
                      key={index}
                      scope="col"
                      aria-sort={
                        !isSortable
                          ? undefined
                          : activeDirection === 'asc'
                            ? 'ascending'
                            : activeDirection === 'desc'
                              ? 'descending'
                              : 'none'
                      }
                      className={cn(
                        'text-left font-medium text-ink-soft',
                        tokens.headCell,
                        stickyHead,
                        column.className
                      )}
                    >
                      {isSortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column.key)}
                          className={cn(
                            'group/sort flex w-full items-center gap-1 rounded-sm transition-colors hover:text-ink',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                            rowAlignment(column.align)
                          )}
                        >
                          {column.header}
                          <SortIndicator direction={activeDirection} subtle={tokens.subtleSortIcons} />
                        </button>
                      ) : (
                        <div className={cn('flex items-center gap-1', rowAlignment(column.align))}>
                          {column.header}
                        </div>
                      )}
                    </th>
                  );
                })}
                {rowActions && (
                  <th
                    scope="col"
                    className={cn('text-left font-medium text-ink-soft', tokens.headCell, stickyHead)}
                  >
                    {t('common.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className={cn('bg-card divide-y', tokens.divider)}>
              {sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={onRowClick && (() => onRowClick(row))}
                  className={cn(
                    tokens.rowGrid,
                    showZebra && rowIndex % 2 === 0 && 'bg-wash/40',
                    hoverable && cn('transition-colors', tokens.rowHover),
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row)
                  )}
                >
                  <td className={cn('whitespace-nowrap text-ink-soft', tokens.bodyCell, tokens.rowNumberCell)}>
                    {rowNumberOffset + rowIndex + 1}
                  </td>
                  {visibleColumns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn(
                        'whitespace-nowrap text-ink',
                        tokens.bodyCell,
                        textAlignment(column.align),
                        column.className
                      )}
                    >
                      {renderCellValue(column, row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td
                      className={cn('whitespace-nowrap font-medium', tokens.bodyCell)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        {rowActions(row).map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            type="button"
                            onClick={action.onClick}
                            title={action.label}
                            aria-label={action.label}
                            className={cn(
                              'rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                              rowActionTone(action.variant).desktop
                            )}
                          >
                            {action.icon ? action.icon : action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pageInfo && (
        <Pagination
          pageInfo={pageInfo}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          density={density}
          className="border-t border-rule"
        />
      )}
    </div>
  );
}
