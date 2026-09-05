// To use PDF export, run:
// npm install jspdf jspdf-autotable
// To use html2pdf.js for Unicode/Khmer PDF export:
// npm install html2pdf.js
import html2pdf from "html2pdf.js";
import * as XLSX from 'xlsx';
import { useTranslation } from "react-i18next";
import { FileDown, FileSpreadsheet, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput } from "@/components/ui/DateInput";
import { Label } from "@/components/ui/Label";
import { DataTable } from "@/components/ui/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-line";
import type { ColumnDef } from "@/types/datatable";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardSection } from "@/components/board/BoardSection";
import { MagnetDot } from "@/components/board/MagnetChip";
import { formatCount } from "@/lib/money";
const CUSTOMER_SCAN_REPORT_QUERY = gql`
  query CustomerScanReport($toDate: String!, $fromDate: String!, $memberId: Float!) {
    customerScanReport(toDate: $toDate, fromDate: $fromDate, memberId: $memberId) {
      member_id
      FromDate
      ToDate
      ScanLog {
        scanDate
      }
    }
  }
`;
import React, { useState, useRef } from "react";
import { gql, useQuery } from "@apollo/client";

// GetCustomers has required limit/offset since the member list was paged;
// this dropdown wants every customer, so ask for one very large page.
const CUSTOMERS = gql`
  query CustomerReportCustomers {
    GetCustomers(limit: 100000, offset: 0) {
      customer_id
      created_date
      created_by
      customer_code
      customer_name
      phone
      gender
      image_path
      end_membership_date
    }
  }
`;

const ACTIVE_CUSTOMERS_QUERY = gql`
  query ActiveCustomers {
    activeCustomers {
      total
      customers {
        customer_id
        created_date
        created_by
        customer_code
        customer_name
        phone
        gender
        image_path
        end_membership_date
      }
    }
  }
`;

// GraphQL query to fetch customers whose memberships expire on a specific date
const EXPIRING_CUSTOMERS_QUERY = gql`
  query ExpiringCustomersOnDate($fromDate: String!, $toDate: String!) {
    expiringCustomersOnDate(fromDate: $fromDate, toDate: $toDate) {
      total
      customers {
        customer_id
        created_date
        customer_name
        phone
        gender
        image_path
        end_membership_date
      }
    }
  }
`;

type ScanLogRow = {
  scanDate: string;
};

type CustomerRow = {
  customer_id: number;
  customer_name: string;
  phone: string;
  gender?: string;
  created_date?: string;
  end_membership_date?: string;
};

// Format date: dd-mm-yyyy hh:mm tt
const formatScanDate = (value: string) => {
  const dateObj = new Date(value);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

/** A figure on the board with its label written beside it. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-baseline gap-3 rounded-lg border border-rule bg-card px-4 py-3">
      <span className="text-caption text-ink-soft">{label}</span>
      <span className="text-heading font-black leading-none text-ink">{value}</span>
    </div>
  );
}

export const CustomerReport = () => {
  const { t } = useTranslation();
  // Ref for scan log section
  const scanLogRef = useRef<HTMLDivElement>(null);


  // Tab state: 'active', 'expiring', or 'scan'
  const [selectedTab, setSelectedTab] = useState<'active' | 'expiring' | 'scan'>('active');

  // Query for all customers
  const { data: dataCustomers } = useQuery(CUSTOMERS);

  // Debounced search state for Scan Report
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchClicked, setSearchClicked] = useState(false);

  // Query for scan report (only runs if all fields are filled and search is clicked)
  const {
    loading: loadingScan,
    error: errorScan,
    data: dataScan
  } = useQuery(CUSTOMER_SCAN_REPORT_QUERY, {
    variables: {
      memberId: selectedCustomer?.customer_id,
      fromDate,
      toDate
    },
    skip: !selectedCustomer || !fromDate || !toDate || !searchClicked,
    fetchPolicy: "network-only"
  });

  // Debounce effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue]);

  // Filter customers for dropdown
  const customerList = dataCustomers?.GetCustomers || [];
  const filteredCustomers = debouncedValue
    ? customerList.filter((c: any) => {
      const val = debouncedValue.toLowerCase();
      return (
        c.customer_id?.toString().includes(val) ||
        c.customer_name?.toLowerCase().includes(val) ||
        c.phone?.toLowerCase().includes(val)
      );
    })
    : [];

  // Query for active customers
  const { loading: loadingActive, error: errorActive, data: dataActive } = useQuery(ACTIVE_CUSTOMERS_QUERY);
  const [showDetails, setShowDetails] = useState(false);
  // DataTable never filters — the active members list is long, so the parent filters it.
  const [activeSearch, setActiveSearch] = useState("");

  // Query for expiring customers based on fromDate and toDate
  const { loading: loadingExpiring, error: errorExpiring, data: dataExpiring } = useQuery(EXPIRING_CUSTOMERS_QUERY, {
    variables: { fromDate, toDate },
    skip: !fromDate || !toDate, // Skip query if no date is provided
  });

  // Loading / error state of the current tab, rendered below the tab bar.
  // An early return here used to replace the whole page, so one failing
  // query hid the tabs and the Expiring tab's date fields with it.
  const tabLoading = (selectedTab === 'active' && loadingActive) || (selectedTab === 'expiring' && loadingExpiring);
  const tabError = selectedTab === 'active' ? errorActive : selectedTab === 'expiring' ? errorExpiring : undefined;

  // Extract data for both queries
  const { total: totalActive, customers: customersActive } = dataActive?.activeCustomers || { total: 0, customers: [] };
  const { total: totalExpiring, customers: customersExpiring } = dataExpiring?.expiringCustomersOnDate || { total: 0, customers: [] };

  // ----- Table rows & columns -----
  const scanLogRows: ScanLogRow[] = dataScan?.customerScanReport?.ScanLog || [];

  const scanLogColumns: ColumnDef<ScanLogRow>[] = [
    {
      key: 'scanDate',
      header: 'Scan Date',
      sortable: true,
      // Sort on the raw timestamp, display the formatted one.
      accessor: (row) => new Date(row.scanDate).getTime(),
      render: (row) => formatScanDate(row.scanDate),
    },
  ];

  const activeRows: CustomerRow[] = customersActive || [];
  const activeSearchTerm = activeSearch.trim().toLowerCase();
  const filteredActiveRows: CustomerRow[] = activeSearchTerm
    ? activeRows.filter((customer) =>
      customer.customer_name?.toLowerCase().includes(activeSearchTerm) ||
      customer.phone?.toLowerCase().includes(activeSearchTerm) ||
      String(customer.customer_id ?? '').includes(activeSearchTerm)
    )
    : activeRows;

  const activeCustomerColumns: ColumnDef<CustomerRow>[] = [
    { key: 'customer_name', header: 'Name', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'gender', header: 'Gender', sortable: true },
    { key: 'created_date', header: 'Created', sortable: true },
    { key: 'end_membership_date', header: 'EndDate', sortable: true },
  ];

  const expiringRows: CustomerRow[] = customersExpiring || [];

  const expiringCustomerColumns: ColumnDef<CustomerRow>[] = [
    { key: 'customer_id', header: 'ID', sortable: true },
    { key: 'customer_name', header: 'Name', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'end_membership_date', header: 'Expire', sortable: true },
  ];

  const exportToExcel = (customers, fromDate, toDate) => {
    // Prepare the data for Excel
    const data = customers.map(customer => ({
      'Customer ID': customer.customer_id,
      'Name': customer.customer_name,
      'Phone': customer.phone,
      'Expiration Date': customer.end_membership_date,
    }));

    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Define headers and set column widths
    const columnWidths = [
      { wch: 15 }, // Customer ID
      { wch: 30 }, // Name
      { wch: 20 }, // Phone
      { wch: 20 }, // Expiration Date
    ];
    ws['!cols'] = columnWidths;

    // Create a workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expiring Customers');

    // Generate filename with sanitized date range
    const sanitizedFromDate = fromDate.replace(/[^\w\d]/g, '_');
    const sanitizedToDate = toDate.replace(/[^\w\d]/g, '_');
    const filename = `expiring-customers-${sanitizedFromDate}-to-${sanitizedToDate}.xlsx`;

    // Export to Excel
    XLSX.writeFile(wb, filename);
  };

  const exportScanLogPdf = () => {
    if (!scanLogRef.current) {
      alert('No scan log to export.');
      return;
    }
    // Sanitize name for filename (remove special chars, spaces to _)
    const name = selectedCustomer?.customer_name
      ? selectedCustomer.customer_name.replace(/[^\w\dក-៿]+/g, '_')
      : 'customer';
    const id = selectedCustomer?.customer_id || '';
    const filename = `scan-log-${name}-${id}.pdf`;
    html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(scanLogRef.current)
      .save();
  };

  const dateFields = (
    <>
      <div className="w-40 space-y-1.5">
        <Label htmlFor="cr-from">From Date</Label>
        <DateInput
          id="cr-from"
          name="fromDate"
          value={fromDate}
          onChange={e => {
            setFromDate(e.target.value);
            setSearchClicked(false);
          }}
        />
      </div>
      <div className="w-40 space-y-1.5">
        <Label htmlFor="cr-to">To Date</Label>
        <DateInput
          id="cr-to"
          name="toDate"
          value={toDate}
          onChange={e => {
            setToDate(e.target.value);
            setSearchClicked(false);
          }}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <BoardHeader titleKey="reports.customers" />

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expiring">Expiring</TabsTrigger>
          <TabsTrigger value="scan">Scan Report</TabsTrigger>
        </TabsList>

        {tabLoading && <p className="mt-4 text-sm text-ink-soft" role="status">{t("common.loading")}</p>}
        {tabError && (
          <p className="mt-4 flex items-center gap-2 text-sm text-ink" role="alert">
            <MagnetDot tone="rejected" size="sm" />
            Error: {tabError.message}
          </p>
        )}

        {/* Scan Report Tab */}
        <TabsContent value="scan">
          <BoardSection title="Scan Report">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="relative flex-1 space-y-1.5">
                <Label htmlFor="scan-customer">Customer Search</Label>
                <Input
                  id="scan-customer"
                  type="text"
                  placeholder="Type ID, Name or Phone..."
                  value={searchValue}
                  onChange={e => {
                    setSearchValue(e.target.value);
                    setShowDropdown(true);
                    setSelectedCustomer(null);
                    setSearchClicked(false);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  autoComplete="off"
                />
                {/* Dropdown */}
                {showDropdown && debouncedValue && filteredCustomers.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-rule bg-popover shadow-overlay">
                    {filteredCustomers.map((c: any) => (
                      <li
                        key={c.customer_id}
                        className="cursor-pointer px-3 py-2 text-sm text-ink hover:bg-tray"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setSearchValue(c.customer_name + ' (' + c.customer_id + ')');
                          setShowDropdown(false);
                          setSearchClicked(false);
                        }}
                      >
                        {c.customer_name} ({c.customer_id}) - {c.phone}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {dateFields}
              <div className="flex gap-2">
                <Button
                  disabled={!selectedCustomer || !fromDate || !toDate}
                  onClick={() => setSearchClicked(true)}
                >
                  <Search aria-hidden="true" />
                  Search
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    !dataScan ||
                    !dataScan.customerScanReport ||
                    !dataScan.customerScanReport.ScanLog.length
                  }
                  onClick={exportScanLogPdf}
                >
                  <FileDown aria-hidden="true" />
                  PDF
                </Button>
              </div>
            </div>
            {/* Scan results */}
            <div className="mt-4" ref={scanLogRef}>
              {loadingScan && <p className="text-center text-sm text-ink-soft">Loading scan results...</p>}
              {errorScan && <p className="text-center text-sm text-magnet-rejected">Error: {errorScan.message}</p>}
              {dataScan && dataScan.customerScanReport && (
                <div>
                  <div className="mb-2 text-sm font-semibold text-ink">Scan Log for {selectedCustomer?.customer_name} ({dataScan.customerScanReport.FromDate} to {dataScan.customerScanReport.ToDate})</div>
                  {dataScan.customerScanReport.ScanLog.length > 0 ? (
                    <DataTable<ScanLogRow>
                      data={scanLogRows}
                      columns={scanLogColumns}
                      currentPage={1}
                      pageSize={scanLogRows.length || 1}
                      onPageChange={() => { /* un-paginated */ }}
                      onPageSizeChange={() => { /* un-paginated */ }}
                      searchable={false}
                      exportable={false}
                      printable={false}
                      densityToggle={false}
                      defaultDensity="compact"
                    />
                  ) : (
                    <p className="text-sm text-ink-soft">No scan records found for this customer in the selected date range.</p>
                  )}
                </div>
              )}
            </div>
          </BoardSection>
        </TabsContent>

        {/* Active Members Tab */}
        <TabsContent value="active">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Figure label="Active Members" value={formatCount(totalActive)} />
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Hide details" : "View details"}
              </Button>
            </div>

            {/* Conditional Rendering for Table */}
            {showDetails && (
              <DataTable<CustomerRow>
                data={filteredActiveRows}
                columns={activeCustomerColumns}
                currentPage={1}
                pageSize={filteredActiveRows.length || 1}
                onPageChange={() => { /* un-paginated */ }}
                onPageSizeChange={() => { /* un-paginated */ }}
                searchPlaceholder="Search name, phone or ID..."
                searchValue={activeSearch}
                onSearchChange={setActiveSearch}
                exportFileName="active-customers.xlsx"
                printTitle="Active Members"
                densityToggle={false}
                defaultDensity="compact"
              />
            )}
          </div>
        </TabsContent>

        {/* Expiring Members Tab */}
        <TabsContent value="expiring">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              {dateFields}
              <Figure label="Expiring Members" value={formatCount(totalExpiring)} />
              {/* Export to Excel button */}
              <Button
                variant="outline"
                disabled={customersExpiring.length === 0}
                onClick={() => exportToExcel(customersExpiring, fromDate, toDate)}
              >
                <FileSpreadsheet aria-hidden="true" />
                Excel
              </Button>
            </div>

            {toDate && (
              <BoardSection title={`${totalExpiring} Customers Expiring from ${fromDate} to ${toDate}`}>
                {customersExpiring.length > 0 ? (
                  <DataTable<CustomerRow>
                    data={expiringRows}
                    columns={expiringCustomerColumns}
                    currentPage={1}
                    pageSize={expiringRows.length || 1}
                    onPageChange={() => { /* un-paginated */ }}
                    onPageSizeChange={() => { /* un-paginated */ }}
                    searchable={false}
                    exportable={false}
                    printable={false}
                    densityToggle={false}
                    defaultDensity="compact"
                  />
                ) : (
                  <p className="text-sm text-ink-soft">No customers found for the selected expiration date.</p>
                )}
              </BoardSection>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
