import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import * as XLSX from 'xlsx';
import { AlertCircle, ChevronRight, FileSpreadsheet, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";

import { formatCount, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

// TypeScript interfaces
interface CustomerMembershipDetail {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  phone: string;
  gender: string;
  end_membership_date: string;
  month_qty: number;
  promotion: string;
  price: number;
  payment_date: string;
}

interface MembershipDurationGroup {
  month_duration: number;
  total_customers: number;
  total_revenue: number;
  customers: CustomerMembershipDetail[];
}

interface CustomersByMembershipDurationData {
  customersByMembershipDuration: {
    groups: MembershipDurationGroup[];
    total_all_customers: number;
    total_all_revenue: number;
  };
}

const CUSTOMERS_BY_MEMBERSHIP_DURATION = gql`
  query CustomersByMembershipDuration($fromDate: String!, $toDate: String!) {
    customersByMembershipDuration(fromDate: $fromDate, toDate: $toDate) {
      groups {
        month_duration
        total_customers
        total_revenue
        customers {
          customer_id
          customer_code
          customer_name
          phone
          gender
          end_membership_date
          month_qty
          promotion
          price
          payment_date
        }
      }
      total_all_customers
      total_all_revenue
    }
  }
`;

/** A figure on the board with its label written beside it. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 px-4 py-3">
      <span className="truncate text-caption text-ink-soft">{label}</span>
      <span className="text-xl font-semibold leading-none text-ink">{value}</span>
    </div>
  );
}

export const CustomerTypeReport = () => {
  const { t } = useTranslation();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Helper function to format date
  const formatDate = (date: string | number): string => {
    if (!date) return '';

    // If it's a timestamp (number or numeric string)
    const timestamp = typeof date === 'string' ? parseInt(date) : date;
    if (!isNaN(timestamp) && timestamp > 10000000000) {
      return new Date(timestamp).toLocaleDateString('fr-CA');
    }

    // If it's already a date string
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('fr-CA');
      }
    }

    return String(date);
  };

  // Query for customers by membership duration
  const { loading, error, data, refetch } = useQuery<CustomersByMembershipDurationData>(CUSTOMERS_BY_MEMBERSHIP_DURATION, {
    variables: { fromDate: "2000-01-01", toDate: "2099-12-31" },
    skip: !hasSearched,
    fetchPolicy: "network-only"
  });

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  const exportToExcel = () => {
    if (!data?.customersByMembershipDuration?.groups) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = data.customersByMembershipDuration.groups.map((group: MembershipDurationGroup) => ({
      'រយៈពេល (ខែ)': group.month_duration,
      'ចំនួនអតិថិជន': group.total_customers,
      'ចំណូលសរុប ($)': group.total_revenue.toFixed(2)
    }));

    summaryData.push({
      'រយៈពេល (ខែ)': 'សរុបរួម' as unknown as number,
      'ចំនួនអតិថិជន': data.customersByMembershipDuration.total_all_customers,
      'ចំណូលសរុប ($)': data.customersByMembershipDuration.total_all_revenue.toFixed(2)
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "សង្ខេប");

    // Detail sheets for each duration
    data.customersByMembershipDuration.groups.forEach((group: MembershipDurationGroup) => {
      if (group.customers.length > 0) {
        const detailData = group.customers.map((customer: CustomerMembershipDetail) => ({
          'លេខកូដ': customer.customer_code,
          'ឈ្មោះ': customer.customer_name,
          'លេខទូរស័ព្ទ': customer.phone,
          'ភេទ': customer.gender,
          'ប្រភេទ': customer.promotion,
          'តម្លៃចុងក្រោយ ($)': customer.price.toFixed(2),
          'កាលបរិច្ឆេទទូទាត់ចុងក្រោយ': new Date(customer.payment_date).toLocaleDateString('fr-CA'),
          'ផុតកំណត់': formatDate(customer.end_membership_date)
        }));

        const ws = XLSX.utils.json_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, ws, `${group.month_duration} ខែ`);
      }
    });

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `របាយការណ៍ប្រភេទសមាជិកបច្ចុប្បន្ន_${today}.xlsx`);
  };

  const reportData = data?.customersByMembershipDuration;
  const selectedGroup = selectedDuration !== null
    ? reportData?.groups.find((g: MembershipDurationGroup) => g.month_duration === selectedDuration)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="reports.memberTypes"
        subtitle="បង្ហាញប្រភេទសមាជិកដែលអតិថិជនកំពុងប្រើប្រាស់បច្ចុប្បន្ន (ផ្អែកលើការទិញចុងក្រោយ)"
        actions={
          <>
            <Button onClick={handleSearch} disabled={loading}>
              <Search aria-hidden="true" />
              ស្វែងរក
            </Button>
            {reportData && (
              <Button onClick={exportToExcel} variant="outline">
                <FileSpreadsheet aria-hidden="true" />
                នាំចេញ Excel
              </Button>
            )}
          </>
        }
      />

      {loading && <p className="text-sm text-ink-soft" role="status">កំពុងផ្ទុក...</p>}
      {error && (
        <p className="flex items-center gap-2 text-sm text-ink" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 text-void" aria-hidden="true" />
          កំហុស: {error.message}
        </p>
      )}

      {reportData && !loading && (
        <>
          {/* Figures */}
          <section className="overflow-x-auto rounded-lg border border-rule bg-card">
            <div className="flex min-w-max divide-x divide-rule">
              <Figure label="អតិថិជនសកម្មបច្ចុប្បន្ន" value={formatCount(reportData.total_all_customers)} />
              <Figure label="តម្លៃសរុបពីការទិញចុងក្រោយ" value={formatMoney(reportData.total_all_revenue, { decimals: 2 })} />
            </div>
          </section>

          {/* Duration groups as a marker list */}
          <Section title="សង្ខេបតាមប្រភេទ">
            <ul className="divide-y divide-rule rounded-lg border border-rule bg-card">
              {reportData.groups.map((group: MembershipDurationGroup) => {
                const active = showDetails && selectedDuration === group.month_duration;
                return (
                  <li key={group.month_duration}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelectedDuration(group.month_duration);
                        setShowDetails(true);
                      }}
                      className={cn(
                        "grid w-full grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-2.5 text-left text-ink transition-colors hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink",
                        active && "bg-wash"
                      )}
                    >
                      <span aria-hidden="true" className={cn("marker-dot", active ? "" : "opacity-60")} style={{ ["--marker" as string]: "var(--ink)" }} />
                      <span className="text-lg font-semibold">{group.month_duration} ខែ</span>
                      <span className="inline-flex items-baseline gap-2">
                        <span className="text-caption text-ink-soft">អតិថិជន</span>
                        <span className="font-semibold">{formatCount(group.total_customers)}</span>
                      </span>
                      <span className="inline-flex items-baseline gap-2">
                        <span className="text-caption text-ink-soft">ចំណូល</span>
                        <span className="font-semibold">{formatMoney(group.total_revenue, { decimals: 2 })}</span>
                      </span>
                      <span className="hidden items-baseline gap-2 sm:inline-flex">
                        <span className="text-caption text-ink-soft">មធ្យម</span>
                        <span className="font-semibold">
                          {formatMoney(group.total_customers > 0 ? group.total_revenue / group.total_customers : 0, { decimals: 2 })}
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-ink-soft" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Detailed Customer List */}
          {showDetails && selectedGroup && (
            <Section
              title={`លម្អិតអតិថិជន ${selectedDuration} ខែ`}
              aside={
                <Button onClick={() => setShowDetails(false)} variant="outline" size="sm">
                  <X aria-hidden="true" />
                  បិទ
                </Button>
              }
            >
              {/* Mobile Card View */}
              <div className="block space-y-3 md:hidden">
                {selectedGroup.customers.map((customer: CustomerMembershipDetail) => (
                  <div key={customer.customer_id} className="rounded-lg border border-rule bg-card p-3">
                    <div className="flex items-start justify-between gap-2 border-b border-rule pb-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{customer.customer_name}</p>
                        <p className="text-caption text-ink-soft">{customer.customer_code}</p>
                      </div>
                      <span className="text-lg font-semibold text-ink">{formatMoney(customer.price, { decimals: 2 })}</span>
                    </div>

                    <dl className="mt-2 grid grid-cols-2 gap-2 text-caption">
                      <div>
                        <dt className="text-ink-soft">លេខទូរស័ព្ទ</dt>
                        <dd className="font-medium text-ink">{customer.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-soft">ភេទ</dt>
                        <dd className="font-medium text-ink">{customer.gender}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-soft">ប្រភេទ</dt>
                        <dd className="font-medium text-ink">{customer.promotion}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-soft">ផុតកំណត់</dt>
                        <dd className="font-medium text-ink">{formatDate(customer.end_membership_date)}</dd>
                      </div>
                      <div className="col-span-2 border-t border-rule pt-2">
                        <dt className="text-ink-soft">កាលបរិច្ឆេទទូទាត់ចុងក្រោយ</dt>
                        <dd className="font-medium text-ink">{new Date(customer.payment_date).toLocaleDateString('fr-CA')}</dd>
                      </div>
                    </dl>
                  </div>
                ))}

                {/* Mobile Summary */}
                <div className="flex items-center justify-between rounded-lg border-2 border-ink bg-card p-3">
                  <span className="font-semibold text-ink">សរុប</span>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-ink">{formatMoney(selectedGroup.total_revenue, { decimals: 2 })}</p>
                    <p className="text-caption text-ink-soft">{selectedGroup.total_customers} អតិថិជន</p>
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-hidden rounded-lg border border-rule bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>លេខកូដ</TableHead>
                      <TableHead>ឈ្មោះ</TableHead>
                      <TableHead>លេខទូរស័ព្ទ</TableHead>
                      <TableHead>ភេទ</TableHead>
                      <TableHead>ប្រភេទ</TableHead>
                      <TableHead className="text-right">តម្លៃចុងក្រោយ</TableHead>
                      <TableHead>កាលបរិច្ឆេទទូទាត់ចុងក្រោយ</TableHead>
                      <TableHead>ផុតកំណត់</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGroup.customers.map((customer: CustomerMembershipDetail) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell className="whitespace-nowrap text-ink-soft">
                          {customer.customer_code}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {customer.customer_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.phone}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.gender}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.promotion}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold">
                          {formatMoney(customer.price, { decimals: 2 })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(customer.payment_date).toLocaleDateString('fr-CA')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(customer.end_membership_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-semibold">
                        សរុប
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatMoney(selectedGroup.total_revenue, { decimals: 2 })}
                      </TableCell>
                      <TableCell colSpan={2} className="font-semibold">
                        {selectedGroup.total_customers} អតិថិជន
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </Section>
          )}
        </>
      )}

      {/* No Data Message */}
      {!reportData && hasSearched && !loading && !error && (
        <p className="rounded-lg border border-dashed border-rule bg-card px-4 py-10 text-center text-sm text-ink-soft">
          {t("common.noData")}
        </p>
      )}

      {!hasSearched && (
        <p className="rounded-lg border border-dashed border-rule bg-card px-4 py-10 text-center text-sm text-ink-soft">
          សូមចុចប៊ូតុង "ស្វែងរក" ដើម្បីមើលរបាយការណ៍
        </p>
      )}
    </div>
  );
};

export default CustomerTypeReport;
