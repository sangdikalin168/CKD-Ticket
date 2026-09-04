// To use PDF export, run:
// npm install jspdf jspdf-autotable
// To use html2pdf.js for Unicode/Khmer PDF export:
// npm install html2pdf.js
import html2pdf from "html2pdf.js";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateInput } from "@/components/ui/DateInput";
import { Label } from "@/components/ui/Label";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@/types/datatable";
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

export const CustomerReport = () => {
  // Ref for scan log section
  const scanLogRef = useRef<HTMLDivElement>(null);


  // Tab state: 'active', 'expiring', or 'scan'
  const [selectedTab, setSelectedTab] = useState<'active' | 'expiring' | 'scan'>('active');

  // Query for all customers
  const { loading: loadingCustomers, error: errorCustomers, data: dataCustomers } = useQuery(CUSTOMERS);

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
    const headers = ['Customer ID', 'Name', 'Phone', 'Expiration Date'];
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

  return (
    <>
      {/* Tab Buttons */}
      <div className="flex mb-6 gap-2">
        <Button
          variant={selectedTab === 'active' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('active')}
        >
          Active
        </Button>
        <Button
          variant={selectedTab === 'expiring' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('expiring')}
        >
          Expiring
        </Button>
        <Button
          variant={selectedTab === 'scan' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('scan')}
        >
          Scan Report
        </Button>
      </div>
      {tabLoading && <p className="text-center">Loading...</p>}
      {tabError && (
        <p className="text-center text-red-500 mb-4">Error: {tabError.message}</p>
      )}
      {/* Scan Report Tab */}
      {selectedTab === 'scan' && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="mb-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Label className="block text-sm font-medium mb-1">Customer Search</Label>
                <Input
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
                  <ul className="absolute z-10 bg-white border border-gray-300 rounded w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredCustomers.map((c: any) => (
                      <li
                        key={c.customer_id}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
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

              <div>
                <Label className="block text-sm font-medium mb-1">From Date</Label>
                <DateInput
                  name="fromDate"
                  value={fromDate}
                  onChange={e => {
                    setFromDate(e.target.value);
                    setSearchClicked(false);
                  }}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">To Date</Label>
                <DateInput
                  name="toDate"
                  value={toDate}
                  onChange={e => {
                    setToDate(e.target.value);
                    setSearchClicked(false);
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={!selectedCustomer || !fromDate || !toDate}
                onClick={() => setSearchClicked(true)}
              >
                Search
              </Button>
              <Button
                variant="secondary"
                disabled={
                  !dataScan ||
                  !dataScan.customerScanReport ||
                  !dataScan.customerScanReport.ScanLog.length
                }
                onClick={() => {
                  if (!scanLogRef.current) {
                    alert('No scan log to export.');
                    return;
                  }
                  // Sanitize name for filename (remove special chars, spaces to _)
                  const name = selectedCustomer?.customer_name
                    ? selectedCustomer.customer_name.replace(/[^\w\d\u1780-\u17FF]+/g, '_')
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
                }}
              >
                Export to PDF
              </Button>
            </div>
            {/* Scan results */}
            <div className="mt-6" ref={scanLogRef}>
              {loadingScan && <p className="text-gray-600 text-center">Loading scan results...</p>}
              {errorScan && <p className="text-red-500 text-center">Error: {errorScan.message}</p>}
              {dataScan && dataScan.customerScanReport && (
                <div>
                  <div className="mb-2 font-semibold text-center">Scan Log for {selectedCustomer?.customer_name} ({dataScan.customerScanReport.FromDate} to {dataScan.customerScanReport.ToDate})</div>
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
                    />
                  ) : (
                    <p className="text-center">No scan records found for this customer in the selected date range.</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Members Tab */}
      {selectedTab === 'active' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="text-2xl font-semibold mb-1"><span className="text-base font-normal text-gray-600 align-top"></span>{totalActive}</div>
                    <div className="text-sm font-medium text-gray-600">Active Members</div>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide details" : "View details"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Conditional Rendering for Table */}
          {showDetails && (
            <Card>
              <CardContent className="p-6">
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm mb-4"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide details" : "View details"}
                </Button>
                <div className="overflow-x-auto">
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
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Expiring Members Tab */}
      {selectedTab === 'expiring' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="text-2xl font-semibold mb-1"><span className="text-base font-normal text-gray-600 align-top"></span>{totalExpiring}</div>
                    <div className="text-sm font-medium text-gray-600">Expiring Members</div>
                  </div>
                </div>

                <div className="mb-4 flex flex-col md:flex-row gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-1">From Date</Label>
                    <DateInput
                      name="fromDate"
                      value={fromDate}
                      onChange={e => {
                        setFromDate(e.target.value);
                        setSearchClicked(false);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-1">To Date</Label>
                    <DateInput
                      name="toDate"
                      value={toDate}
                      onChange={e => {
                        setToDate(e.target.value);
                        setSearchClicked(false);
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    disabled={!selectedCustomer || !fromDate || !toDate}
                    onClick={() => setSearchClicked(true)}
                  >
                    Search
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={
                      !dataScan ||
                      !dataScan.customerScanReport ||
                      !dataScan.customerScanReport.ScanLog.length
                    }
                    onClick={() => {
                      if (!scanLogRef.current) {
                        alert('No scan log to export.');
                        return;
                      }
                      // Sanitize name for filename (remove special chars, spaces to _)
                      const name = selectedCustomer?.customer_name
                        ? selectedCustomer.customer_name.replace(/[^\w\d\u1780-\u17FF]+/g, '_')
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
                    }}
                  >
                    PDF
                  </Button>

                  {/* Export to Excel button */}
                  <Button
                    variant="secondary"
                    disabled={customersExpiring.length === 0}
                    onClick={() => exportToExcel(customersExpiring, fromDate, toDate)}
                  >
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {toDate && (
            <>
              <div className="mb-4">
                <div className="text-lg font-semibold">{totalExpiring} Customers Expiring from {fromDate} to {toDate}</div>
                {customersExpiring.length > 0 ? (
                  <div className="overflow-x-auto">
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
                    />
                  </div>
                ) : (
                  <p>No customers found for the selected expiration date.</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
