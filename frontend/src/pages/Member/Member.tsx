import { Eye, Plus, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingPage from "../../components/LoadingPage/LoadingPage";
import { DataTable } from "@/components/ui/DataTable";
import { CachedImage } from "@/components/ui/CachedImage";
import type { ColumnDef } from "@/types/datatable";
import {
  useCreateCustomerMutation,
  useGetCustomersCountQuery,
  useGetCustomersQuery,
} from "../../generated/graphql";
import CreateMember from "./CreateMember";
import JWTManager from "../../utils/jwt";
import MemberProfile from "./Profile/MemberProfile/MemberProfile";
import { TypeOptions, toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BoardHeader } from "@/components/board/BoardHeader";
import { MagnetChip } from "@/components/board/MagnetChip";

const notify = (
  message: string,
  auto_Close: boolean | number,
  toastType: TypeOptions
) => {
  if (!toast.isActive("alert")) {
    toast(message, {
      autoClose: auto_Close ? 500 : false,
      toastId: "alert",
      type: toastType,
    });
  }
};

type Customer = {
  customer_id: number;
  created_date: string;
  created_by: number;
  customer_code: string;
  customer_name: string;
  phone: string;
  gender: string;
  image_path: string;
  fingerprint: string;
  end_membership_date: string;
  coupon_remain_qty?: number;
  key_status: string;
  towel_status: string;
};

const isValid = (date: string) => (date ? new Date(date) >= new Date() : false);

const StatusMagnet = ({ date }: { date: string }) => {
  const active = isValid(date);
  return (
    <MagnetChip tone={active ? "done" : "rejected"}>
      {active ? "មានសុពលភាព" : "ផុតកំណត់"}
    </MagnetChip>
  );
};

const AvatarName = ({ name, imagePath }: { name: string; imagePath: string }) => {
  // Relative: /uploads is proxied to the backend (vite in dev, nginx in prod), so
  // this works on the LAN and behind the tunnel, where :4000 is not reachable.
  // CachedImage rather than a plain <img>: /uploads now requires a bearer token,
  // which an <img src> cannot send, so it is fetched and cached as a blob URL.
  const src = imagePath ? imagePath : null;
  return (
    <div className="flex items-center gap-2">
      {src ? (
        <CachedImage src={src} alt={name} className="h-7 w-7 shrink-0 rounded-full border border-rule object-cover" />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rule bg-tray text-ink-soft">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <span className="max-w-[180px] truncate font-medium text-ink">{name}</span>
    </div>
  );
};

export const Member = () => {
  const { t } = useTranslation();
  const columns: ColumnDef<Customer>[] = [
    {
      key: "customer_id",
      header: "ID",
      sortable: true,
      render: (row) => (
        <span className="text-ink-soft">{row.customer_id}</span>
      ),
    },
    {
      key: "customer_name",
      header: "ឈ្មោះ",
      sortable: true,
      render: (row) => (
        <AvatarName name={row.customer_name} imagePath={row.image_path} />
      ),
    },
    {
      key: "phone",
      header: "ទូរស័ព្ទ",
      sortable: true,
      render: (row) => <span>{row.phone || "—"}</span>,
    },
    {
      key: "end_membership_date",
      header: "ថ្ងៃផុតកំណត់",
      sortable: true,
      render: (row) => <span>{row.end_membership_date || "—"}</span>,
    },
    {
      // Also derived from end_membership_date, so it needs its own key for the
      // column-visibility toggle; the accessor keeps export/copy/print textual.
      key: "membership_status",
      header: "ស្ថានភាព",
      sortable: false,
      accessor: (row) => (isValid(row.end_membership_date) ? "មានសុពលភាព" : "ផុតកំណត់"),
      render: (row) => <StatusMagnet date={row.end_membership_date} />,
    },
  ];

  const PAGE_SIZE = 20;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [customer_id, setCustomerID] = useState(0);
  // Searched on the server: the list is paginated 20 at a time, so filtering in
  // the browser would only ever match the page you happen to be looking at.
  const [search, setSearch] = useState("");
  const { data, loading: member_loading, refetch } = useGetCustomersQuery({
    variables: { limit: pageSize, offset: pageIndex * pageSize, search },
    fetchPolicy: "no-cache",
  });
  const { data: countData, refetch: refetchCount } = useGetCustomersCountQuery({
    variables: { search },
    fetchPolicy: "no-cache",
  });
  const [createCustomer] = useCreateCustomerMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const data_table = (data?.GetCustomers ?? []) as Customer[];
  const totalCount = countData?.GetCustomersCount ?? 0;
  const serverPageCount = Math.ceil(totalCount / pageSize);

  // Whether the first page of results has ever arrived. Used to keep the table
  // mounted across later refetches — see the loading guard below.
  const hasLoadedOnce = useRef(false);
  if (data) hasLoadedOnce.current = true;

  const handleSubmit = async (formData: any) => {
    const { data: result } = await createCustomer({
      variables: {
        customerName: formData.customer_name,
        phone: formData.phone,
        gender: formData.gender,
        createdBy: JWTManager.getUserId() as number,
      },
    });
    if (result?.CreateCustomer.success) {
      notify("Created Success", true, toast.TYPE.SUCCESS);
      setShowCreate(false);
      setPageIndex(0);
      refetch();
      refetchCount();
    } else {
      notify(result?.CreateCustomer.message ?? "", true, toast.TYPE.INFO);
    }
  };

  // Only blank the page on the very first load. Every search re-runs the query,
  // and with fetchPolicy "no-cache" that empties `data` while in flight — so the
  // old condition swapped the table for a spinner on each keystroke-batch,
  // unmounting DataTable and wiping the search box the user was typing into.
  if (member_loading && !hasLoadedOnce.current) return <LoadingPage message={t("common.loading")} />;

  if (showProfile) return <MemberProfile ID={customer_id} />;

  const activeCount = data_table.filter((c) => isValid(c.end_membership_date)).length;

  return (
    <>
      <BoardHeader
        titleKey="members.title"
        subtitle={t("members.count", { total: totalCount, active: activeCount })}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus aria-hidden="true" />
            {t("members.add")}
          </Button>
        }
      />

      <DataTable<Customer>
        columns={columns}
        data={data_table}
        pageInfo={{
          current_page: pageIndex + 1,
          page_size: pageSize,
          total_items: totalCount,
          total_pages: serverPageCount,
          has_next: pageIndex + 1 < serverPageCount,
          has_previous: pageIndex > 0,
        }}
        currentPage={pageIndex + 1}
        pageSize={pageSize}
        onPageChange={(page) => setPageIndex(page - 1)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        pageSizeOptions={[10, 20, 30, 50]}
        searchValue={search}
        onSearchChange={(term) => {
          setSearch(term);
          // A new search must start at page 1, otherwise a 3-match result
          // viewed from page 12 renders empty.
          setPageIndex(0);
        }}
        columnToggle
        loading={member_loading}
        exportFileName="members.csv"
        printTitle="សមាជិក"
        onRowClick={(row) => {
          setCustomerID(row.customer_id);
          setShowProfile(true);
        }}
        rowActions={(row) => [
          {
            label: "មើល",
            onClick: () => {
              setCustomerID(row.customer_id);
              setShowProfile(true);
            },
            icon: <Eye className="h-4 w-4" aria-hidden="true" />,
          },
        ]}
      />

      {/* Create member dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>បន្ថែមសមាជិកថ្មី</DialogTitle>
          </DialogHeader>
          <CreateMember setShow={setShowCreate} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </>
  );
};
