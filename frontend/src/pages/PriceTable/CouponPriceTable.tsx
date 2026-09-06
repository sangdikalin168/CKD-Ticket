// @ts-nocheck
import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Trash2, Pencil, Plus, Ticket, Search } from "lucide-react";
import { toast } from "react-toastify";
import LoadingPage from "../../components/LoadingPage/LoadingPage";

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
const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Sold: "bg-green-100 text-green-700 border-green-200",
};
const statusColor = (status: string) => STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700 border-gray-200";

const emptyForm = () => ({ id: 0, card_name: "", coupon_code: "", price: "", quantity: "1" });

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
  const cards: any[] = data?.GetCouponCards ?? [];

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm());

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

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const openEdit = (row: any) => {
    setEditItem(row);
    setForm({ id: row.id, card_name: row.card_name, coupon_code: row.coupon_code, price: String(row.price), quantity: String(row.quantity) });
    setOpen(true);
  };
  const handleDelete = (row: any) => {
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

  if (loading && !data) return <LoadingPage message={t("common.loading")} />;
  if (error) return <div className="p-4 text-destructive">{t("common.error")}: {error.message}</div>;

  return (
    <div className="space-y-4 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Ticket className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("couponPrices.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("couponPrices.subtitle")}</p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> {t("couponPrices.addNew")}
        </Button>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 gap-3">
          <Ticket className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">{t("couponPrices.emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("couponPrices.emptyHint")}</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">{t("couponPrices.columnName")}</TableHead>
                <TableHead className="font-semibold">{t("couponPrices.columnCode")}</TableHead>
                <TableHead className="font-semibold text-right">{t("couponPrices.columnPrice")}</TableHead>
                <TableHead className="font-semibold text-right">{t("couponPrices.columnQuantity")}</TableHead>
                <TableHead className="font-semibold">{t("couponPrices.columnStatus")}</TableHead>
                <TableHead className="font-semibold">{t("couponPrices.columnCreatedDate")}</TableHead>
                <TableHead className="font-semibold text-right">{t("couponPrices.columnActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.card_name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.coupon_code}</TableCell>
                  <TableCell className="text-right font-semibold">${row.price}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(row.status)}>
                      {row.status === "Pending" ? t("couponPrices.statusPending")
                        : row.status === "Sold" ? t("couponPrices.statusSold")
                        : row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.created_date}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive disabled:opacity-30"
                        disabled={row.status !== "Pending"}
                        title={row.status !== "Pending" ? t("couponPrices.deleteDisabledHint") : undefined}
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
            <DialogTitle className="flex items-center gap-2">
              {editItem ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editItem ? t("couponPrices.dialogEditTitle") : t("couponPrices.dialogCreateTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>{t("couponPrices.fieldName")}</Label>
              <Input value={form.card_name} onChange={(e) => set("card_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("couponPrices.fieldCode")}</Label>
              <Input
                value={form.coupon_code}
                onChange={(e) => set("coupon_code", e.target.value)}
                disabled={!!editItem}
                className="font-mono"
              />
              {editItem && (
                <p className="text-xs text-muted-foreground">{t("couponPrices.codeLockedHint")}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("couponPrices.fieldPrice")}</Label>
                <Input
                  type="number" min="0" step="0.5"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className="font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("couponPrices.fieldQuantity")}</Label>
                <Input
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
