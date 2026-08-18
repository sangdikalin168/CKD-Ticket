import { EyeIcon, PlusCircleIcon } from "@heroicons/react/20/solid";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { UsersIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const StatusBadge = ({ date }: { date: string }) => {
  const isActive = date ? new Date(date) >= new Date() : false;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
      {isActive ? "មានសុពលភាព" : "ផុតកំណត់"}
    </span>
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
        <CachedImage src={src} alt={name} className="h-7 w-7 rounded-full object-cover shrink-0" />
      ) : (
        <UserCircleIcon className="h-7 w-7 text-gray-300 shrink-0" />
      )}
      <span className="font-medium truncate max-w-[160px]">{name}</span>
    </div>
  );
};

export const Member = () => {
  const columns: ColumnDef<Customer>[] = [
    {
      key: "customer_id",
      header: "ID",
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground text-xs">{row.customer_id}</span>
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
      render: (row) => (
        <span className="text-sm">{row.end_membership_date || "—"}</span>
      ),
    },
    {
      // Also derived from end_membership_date, so it needs its own key for the
      // column-visibility toggle; the accessor keeps export/copy/print textual.
      key: "membership_status",
      header: "ស្ថានភាព",
      sortable: false,
      accessor: (row) =>
        row.end_membership_date && new Date(row.end_membership_date) >= new Date()
          ? "មានសុពលភាព"
          : "ផុតកំណត់",
      render: (row) => <StatusBadge date={row.end_membership_date} />,
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
  if (member_loading && !hasLoadedOnce.current) return <LoadingPage message="Loading" />;

  if (showProfile) return <MemberProfile ID={customer_id} />;

  const activeCount = data_table.filter(
    (c) => c.end_membership_date && new Date(c.end_membership_date) >= new Date()
  ).length;

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-0 px-5 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                <UsersIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">សមាជិក</h1>
                <p className="text-xs text-muted-foreground">
                  សរុប {totalCount} នាក់ · មានសុពលភាព {activeCount} នាក់
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowCreate(true)}
            >
              <PlusCircleIcon className="h-4 w-4" />
              បន្ថែមសមាជិក
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-4">
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
            emptyMessage="គ្មានទិន្នន័យ"
            exportFileName="members.csv"
            printTitle="សមាជិក"
            rowActions={(row) => [
              {
                label: "មើល",
                onClick: () => {
                  setCustomerID(row.customer_id);
                  setShowProfile(true);
                },
                icon: <EyeIcon className="h-3.5 w-3.5" />,
              },
            ]}
          />
        </CardContent>
      </Card>

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
