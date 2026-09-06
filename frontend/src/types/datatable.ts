import { ReactNode } from 'react';

export interface PageInfo {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page_info: PageInfo;
}

/** Row height / padding scale. `compact` is the Notion-style hairline grid. */
export type TableDensity = 'comfortable' | 'compact';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  hidden?: boolean; // Always hide from table view but include in exports
  defaultHidden?: boolean; // Toggleable via column-visibility control; starts hidden in the view
  noToggle?: boolean; // Keep out of the column-visibility control — always shown (identity/action columns)
  className?: string;
  align?: 'left' | 'center' | 'right'; // Aligns header and cell content (default: left)
}

export interface DataTableAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'paid';
  icon?: ReactNode;
}

export interface DataTableProps<T> {
  // Data
  data: T[];
  columns: ColumnDef<T>[];

  // Pagination — the footer reads its state from pageInfo; currentPage and
  // pageSize stay for callers that track them separately (they drive the fetch).
  pageInfo?: PageInfo;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];

  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: (value: string) => void;  // Alias for onSearchChange
  searchDebounceMs?: number;
  customFilters?: ReactNode;  // Custom filters to render after search box

  // Column visibility
  columnToggle?: boolean;  // Show a "Columns" control to show/hide columns (uses ColumnDef.defaultHidden for initial state)
  onColumnVisibilityChange?: (hiddenKeys: Set<string>) => void;  // Notifies parent when hidden columns change, so custom exports can drop them too

  // Sorting — provide for server-sorted data: DataTable stops sorting the
  // current page locally and reports header clicks instead (key=null means
  // the third-click "sort cleared" state).
  onSortChange?: (key: string | null, direction: 'asc' | 'desc') => void;

  // Actions
  actions?: DataTableAction[];
  rowActions?: (row: T) => DataTableAction[];
  onAdd?: () => void;  // Add new item callback
  addButtonText?: string;  // Text for add button

  // Export & Print
  exportable?: boolean;
  exportData?: T[] | (() => Promise<T[]>);  // Support both static data and async function
  exportColumns?: ColumnDef<T>[];  // Optional override columns used only for export (e.g. split fields, rounded values)
  exportFileName?: string;
  printable?: boolean;
  printTitle?: string;

  // Loading & Error states
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyState?: ReactNode;  // Replaces the plain empty message when the table needs an illustration or a call to action

  // Density — the user's choice persists across tables and sessions, so this is
  // only the starting point when they haven't picked one yet.
  defaultDensity?: TableDensity;
  densityToggle?: boolean;  // Show the density control (default true). When false, defaultDensity is forced and the stored preference is ignored.
  densityStorageKey?: string;  // Scope the stored preference to one table instead of app-wide

  // Styling
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  rowClassName?: (row: T) => string;  // Optional per-row className (e.g. dim excluded rows)
  onRowClick?: (row: T) => void;  // Makes the whole row activate (e.g. open a detail dialog); row actions still fire on their own
  minBodyHeight?: number | string;  // Reserve a minimum height for the table body so short lists don't collapse (number = px)
  maxBodyHeight?: number | string;  // Cap the body height — scrolls internally and pins the header row (number = px)
}

export interface ExportOptions {
  fileName: string;
  format: 'csv' | 'excel';
  data: any[];
  columns: ColumnDef<any>[];
}

export interface PrintOptions {
  title: string;
  data: any[];
  columns: ColumnDef<any>[];
}
