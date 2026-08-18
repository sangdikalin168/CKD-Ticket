import XLSX from 'xlsx-js-style';
import { ColumnDef } from '../types/datatable';

const thinBorder = {
  top: { style: 'thin' as const, color: { rgb: '000000' } },
  bottom: { style: 'thin' as const, color: { rgb: '000000' } },
  left: { style: 'thin' as const, color: { rgb: '000000' } },
  right: { style: 'thin' as const, color: { rgb: '000000' } },
};

const headerStyle: XLSX.CellStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '4472C4' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: thinBorder,
};

const cellStyle: XLSX.CellStyle = {
  font: { sz: 10 },
  alignment: { vertical: 'center', wrapText: true },
  border: thinBorder,
};

const titleStyle: XLSX.CellStyle = {
  font: { bold: true, sz: 14, color: { rgb: '1F2937' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

/**
 * Build a styled worksheet from rows + column definitions.
 * Shared by the single-sheet and multi-sheet exporters so formatting stays identical.
 */
function buildStyledSheet<T extends Record<string, any>>(
  data: T[],
  columns: ColumnDef<T>[],
  title?: string
): XLSX.WorkSheet {
  // Get exportable columns
  const exportableColumns = columns.filter(col => col.exportable !== false);
  const headers = exportableColumns.map(col => col.header);
  const titleOffset = title ? 1 : 0; // a title pushes the header + data down one row

  // Prepare data rows
  const rows = data.map(row =>
    exportableColumns.map(col => {
      const value = col.accessor ? col.accessor(row) : row[col.key];

      // Check if this is a currency column
      const isCurrencyColumn = /salary|amount|deduction|pay|gross|net/i.test(col.header);

      // Return numeric values for currency columns so Excel can format them
      if (isCurrencyColumn && !isNaN(Number(value)) && value !== null && value !== '') {
        return Number(value);
      }

      // Check if this looks like a numeric string with leading zeros (bank account)
      const stringValue = String(value ?? '');
      const hasLeadingZero = /^0\d+$/.test(stringValue);

      // For bank accounts, keep as string to preserve leading zeros
      if (hasLeadingZero && stringValue.length > 1) {
        return stringValue;
      }

      return value ?? '';
    })
  );

  // Create worksheet — title row (if any) spans all columns via a merge
  const wsData = title ? [[title], headers, ...rows] : [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  if (title) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: exportableColumns.length - 1 } }];
  }

  // Auto-width columns based on content
  const colWidths = exportableColumns.map((col, colIndex) => {
    const headerWidth = col.header.length;
    const dataWidths = rows.map(row => {
      const cellValue = String(row[colIndex] ?? '');
      const isCurrencyColumn = /salary|amount|deduction|pay|gross|net/i.test(col.header);
      if (isCurrencyColumn && !isNaN(Number(cellValue))) {
        return cellValue.length + 5;
      }
      return cellValue.length;
    });

    const maxWidth = Math.max(headerWidth, ...dataWidths);
    return { wch: Math.min(Math.max(maxWidth + 3, 10), 50) };
  });

  ws['!cols'] = colWidths;

  // Set row heights (title + header taller than data)
  ws['!rows'] = [
    ...(title ? [{ hpt: 30 }] : []),
    { hpt: 28 },
    ...rows.map(() => ({ hpt: 20 })),
  ];

  // Apply styles to all cells
  const headerRow = titleOffset; // header sits at row 0, or row 1 when titled
  const totalRows = titleOffset + 1 + rows.length;
  const totalCols = exportableColumns.length;

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        ws[cellRef] = { v: '', t: 's' };
      }

      if (title && r === 0) {
        ws[cellRef].s = titleStyle;
      } else if (r === headerRow) {
        ws[cellRef].s = headerStyle;
      } else {
        // Data rows
        const isCurrencyColumn = /salary|amount|deduction|pay|gross|net/i.test(exportableColumns[c].header);
        ws[cellRef].s = {
          ...cellStyle,
          alignment: {
            ...cellStyle.alignment,
            horizontal: (typeof ws[cellRef].v === 'number' ? 'right' : 'left') as 'right' | 'left',
          },
        };

        if (isCurrencyColumn && typeof ws[cellRef].v === 'number') {
          const isKhr = /khr|riel/i.test(exportableColumns[c].header);
          ws[cellRef].z = isKhr ? '#,##0" ៛"' : '$#,##0.00';
        }
      }
    }
  }

  return ws;
}

/**
 * Export data to Excel file (.xlsx) with table borders, auto-width, and formatting
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ColumnDef<T>[],
  fileName: string = 'export.xlsx',
  title?: string
): void {
  if (!data || data.length === 0) {
    return;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildStyledSheet(data, columns, title), 'Sheet1');
  XLSX.writeFile(wb, fileName);
}

export interface ExcelSheet<T extends Record<string, any>> {
  name: string;
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
}

/**
 * Export several sheets into a single .xlsx workbook — one tab per sheet.
 * Empty sheets are skipped; nothing is written if every sheet is empty.
 */
export function exportToExcelSheets<T extends Record<string, any>>(
  sheets: ExcelSheet<T>[],
  fileName: string = 'export.xlsx'
): void {
  const nonEmpty = sheets.filter(sheet => sheet.data && sheet.data.length > 0);
  if (nonEmpty.length === 0) {
    return;
  }

  const wb = XLSX.utils.book_new();
  for (const sheet of nonEmpty) {
    XLSX.utils.book_append_sheet(wb, buildStyledSheet(sheet.data, sheet.columns, sheet.title), sheet.name);
  }
  XLSX.writeFile(wb, fileName);
}
