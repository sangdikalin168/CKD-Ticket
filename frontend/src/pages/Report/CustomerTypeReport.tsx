import { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import * as XLSX from 'xlsx';
import { AlertCircle, ChevronRight, FileSpreadsheet, Search, Users, X } from "lucide-react";
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
import { StateDot } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { FigureStrip } from "@/components/ui/FigureStrip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { SkeletonRows } from "@/components/ui/skeleton";

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

  const averageRevenue = reportData && reportData.total_all_customers > 0
    ? reportData.total_all_revenue / reportData.total_all_customers
    : 0;

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

      {/* Loading draws the page it is about to become: the figure strip, then
          the rows of the summary list. No spinner over an empty box. */}
      {loading && (
        <div className="space-y-6" role="status" aria-live="polite">
          <span className="sr-only">កំពុងផ្ទុក...</span>
          <FigureStrip
            loading
            items={[
              { label: "អតិថិជនសកម្មបច្ចុប្បន្ន", value: "" },
              { label: "តម្លៃសរុបពីការទិញចុងក្រោយ", value: "" },
            ]}
          />
          <div className="overflow-hidden rounded-lg border border-rule bg-card">
            <SkeletonRows rows={5} className="px-3 py-2" />
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-ink" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 text-void" aria-hidden="true" />
          កំហុស: {error.message}
        </p>
      )}

      {reportData && !loading && (
        <>
          {/* Figures: one ruled strip, never a grid of same-size stat cards. */}
          <FigureStrip
            aria-label="សង្ខេប"
            items={[
              {
                label: "អតិថិជនសកម្មបច្ចុប្បន្ន",
                value: formatCount(reportData.total_all_customers),
              },
              {
                label: "តម្លៃសរុបពីការទិញចុងក្រោយ",
                value: formatMoney(reportData.total_all_revenue, { decimals: 2 }),
                tone: "paid",
                meta: (
                  <>
                    មធ្យម <span className="figure">{formatMoney(averageRevenue, { decimals: 2 })}</span>
                  </>
                ),
              },
            ]}
          />

          {/* Duration groups: a plain list of rows, each opening its detail. */}
          <Section title="សង្ខេបតាមប្រភេទ">
            <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-card">
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
                        "grid w-full grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-2.5 text-left text-ink transition-colors hover:bg-wash/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        active && "bg-wash"
                      )}
                    >
                      <StateDot tone={active ? "ink" : "muted"} />
                      <span className="text-sm font-semibold">
                        <span className="figure">{group.month_duration}</span> ខែ
                      </span>
                      <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                        <span className="text-caption text-ink-soft">អតិថិជន</span>
                        <span className="figure font-semibold">{formatCount(group.total_customers)}</span>
                      </span>
                      <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                        <span className="text-caption text-ink-soft">ចំណូល</span>
                        <span className="figure font-semibold">{formatMoney(group.total_revenue, { decimals: 2 })}</span>
                      </span>
                      <span className="hidden items-baseline gap-2 whitespace-nowrap sm:inline-flex">
                        <span className="text-caption text-ink-soft">មធ្យម</span>
                        <span className="figure font-semibold">
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
              title={
                <>
                  លម្អិតអតិថិជន <span className="figure">{selectedDuration}</span> ខែ
                </>
              }
              aside={
                <Button onClick={() => setShowDetails(false)} variant="outline" size="sm">
                  <X aria-hidden="true" />
                  បិទ
                </Button>
              }
            >
              {/* Narrow screens read the same rows as cards; the table below
                  starts at md, which is this page's column priority. */}
              <div className="block space-y-3 md:hidden">
                {selectedGroup.customers.map((customer: CustomerMembershipDetail) => (
                  <div key={customer.customer_id} className="rounded-lg border border-rule bg-card p-3">
                    <div className="flex items-start justify-between gap-2 border-b border-rule pb-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{customer.customer_name}</p>
                        <p className="figure text-caption text-ink-soft">{customer.customer_code}</p>
                      </div>
                      <span className="figure whitespace-nowrap text-sm font-semibold text-ink">
                        {formatMoney(customer.price, { decimals: 2 })}
                      </span>
                    </div>

                    <dl className="mt-2 grid grid-cols-2 gap-2 text-caption">
                      <div>
                        <dt className="text-ink-soft">លេខទូរស័ព្ទ</dt>
                        <dd className="figure font-medium text-ink">{customer.phone}</dd>
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
                        <dd className="figure font-medium text-ink">{formatDate(customer.end_membership_date)}</dd>
                      </div>
                      <div className="col-span-2 border-t border-rule pt-2">
                        <dt className="text-ink-soft">កាលបរិច្ឆេទទូទាត់ចុងក្រោយ</dt>
                        <dd className="figure font-medium text-ink">{new Date(customer.payment_date).toLocaleDateString('fr-CA')}</dd>
                      </div>
                    </dl>
                  </div>
                ))}

                {/* Mobile Summary */}
                <div className="flex items-center justify-between rounded-lg border border-rule bg-wash p-3">
                  <span className="text-sm font-semibold text-ink">សរុប</span>
                  <div className="text-right">
                    <p className="figure whitespace-nowrap text-sm font-semibold text-ink">
                      {formatMoney(selectedGroup.total_revenue, { decimals: 2 })}
                    </p>
                    <p className="text-caption text-ink-soft">
                      <span className="figure">{formatCount(selectedGroup.total_customers)}</span> អតិថិជន
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-hidden rounded-lg border border-rule bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="hidden lg:table-cell">លេខកូដ</TableHead>
                      <TableHead>ឈ្មោះ</TableHead>
                      <TableHead>លេខទូរស័ព្ទ</TableHead>
                      <TableHead className="hidden lg:table-cell">ភេទ</TableHead>
                      <TableHead>ប្រភេទ</TableHead>
                      <TableHead className="text-right">តម្លៃចុងក្រោយ</TableHead>
                      <TableHead className="hidden xl:table-cell">កាលបរិច្ឆេទទូទាត់ចុងក្រោយ</TableHead>
                      <TableHead>ផុតកំណត់</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGroup.customers.map((customer: CustomerMembershipDetail) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell className="figure hidden whitespace-nowrap text-ink-soft lg:table-cell">
                          {customer.customer_code}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {customer.customer_name}
                        </TableCell>
                        <TableCell className="figure whitespace-nowrap">
                          {customer.phone}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap lg:table-cell">
                          {customer.gender}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.promotion}
                        </TableCell>
                        <TableCell className="figure whitespace-nowrap text-right font-semibold">
                          {formatMoney(customer.price, { decimals: 2 })}
                        </TableCell>
                        <TableCell className="figure hidden whitespace-nowrap xl:table-cell">
                          {new Date(customer.payment_date).toLocaleDateString('fr-CA')}
                        </TableCell>
                        <TableCell className="figure whitespace-nowrap">
                          {formatDate(customer.end_membership_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {/* One footer cell per column, rather than colSpan, so the
                      total stays under its own column as columns fold away. */}
                  <TableFooter>
                    <TableRow>
                      <TableCell className="hidden lg:table-cell" />
                      <TableCell className="whitespace-nowrap font-semibold">សរុប</TableCell>
                      <TableCell />
                      <TableCell className="hidden lg:table-cell" />
                      <TableCell />
                      <TableCell className="figure whitespace-nowrap text-right font-semibold">
                        {formatMoney(selectedGroup.total_revenue, { decimals: 2 })}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell" />
                      <TableCell className="whitespace-nowrap font-semibold">
                        <span className="figure">{formatCount(selectedGroup.total_customers)}</span> អតិថិជន
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </Section>
          )}
        </>
      )}

      {/* Searched, but the range holds nothing */}
      {!reportData && hasSearched && !loading && !error && (
        <div className="rounded-lg border border-rule bg-card">
          <EmptyState
            icon={Users}
            title={t("common.noData")}
            description="បង្ហាញប្រភេទសមាជិកដែលអតិថិជនកំពុងប្រើប្រាស់បច្ចុប្បន្ន (ផ្អែកលើការទិញចុងក្រោយ)"
          />
        </div>
      )}

      {/* Nothing asked for yet: name the report and offer the one action. */}
      {!hasSearched && (
        <div className="rounded-lg border border-rule bg-card">
          <EmptyState
            icon={Search}
            title={t("reports.memberTypes")}
            description={'សូមចុចប៊ូតុង "ស្វែងរក" ដើម្បីមើលរបាយការណ៍'}
            action={
              <Button variant="outline" onClick={handleSearch} disabled={loading}>
                <Search aria-hidden="true" />
                ស្វែងរក
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
};

export default CustomerTypeReport;
