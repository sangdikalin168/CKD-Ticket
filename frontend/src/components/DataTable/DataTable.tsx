import React, { useEffect, useRef, useState } from "react";
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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <img className="h-8 w-8 rounded-full object-cover" src={imageUrl} alt="" />
      <div>
        <div className="text-sm font-medium">{display_name}</div>
        <div className="text-xs text-muted-foreground">{username}</div>
      </div>
    </div>
  );
}

// ─── Debounced search input ───────────────────────────────────────────────────

function DebouncedInput({
  value: initial,
  onChange,
  debounce = 400,
  ...props
}: {
  value: string | number;
  onChange: (v: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initial);
  // What we last handed to the parent. Without this the effect below fires once
  // on mount (emitting the empty term) and again every time the parent echoes
  // the value back through `initial` — each emit costing a server round-trip and
  // a page reset. Only a genuinely new term should reach onChange.
  const lastEmitted = useRef(initial);

  useEffect(() => { setValue(initial); }, [initial]);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const t = setTimeout(() => {
      lastEmitted.current = value;
      onChange(value);
    }, debounce);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        {...props}
        value={value}
        type="text"
        className="pl-8 h-9 w-48"
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ArrowUp className="h-3 w-3 ml-1" />;
  if (sorted === "desc") return <ArrowDown className="h-3 w-3 ml-1" />;
  return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IChildProps {
  button?: React.ReactNode;
  data: RowData[];
  columns: any;
  /** Set true to disable client-side pagination and drive it from the parent */
  manualPagination?: boolean;
  /** Total page count — required when manualPagination=true */
  pageCount?: number;
  /** Total row count for the display label — required when manualPagination=true */
  totalRows?: number;
  /** Called whenever pageIndex or pageSize changes in server-side mode */
  onPageChange?: (pageIndex: number, pageSize: number) => void;
  /**
   * Pass this to search on the SERVER instead of in the browser. Required
   * alongside manualPagination: the client-side filter can only see the rows of
   * the current page, so on a paginated list it silently misses everything else.
   */
  onSearchChange?: (term: string) => void;
}

export default function DataTable({
  columns, data, button,
  manualPagination, pageCount: serverPageCount, totalRows: serverTotalRows, onPageChange,
  onSearchChange,
}: IChildProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 20 });

  // With server-side search the rows arriving are already filtered, so running
  // the fuzzy filter over them again would only drop valid matches (e.g. a phone
  // hit whose column the fuzzy matcher scores poorly).
  const serverSearch = !!onSearchChange;

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: {
      columnFilters,
      globalFilter: serverSearch ? "" : globalFilter,
      columnVisibility,
      pagination,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      setPagination(next);
      if (manualPagination) onPageChange?.(next.pageIndex, next.pageSize);
    },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: !!manualPagination,
    pageCount: manualPagination ? (serverPageCount ?? -1) : undefined,
  });

  const { pageIndex, pageSize } = pagination;
  const totalRows = manualPagination
    ? (serverTotalRows ?? 0)
    : table.getFilteredRowModel().rows.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="space-y-3">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {button}

        <DebouncedInput
          value={globalFilter}
          onChange={(v) => {
            const term = String(v);
            setGlobalFilter(term);
            if (onSearchChange) {
              // The parent restarts its query at offset 0, so the pager here has
              // to follow. Otherwise searching from page 12 fetches page 1 while
              // the footer still reads "page 13" and Next jumps from the stale index.
              setPagination((p) => ({ ...p, pageIndex: 0 }));
              onSearchChange(term);
            }
          }}
          placeholder="ស្វែងរក..."
        />

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              Visibility <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().map((col) => (
              <DropdownMenuItem
                key={col.id}
                onSelect={(e) => e.preventDefault()}
                className="gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={col.getIsVisible()}
                  onCheckedChange={col.getToggleVisibilityHandler()}
                />
                <span className="text-sm">{col.id}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right-aligned row count */}
        <span className="ml-auto text-xs text-muted-foreground">
          {totalRows} rows
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2.5"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center ${header.column.getCanSort() ? "cursor-pointer select-none hover:text-foreground" : ""}`}
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
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                    គ្មានទិន្នន័យ
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-2 text-sm">
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {totalRows > 0 ? `បង្ហាញ ${from}–${to} នៃ ${totalRows}` : "គ្មានទិន្នន័យ"}
        </p>

        <div className="flex items-center gap-3">
          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-5" />

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="text-xs text-muted-foreground px-2">
              {pageIndex + 1} / {table.getPageCount() || 1}
            </span>

            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
