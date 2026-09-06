/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import React, { useEffect } from "react";
import {
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { ArrowUp, ArrowDown, ArrowUpDown, Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * What a column may declare about its own presentation. Column priority and
 * figure alignment live here rather than in every cell renderer, so a ledger
 * column says "this is money" once and the table shell does the rest.
 */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Right-align the column — for a tabular figure. */
    align?: "right";
    /** Never wrap the cell: a figure that wraps stops being comparable. */
    nowrap?: boolean;
    /** Drop the column out of the way below this breakpoint. */
    hideBelow?: "sm" | "md";
  }
}

// ─── Fuzzy filter ─────────────────────────────────────────────────────────────

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

// ─── Avatar cell helper ───────────────────────────────────────────────────────

type AvatarCellProps = { display_name: string; username: string; imageUrl: string };

export function AvatarCell({ display_name, username, imageUrl }: AvatarCellProps) {
  return (
    <div className="flex items-center gap-3">
      <img className="h-8 w-8 rounded-full border border-rule object-cover" src={imageUrl} alt="" />
      <div>
        <div className="text-sm font-medium text-ink">{display_name}</div>
        <div className="text-xs text-ink-soft">{username}</div>
      </div>
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ArrowUp className="ml-1 h-3 w-3" aria-hidden="true" />;
  if (sorted === "desc") return <ArrowDown className="ml-1 h-3 w-3" aria-hidden="true" />;
  return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" aria-hidden="true" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IChildProps {
  data: RowData[];
  columns: any;
  /** Draw skeleton rows in the table's own shape instead of the body. */
  loading?: boolean;
  /** What this ledger is called when it is still empty. */
  emptyTitle?: string;
  /** One line teaching where the first row comes from. */
  emptyHint?: string;
}

/**
 * The member's ledgers: a compact tanstack table in the system's table shell —
 * a quiet wash header band, hairline rows and a wash hover.
 *
 * A column may carry `meta: { align: "right" }` to right-align a tabular
 * figure, and `meta: { hideBelow: "sm" | "md" }` to drop out of the way on a
 * narrow screen; both are read here so a caller never restyles a cell itself.
 */
export default function DataTable({
  columns,
  data,
  loading = false,
  emptyTitle = "គ្មានទិន្នន័យ",
  emptyHint,
}: IChildProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: data ?? [],
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { columnFilters, globalFilter, columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  useEffect(() => { table.setPageSize(20); }, [table]);

  // Column priority and figure alignment, declared on the column rather than
  // hand-written into every cell.
  const colClass = (column: any) => {
    const meta = column?.columnDef?.meta ?? {};
    return cn(
      meta.align === "right" && "text-right",
      meta.nowrap && "whitespace-nowrap",
      meta.hideBelow === "sm" && "hidden sm:table-cell",
      meta.hideBelow === "md" && "hidden md:table-cell"
    );
  };

  const visibleColumnCount = table.getVisibleFlatColumns().length || columns.length;

  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className={colClass(header.column)}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center",
                          header.column.columnDef.meta?.align === "right" && "justify-end",
                          header.column.getCanSort() && "cursor-pointer select-none hover:text-ink"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon sorted={header.column.getIsSorted()} />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount} className="p-0">
                  <SkeletonRows rows={5} />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount} className="p-0">
                  <EmptyState icon={Inbox} title={emptyTitle} description={emptyHint} />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={colClass(cell.column)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
