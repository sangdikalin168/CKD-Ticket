import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertCircle, Trash2, Pencil, Plus, Tags, Search } from "lucide-react";
import { toast } from "react-toastify";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney, formatCount } from "@/lib/money";

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const GET_COUPON_CARDS = gql`
  query GetCouponCards($status: String, $search: String) {
    GetCouponCards(status: $status, search: $search) {
      id created_date coupon_code status quantity price card_name
    }
  }
`;
const CREATE_COUPON_CARD = gql`
  mutation CreateCouponCard($card_name: String!, $coupon_code: String!, $price: Float!, $quantity: Int!) {
    CreateCouponCard(card_name: $card_name, coupon_code: $coupon_code, price: $price, quantity: $quantity) {
      code success message
      couponCard { id created_date coupon_code status quantity price card_name }
    }
  }
`;
const UPDATE_COUPON_CARD = gql`
  mutation UpdateCouponCard($id: Int!, $card_name: String, $price: Float, $quantity: Int) {
    UpdateCouponCard(id: $id, card_name: $card_name, price: $price, quantity: $quantity) {
      code success message
      couponCard { id created_date coupon_code status quantity price card_name }
    }
  }
`;
const DELETE_COUPON_CARD = gql`
  mutation DeleteCouponCard($id: Int!) {
    DeleteCouponCard(id: $id) {
      code success message
    }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUS = "__all__";

/** The two states a coupon card can be in — mapped onto the app's one Chip,
 *  not a bespoke colour set. Pending is a decision not yet made (unsold
 *  stock); sold is done. */
const STATUS_TONE: Record<string, ChipTone> = {
  Pending: "pending",
  Sold: "paid",
};
const statusTone = (status: string): ChipTone => STATUS_TONE[status] ?? "muted";

interface CouponCard {
  id: number;
  created_date: string;
  coupon_code: string;
  status: string;
  quantity: number;
  price: number;
  card_name: string;
}

interface CouponForm {
  id: number;
  card_name: string;
  coupon_code: string;
  price: string;
  quantity: string;
}

const emptyForm = (): CouponForm => ({ id: 0, card_name: "", coupon_code: "", price: "", quantity: "1" });

// ─── Component ────────────────────────────────────────────────────────────────

export const CouponPriceTable = () => {
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [search, setSearch] = useState("");

  const { data, loading, error, refetch } = useQuery(GET_COUPON_CARDS, {
    variables: {
      status: statusFilter === ALL_STATUS ? undefined : statusFilter,
      search: search.trim() || undefined,
    },
    fetchPolicy: "cache-and-network",
  });
  const cards: CouponCard[] = data?.GetCouponCards ?? [];

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<CouponCard | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm());

  const [createCard, { loading: creating }] = useMutation(CREATE_COUPON_CARD, {
    onCompleted: (res) => {
      if (res.CreateCouponCard.success) {
        refetch();
        setOpen(false);
        toast(t("couponPrices.createSuccess"), { type: "success" });
      } else {
        toast(res.CreateCouponCard.message, { type: "error" });
      }
    },
    onError: (e) => toast(e.message, { type: "error" }),
  });
  const [updateCard, { loading: updating }] = useMutation(UPDATE_COUPON_CARD, {
    onCompleted: (res) => {
      if (res.UpdateCouponCard.success) {
        refetch();
        setOpen(false);
        toast(t("couponPrices.updateSuccess"), { type: "success" });
      } else {
        toast(res.UpdateCouponCard.message, { type: "error" });
      }
    },
    onError: (e) => toast(e.message, { type: "error" }),
  });
  const [deleteCard] = useMutation(DELETE_COUPON_CARD, {
    onCompleted: (res) => {
      if (res.DeleteCouponCard.success) {
        refetch();
        toast(t("couponPrices.deleteSuccess"), { type: "success" });
      } else {
        toast(res.DeleteCouponCard.message, { type: "error" });
      }
    },
    onError: (e) => toast(e.message, { type: "error" }),
  });

  const set = (field: keyof CouponForm, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const openEdit = (row: CouponCard) => {
    setEditItem(row);
    setForm({ id: row.id, card_name: row.card_name, coupon_code: row.coupon_code, price: String(row.price), quantity: String(row.quantity) });
    setOpen(true);
  };
  const handleDelete = (row: CouponCard) => {
    if (row.status !== "Pending") return;
    if (!confirm(t("couponPrices.deleteConfirm", { name: row.card_name }))) return;
    deleteCard({ variables: { id: row.id } });
  };

  const handleSave = () => {
    const name = form.card_name.trim();
    const code = form.coupon_code.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);

    if (!name || !code) {
      toast(t("couponPrices.validationRequired"), { type: "warning" });
      return;
    }
    if (!(price >= 0)) {
      toast(t("couponPrices.validationPrice"), { type: "warning" });
      return;
    }
    if (!(quantity >= 1)) {
      toast(t("couponPrices.validationQuantity"), { type: "warning" });
      return;
    }

    if (editItem) {
      updateCard({ variables: { id: editItem.id, card_name: name, price, quantity } });
    } else {
      createCard({ variables: { card_name: name, coupon_code: code, price, quantity } });
    }
  };

  if (loading && !data)
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <span className="sr-only">{t("common.loading")}</span>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-full max-w-xl" />
        <div className="space-y-px overflow-hidden rounded-lg border border-rule bg-rule">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 bg-card px-3 py-2">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-3.5 flex-1" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  if (error)
    return (
      <p className="flex items-center gap-2 p-4 text-sm text-void-deep" role="alert">
        <AlertCircle className="h-4 w-4 shrink-0 text-void" aria-hidden="true" />
        {error.message}
      </p>
    );

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="couponPrices.title"
        subtitle={t("couponPrices.subtitle")}
        actions={
          <Button onClick={openAdd}>
            <Plus aria-hidden="true" /> {t("couponPrices.addNew")}
          </Button>
        }
      />

      {/* Search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <Input
            className="pl-8"
            placeholder={t("couponPrices.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>{t("couponPrices.statusAll")}</SelectItem>
            <SelectItem value="Pending">{t("couponPrices.statusPending")}</SelectItem>
            <SelectItem value="Sold">{t("couponPrices.statusSold")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {cards.length === 0 ? (
        <div className="rounded-lg border border-rule bg-card">
          <EmptyState
            icon={Tags}
            title={t("couponPrices.emptyTitle")}
            description={t("couponPrices.emptyHint")}
            action={
              <Button variant="outline" size="sm" onClick={openAdd}>
                <Plus aria-hidden="true" /> {t("couponPrices.addNew")}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-lg border border-rule bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("couponPrices.columnName")}</TableHead>
                <TableHead>{t("couponPrices.columnCode")}</TableHead>
                <TableHead className="text-right">{t("couponPrices.columnPrice")}</TableHead>
                <TableHead className="text-right">{t("couponPrices.columnQuantity")}</TableHead>
                <TableHead>{t("couponPrices.columnStatus")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("couponPrices.columnCreatedDate")}</TableHead>
                <TableHead className="w-20"><span className="sr-only">{t("couponPrices.columnActions")}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-ink">{row.card_name}</TableCell>
                  <TableCell className="figure text-ink-soft">{row.coupon_code}</TableCell>
                  <TableCell className="text-right">
                    <span className="figure font-semibold text-ink">{formatMoney(row.price)}</span>
                  </TableCell>
                  <TableCell className="figure text-right">{formatCount(row.quantity)}</TableCell>
                  <TableCell>
                    <Chip tone={statusTone(row.status)}>
                      {row.status === "Pending" ? t("couponPrices.statusPending")
                        : row.status === "Sold" ? t("couponPrices.statusSold")
                        : row.status}
                    </Chip>
                  </TableCell>
                  <TableCell className="hidden text-caption text-ink-soft md:table-cell">{row.created_date}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)} aria-label={t("common.edit")}>
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-void-tint hover:text-void disabled:pointer-events-none disabled:opacity-30"
                        disabled={row.status !== "Pending"}
                        title={row.status !== "Pending" ? t("couponPrices.deleteDisabledHint") : undefined}
                        aria-label={t("common.delete")}
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editItem ? t("couponPrices.dialogEditTitle") : t("couponPrices.dialogCreateTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="cp-name">{t("couponPrices.fieldName")}</Label>
              <Input id="cp-name" value={form.card_name} onChange={(e) => set("card_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-code">{t("couponPrices.fieldCode")}</Label>
              <Input
                id="cp-code"
                className="figure"
                value={form.coupon_code}
                onChange={(e) => set("coupon_code", e.target.value)}
                disabled={!!editItem}
              />
              {editItem && (
                <p className="text-caption text-ink-soft">{t("couponPrices.codeLockedHint")}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-price">{t("couponPrices.fieldPrice")}</Label>
                <Input
                  id="cp-price"
                  type="number" min="0" step="0.5"
                  className="figure font-semibold"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-quantity">{t("couponPrices.fieldQuantity")}</Label>
                <Input
                  id="cp-quantity"
                  type="number" min="1" step="1"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={updating || creating}>
              {t("couponPrices.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={updating || creating}>
              {editItem
                ? (updating ? t("couponPrices.saving") : t("couponPrices.save"))
                : (creating ? t("couponPrices.creating") : t("couponPrices.create"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponPriceTable;
