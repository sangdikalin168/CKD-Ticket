import { gql, useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-line";
import { Trash2, Pencil, Plus, Image as ImageIcon, X } from "lucide-react";
import { toast } from "react-toastify";
import LoadingPage from "../../components/LoadingPage/LoadingPage";
import { PageHeader } from "@/components/ui/PageHeader";
import { FacilityDot, FacilityMarks, useFacilityName } from "@/components/ui/FacilityMark";
import { facilitiesOfServiceType } from "@/lib/facility";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const GET_ALL_PRICES = gql`
  query getAllMemberPriceTable {
    getAllMemberPriceTable {
      id description ageGroup customerType serviceType shift monthQty price entryQty key_image
      facilities { facility_id name code }
    }
  }
`;
const GET_FACILITIES = gql`
  query { facilities { facility_id name code } }
`;
const UPDATE_PRICE = gql`
  mutation UpdatePrice($updatePriceId: Int!, $description: String, $ageGroup: String, $customerType: String, $shift: String, $monthQty: Float, $price: Float, $entryQty: Float, $key_image: String, $facility_ids: [Int!]) {
    updatePrice(id: $updatePriceId, description: $description, ageGroup: $ageGroup, customerType: $customerType, shift: $shift, monthQty: $monthQty, price: $price, entryQty: $entryQty, key_image: $key_image, facility_ids: $facility_ids) {
      id description ageGroup customerType serviceType shift monthQty price entryQty key_image
      facilities { facility_id name code }
    }
  }
`;
const CREATE_PRICE = gql`
  mutation CreateMemberPrice($price: Float!, $customerType: String!, $ageGroup: String!, $description: String!, $shift: String, $entryQty: Float, $monthQty: Float, $key_image: String, $facility_ids: [Int!]) {
    createMemberPrice(price: $price, customerType: $customerType, ageGroup: $ageGroup, description: $description, shift: $shift, entryQty: $entryQty, monthQty: $monthQty, key_image: $key_image, facility_ids: $facility_ids) {
      id description ageGroup customerType serviceType shift monthQty price entryQty key_image
      facilities { facility_id name code }
    }
  }
`;
const DELETE_PRICE = gql`
  mutation DeleteMemberPrice($deleteMemberPriceId: Float!) {
    deleteMemberPrice(id: $deleteMemberPriceId)
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { value: "Swim",         label: "ហែលទឹក" },
  { value: "SwimGym",      label: "ហែលទឹក + Gym" },
  { value: "SwimSteam",    label: "ហែលទឹក + Steam" },
  { value: "SwimGymSteam", label: "ហែលទឹក + Gym + Steam" },
];
const AGE_GROUPS    = [{ value: "Kid", label: "តូច (Kid)" }, { value: "Adult", label: "ធំ (Adult)" }];
const CUSTOMER_TYPES = [
  { value: "Full", label: "ពេញ (Full Price)" },
  { value: "Old",  label: "ចាស់ (Existing Member)" },
  { value: "New",  label: "ថ្មី (New Member)" },
];
const SHIFTS = [{ value: "Full", label: "Full" }, { value: "Morning", label: "ព្រឹក (Morning)" }];

const svcLabel = (s: string) => SERVICE_TYPES.find((x) => x.value === s)?.label ?? s;
const ageLabel  = (a: string) => a === "Kid" ? "តូច" : "ធំ";
const custLabel = (c: string) => ({ Full: "ពេញ", Old: "ចាស់", New: "ថ្មី" })[c] ?? c;
const shiftLabel = (s: string) => s === "Morning" ? "ព្រឹក" : "Full";

const buildDescription = (f: any) =>
  `${svcLabel(f.serviceType)} ${custLabel(f.customerType)} ${f.monthQty}ខែ ${ageLabel(f.ageGroup)} (${f.price}$)`;

// ─── Empty form state ─────────────────────────────────────────────────────────

const emptyForm = () => ({
  id: 0, description: "", ageGroup: "", customerType: "",
  serviceType: "", shift: "Full", monthQty: 1, price: 0, entryQty: 1, key_image: "",
});

function fileToResizedDataUrl(file: File, maxSize = 512, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = Math.round((h * maxSize) / w); w = maxSize; }
        else if (h > maxSize) { w = Math.round((w * maxSize) / h); h = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** A selectable choice: outline at rest, ink when chosen. */
function Choice({ active, onClick, children, className }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "border-ink bg-ink text-white" : "border-rule bg-card text-ink hover:bg-wash",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MemberPriceTable = () => {
  const { t } = useTranslation();
  const facilityName = useFacilityName();
  const { data, loading, error, refetch } = useQuery(GET_ALL_PRICES);
  const { data: facilitiesData } = useQuery(GET_FACILITIES);
  const [prices, setPrices] = useState<any[]>([]);
  const facilities: any[] = facilitiesData?.facilities ?? [];

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (data?.getAllMemberPriceTable) setPrices(data.getAllMemberPriceTable);
  }, [data]);

  const [updatePrice, { loading: updating }] = useMutation(UPDATE_PRICE, {
    onCompleted: () => { refetch(); setOpen(false); toast("រក្សាទុកបានជោគជ័យ", { type: "success" }); },
    onError: (e) => toast("Error: " + e.message, { type: "error" }),
  });
  const [createPrice, { loading: creating }] = useMutation(CREATE_PRICE, {
    onCompleted: () => { refetch(); setOpen(false); toast("បន្ថែមបានជោគជ័យ", { type: "success" }); },
    onError: (e) => toast("Error: " + e.message, { type: "error" }),
  });
  const [deletePrice] = useMutation(DELETE_PRICE, {
    onCompleted: () => { refetch(); toast("លុបបានជោគជ័យ", { type: "success" }); },
    onError: (e) => toast("Error: " + e.message, { type: "error" }),
  });

  const toggleFacility = (id: number) =>
    setSelectedFacilityIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm());
    setSelectedFacilityIds(new Set());
    setOpen(true);
  };
  const openEdit = (row: any) => {
    setEditItem(row);
    setForm({ ...row });
    setSelectedFacilityIds(new Set((row.facilities ?? []).map((f: any) => f.facility_id)));
    setOpen(true);
  };
  const handleDelete = (id: number) => {
    if (!confirm("លុបការកំណត់នេះ?")) return;
    deletePrice({ variables: { deleteMemberPriceId: id } });
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const { ageGroup, customerType, shift, monthQty, price, entryQty } = form;
    if (!ageGroup || !customerType || !shift || !monthQty || !price || !entryQty || selectedFacilityIds.size === 0) {
      toast("សូមបំពេញព័ត៌មានទាំងអស់ និងជ្រើស Facility យ៉ាងហោចណាស់ 1", { type: "warning" }); return;
    }
    const description = buildDescription(form);
    const key_image = form.key_image || null;
    const facility_ids = Array.from(selectedFacilityIds);
    if (editItem) {
      updatePrice({ variables: { updatePriceId: editItem.id, description, ageGroup, customerType, shift, monthQty: +monthQty, price: +price, entryQty: +entryQty, key_image, facility_ids } });
    } else {
      createPrice({ variables: { description, ageGroup, customerType, shift, monthQty: +monthQty, price: +price, entryQty: +entryQty, key_image, facility_ids } });
    }
  };

  // Rows per service type
  const rowsFor = (serviceType: string) =>
    prices.filter((p) => p.serviceType === serviceType).sort((a, b) => a.price - b.price);

  const PriceTable = ({ serviceType }: { serviceType: string }) => {
    const rows = rowsFor(serviceType);
    // The key photo is optional per row; a column of em dashes says nothing, so
    // it appears only where at least one row in this service type carries one.
    const showKey = rows.some((r) => !!r.key_image);
    const svcFacilities = facilitiesOfServiceType(serviceType);
    if (rows.length === 0) return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rule bg-card py-12">
        <p className="text-sm text-ink-soft">មិនទាន់មានការកំណត់</p>
        <Button variant="outline" size="sm" onClick={openAdd}>
          <Plus aria-hidden="true" /> បន្ថែម
        </Button>
      </div>
    );
    return (
      <div className="overflow-hidden rounded-lg border border-rule bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ចំនួនខែ</TableHead>
              <TableHead>ក្រុមអាយុ</TableHead>
              <TableHead>អតិថិជន</TableHead>
              <TableHead>វេន</TableHead>
              <TableHead className="text-right">ចំនួនចូល</TableHead>
              <TableHead className="text-right">តម្លៃ</TableHead>
              <TableHead>{t("ticket.col.facility")}</TableHead>
              {showKey && <TableHead className="w-16 text-center">{t("prices.key")}</TableHead>}
              <TableHead className="w-20"><span className="sr-only">{t("common.actions")}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold">{row.monthQty} ខែ</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ageLabel(row.ageGroup)}</Badge>
                  </TableCell>
                  <TableCell>{custLabel(row.customerType)}</TableCell>
                  <TableCell className="text-ink-soft">{shiftLabel(row.shift)}</TableCell>
                  <TableCell className="text-right">{row.entryQty}×</TableCell>
                  <TableCell className="text-right">
                    <span className="figure text-lg font-semibold text-ink">{formatMoney(row.price)}</span>
                  </TableCell>
                  <TableCell>
                    <FacilityMarks facilities={row.facilities?.length ? row.facilities : svcFacilities} />
                  </TableCell>
                  {showKey && (
                    <TableCell>
                      {row.key_image ? (
                        <img src={row.key_image} alt={t("prices.key")} className="mx-auto h-8 w-8 rounded border border-rule object-cover" />
                      ) : (
                        <span className="block text-center text-ink-soft">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)} aria-label={t("common.edit")}>
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-void-tint hover:text-void" onClick={() => handleDelete(row.id)} aria-label={t("common.delete")}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) return <LoadingPage message={t("common.loading")} />;
  if (error) return <div className="p-4 text-void-deep">Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="prices.member"
        subtitle="គ្រប់គ្រងតម្លៃសមាជិកតាមប្រភេទ / ក្រុមអាយុ / វេន"
        actions={
          <Button onClick={openAdd}>
            <Plus aria-hidden="true" /> បន្ថែម
          </Button>
        }
      />

      {/* Tabs — one per service type, each marked with its facility dots */}
      <Tabs defaultValue="Swim" className="space-y-4">
        <TabsList>
          {SERVICE_TYPES.map((st) => {
            const count = rowsFor(st.value).length;
            const marks = facilitiesOfServiceType(st.value);
            return (
              <TabsTrigger key={st.value} value={st.value}>
                <span className="inline-flex items-center gap-1">
                  {marks.map((code) => (
                    <FacilityDot key={code} code={code} />
                  ))}
                </span>
                {marks.length ? marks.map((code) => facilityName(code)).join(" + ") : st.label}
                {count > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">{count}</Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SERVICE_TYPES.map((st) => (
          <TabsContent key={st.value} value={st.value}>
            <PriceTable serviceType={st.value} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "កែតម្លៃសមាជិក" : "បន្ថែមតម្លៃសមាជិក"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* Facility multi-select */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">{t("prices.chooseFacilities")}</legend>
              <div className="grid grid-cols-1 gap-2">
                {facilities.map((f: any) => {
                  const checked = selectedFacilityIds.has(f.facility_id);
                  return (
                    <label
                      key={f.facility_id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                        checked ? "border-amber-deep bg-amber-tint" : "border-rule bg-card hover:bg-wash"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-rule text-ink focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        checked={checked}
                        onChange={() => toggleFacility(f.facility_id)}
                      />
                      <FacilityDot code={f.code} />
                      <span className="text-sm font-medium text-ink">{f.name}</span>
                    </label>
                  );
                })}
              </div>
              {selectedFacilityIds.size === 0 && (
                <p className="text-caption text-void-deep">ជ្រើសសេវាយ៉ាងហោចណាស់មួយ</p>
              )}
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              {/* Age group */}
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium text-ink">ក្រុមអាយុ</legend>
                <div className="flex gap-2">
                  {AGE_GROUPS.map((ag) => (
                    <Choice key={ag.value} className="flex-1" active={form.ageGroup === ag.value} onClick={() => set("ageGroup", ag.value)}>
                      {ag.value === "Kid" ? "តូច" : "ធំ"}
                    </Choice>
                  ))}
                </div>
              </fieldset>

              {/* Shift */}
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium text-ink">វេន</legend>
                <div className="flex gap-2">
                  {SHIFTS.map((sh) => (
                    <Choice key={sh.value} className="flex-1" active={form.shift === sh.value} onClick={() => set("shift", sh.value)}>
                      {sh.label}
                    </Choice>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Customer type */}
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium text-ink">ប្រភេទអតិថិជន</legend>
              <div className="grid grid-cols-3 gap-2">
                {CUSTOMER_TYPES.map((ct) => (
                  <Choice key={ct.value} active={form.customerType === ct.value} onClick={() => set("customerType", ct.value)}>
                    {custLabel(ct.value)}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mp-month">ចំនួនខែ</Label>
                <Input id="mp-month" type="number" min="1" step="0.5" value={form.monthQty} onChange={(e) => set("monthQty", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mp-price">តម្លៃ ($)</Label>
                <Input id="mp-price" type="number" min="0" step="0.5" value={form.price} onChange={(e) => set("price", e.target.value)} className="font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mp-entry">ចំនួនចូល</Label>
                <Input id="mp-entry" type="number" min="1" step="1" value={form.entryQty} onChange={(e) => set("entryQty", e.target.value)} />
              </div>
            </div>

            {/* Key image upload */}
            <div className="space-y-1.5">
              <Label>
                រូបកូនសោ <span className="font-normal text-ink-soft">(optional)</span>
              </Label>
              {form.key_image ? (
                <div className="relative inline-block">
                  <img src={form.key_image} alt="key" className="h-24 w-24 rounded-lg border border-rule object-cover" />
                  <button
                    type="button"
                    onClick={() => set("key_image", "")}
                    aria-label={t("common.delete")}
                    className="absolute -right-2 -top-2 rounded-full bg-void p-1 text-chalk"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-rule hover:bg-wash">
                  <ImageIcon className="h-5 w-5 text-ink-soft" aria-hidden="true" />
                  <span className="text-caption text-ink-soft">ចុចដើម្បីដាក់រូបកូនសោ</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) set("key_image", await fileToResizedDataUrl(file));
                    }}
                  />
                </label>
              )}
              <p className="text-caption text-ink-soft">
                បុគ្គលិក Check-In នឹងឃើញរូបនេះ ដើម្បីដឹងថាត្រូវផ្តល់កូនសោណា
              </p>
            </div>

            {/* Live preview */}
            {form.serviceType && form.ageGroup && form.customerType && form.price > 0 && (
              <div className="rounded-lg border border-dashed border-rule bg-wash p-3">
                <p className="text-caption text-ink-soft">{t("common.preview")}</p>
                <p className="text-sm font-semibold text-ink">{buildDescription(form)}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={updating || creating}>
              បោះបង់
            </Button>
            <Button onClick={handleSave} disabled={updating || creating}>
              {updating || creating ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
