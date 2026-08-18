import { TableDensity } from '../../types/datatable';

/**
 * Presentation tokens per row density.
 *
 * `comfortable` reproduces the table's long-standing look. `compact` is a
 * Notion-style ledger: hairline column rules instead of zebra stripes,
 * sentence-case headers, tabular numerals, and roughly 40% more rows per screen.
 */
export interface TableDensityTokens {
  toolbar: string;
  control: string;
  headCell: string;
  bodyCell: string;
  rowNumberCell: string;
  rowGrid: string;
  divider: string;
  rowHover: string;
  zebra: boolean;
  subtleSortIcons: boolean;
  mobileCard: string;
  mobileRow: string;
  mobileLabel: string;
  mobileValue: string;
  pagination: string;
  paginationText: string;
}

export const TABLE_DENSITY: Record<TableDensity, TableDensityTokens> = {
  comfortable: {
    toolbar: 'p-2 md:p-3',
    control: 'h-9',
    headCell: 'px-2 md:px-3 py-1.5 md:py-2 text-xs uppercase tracking-wider',
    bodyCell: 'px-2 md:px-3 py-1 md:py-1.5 text-xs',
    rowNumberCell: 'w-[50px]',
    rowGrid: '',
    divider: 'divide-border',
    rowHover: 'hover:bg-muted/30',
    zebra: true,
    subtleSortIcons: false,
    mobileCard: 'p-3',
    mobileRow: 'py-1.5',
    mobileLabel: 'text-xs uppercase',
    mobileValue: 'text-sm',
    pagination: 'px-3 md:px-4 py-2 md:py-3',
    paginationText: 'text-sm',
  },
  compact: {
    toolbar: 'px-2 py-1.5',
    control: 'h-8',
    headCell: 'px-2 py-1 text-caption normal-case tracking-normal',
    bodyCell: 'px-2 py-[3px] text-caption leading-[17px] tabular-nums',
    rowNumberCell: 'w-[38px]',
    rowGrid: 'divide-x divide-border/60',
    divider: 'divide-border/60',
    rowHover: 'hover:bg-accent/50',
    zebra: false,
    subtleSortIcons: true,
    mobileCard: 'px-3 py-2',
    mobileRow: 'py-0.5',
    mobileLabel: 'text-caption uppercase',
    mobileValue: 'text-xs',
    pagination: 'px-2 md:px-3 py-1.5',
    paginationText: 'text-xs',
  },
};
