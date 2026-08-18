import { ColumnDef } from '../types/datatable';

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ColumnDef<T>[],
  fileName: string = 'export.csv'
): void {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from exportable columns (default to true if not specified)
  const exportableColumns = columns.filter(col => col.exportable !== false);
  const headers = exportableColumns.map(col => col.header);

  // Get rows data
  const rows = data.map(row =>
    exportableColumns.map(col => {
      const value = col.accessor ? col.accessor(row) : row[col.key];
      const stringValue = String(value ?? '');

      // Check if this is a currency column (by header name)
      const isCurrencyColumn = /salary|amount|deduction|pay|gross|net/i.test(col.header);

      // Check if this looks like a numeric string with leading zeros (bank account numbers)
      // Pattern: starts with 0 and contains only digits
      const hasLeadingZero = /^0\d+$/.test(stringValue);

      let finalValue = stringValue;

      // Format currency columns with $ symbol
      if (isCurrencyColumn && !isNaN(Number(value)) && value !== null && value !== '') {
        const numValue = Number(value);
        finalValue = `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      // If it has leading zeros, prefix with tab to force Excel to treat as text
      else if (hasLeadingZero && stringValue.length > 1) {
        finalValue = `\t${stringValue}`;
      }

      // Escape quotes and wrap in quotes if contains comma or newline
      if (finalValue.includes(',') || finalValue.includes('\n') || finalValue.includes('"')) {
        return `"${finalValue.replace(/"/g, '""')}"`;
      }
      return finalValue;
    })
  );

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy table data to clipboard as tab-separated values
 */
export async function copyToClipboard<T extends Record<string, any>>(
  data: T[],
  columns: ColumnDef<T>[]
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error('No data to copy');
  }

  // Get headers from exportable columns (default to true if not specified)
  const exportableColumns = columns.filter(col => col.exportable !== false);
  const headers = exportableColumns.map(col => col.header);

  // Get rows data
  const rows = data.map(row =>
    exportableColumns.map(col => {
      const value = col.accessor ? col.accessor(row) : row[col.key];
      return String(value ?? '');
    })
  );

  // Combine headers and rows with tabs
  const textContent = [
    headers.join('\t'),
    ...rows.map(row => row.join('\t'))
  ].join('\n');

  // Copy to clipboard
  await navigator.clipboard.writeText(textContent);
}

/**
 * Print table data
 */
export function printTable<T extends Record<string, any>>(
  data: T[],
  columns: ColumnDef<T>[],
  title: string = 'Data Table'
): void {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from exportable columns (default to true if not specified)
  const exportableColumns = columns.filter(col => col.exportable !== false);
  const headers = exportableColumns.map(col => col.header);

  // Get rows data
  const rows = data.map(row =>
    exportableColumns.map(col => {
      const value = col.accessor ? col.accessor(row) : row[col.key];
      return String(value ?? '');
    })
  );

  // Create HTML for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: 'Roboto', 'Khmer OS Content', Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            text-align: center;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 auto;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Open print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}

