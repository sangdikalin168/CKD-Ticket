import { useState } from "react";
import { useTranslation } from "react-i18next";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Plus, Pencil, Settings2, X, Image as ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/ui/PageHeader";
import { PriceCard } from "@/components/ui/PriceCard";
import { FacilityDot } from "@/components/ui/FacilityMark";
import { cn } from "@/lib/utils";

// ─── GraphQL ────────────────────────────────────────────────────────────────

const GET_CONFIGS = gql`
  query GetTicketPriceConfigs {
    GetTicketPriceConfigs {
      config_id price label key_image age_group
      facilities { facility_id name code }
    }
  }
`;
const GET_FACILITIES = gql`
  query { facilities { facility_id name code } }
`;
const UPSERT_CONFIG = gql`
  mutation UpsertTicketPriceConfig($price: Float!, $facility_ids: [Float!]!, $label: String, $key_image: String, $age_group: String) {
    UpsertTicketPriceConfig(price: $price, facility_ids: $facility_ids, label: $label, key_image: $key_image, age_group: $age_group) {
      config_id price label key_image age_group
      facilities { facility_id name code }
    }
  }
`;
const DELETE_CONFIG = gql`
  mutation DeleteTicketPriceConfig($config_id: Float!) {
    DeleteTicketPriceConfig(config_id: $config_id)
  }
`;

const AGE_GROUPS = ["កុមារ", "មនុស្សពេញវ័យ", "ចាស់"];

// Resize an uploaded image to a small base64 JPEG (keeps DB + transport light).
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

/** A selectable option: outline at rest, the amber mark when chosen. */
function Choice({ active, onClick, children, className }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "border-amber-deep bg-amber text-ink" : "border-rule bg-card text-ink hover:bg-wash",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TicketPriceConfigPage() {
  const { t } = useTranslation();
  const { data, loading, refetch } = useQuery(GET_CONFIGS, { fetchPolicy: "no-cache" });
  const { data: facilitiesData } = useQuery(GET_FACILITIES);
  const [upsert, { loading: saving }] = useMutation(UPSERT_CONFIG);
  const [deleteConfig] = useMutation(DELETE_CONFIG);

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [price, setPrice] = useState("");
  const [label, setLabel] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [keyImage, setKeyImage] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const configs: any[] = [...(data?.GetTicketPriceConfigs ?? [])].sort((a, b) => a.price - b.price);
  const facilities: any[] = facilitiesData?.facilities ?? [];

  const toggleFacility = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openAdd = () => {
    setEditItem(null);
    setPrice("");
    setLabel("");
    setAgeGroup("");
    setKeyImage("");
    setSelectedIds(new Set());
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setPrice(String(item.price));
    setLabel(item.label ?? "");
    setAgeGroup(item.age_group ?? "");
    setKeyImage(item.key_image ?? "");
    setSelectedIds(new Set(item.facilities.map((f: any) => f.facility_id)));
    setOpen(true);
  };

  const handleSave = async () => {
    if (!price || selectedIds.size === 0) {
      toast("សូមបញ្ចូលតម្លៃ និងជ្រើសរើសសេវាយ៉ាងហោចណាស់មួយ", { type: "warning" });
      return;
    }
    try {
      await upsert({
        variables: {
          price: parseFloat(price),
          facility_ids: Array.from(selectedIds),
          label: label || undefined,
          age_group: ageGroup || undefined,
          key_image: keyImage || null,
        },
      });
      toast("រក្សាទុកបានជោគជ័យ", { type: "success" });
      setOpen(false);
      refetch();
    } catch (e: any) {
      toast("មានបញ្ហា: " + e.message, { type: "error" });
    }
  };

  const handleDelete = async (config_id: number) => {
    if (!confirm("លុបការកំណត់នេះ?")) return;
    try {
      await deleteConfig({ variables: { config_id } });
      toast("លុបបានជោគជ័យ", { type: "success" });
      refetch();
    } catch (e: any) {
      toast("មានបញ្ហា: " + e.message, { type: "error" });
    }
  };

  // Preview facilities for dialog
  const previewFacilities = facilities.filter((f) => selectedIds.has(f.facility_id));

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="ticket.priceSetup"
        subtitle={t("ticket.priceSetupHint")}
        actions={
          <Button onClick={openAdd}>
            <Plus aria-hidden="true" /> បន្ថែមតម្លៃ
          </Button>
        }
      />

      {/* Tiles */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="status" aria-live="polite">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[7.5rem] rounded-lg" />)}
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-lg border border-rule bg-card">
          <EmptyState
            icon={Settings2}
            title="មិនទាន់មានតម្លៃសំបុត្រទេ"
            description="បន្ថែមតម្លៃដំបូង រួចអ្នកគិតលុយនឹងឃើញវានៅលើអេក្រង់លក់។"
            action={
              <Button variant="outline" size="sm" onClick={openAdd}>
                <Plus aria-hidden="true" /> បន្ថែមតម្លៃ
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {configs.map((c) => (
            <li key={c.config_id} className="min-w-0">
              <PriceCard
                price={c.price}
                ageGroup={c.age_group}
                caption={
                  <>
                    {c.age_group && <span className="font-medium text-ink">{c.age_group}</span>}
                    {c.age_group && c.label && " · "}
                    {c.label}
                    {!c.age_group && !c.label && t("price.oneEntry")}
                  </>
                }
                facilities={c.facilities}
                corner={
                  <span className="flex items-center gap-0.5">
                    {c.key_image && (
                      <img src={c.key_image} alt="" className="mr-1 h-6 w-6 rounded border border-rule object-cover" />
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)} aria-label={t("common.edit")}>
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-void hover:bg-void-tint hover:text-void" onClick={() => handleDelete(c.config_id)} aria-label={t("common.delete")}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "កែតម្លៃសំបុត្រ" : "បន្ថែមតម្លៃសំបុត្រ"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            {/* Price */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-price">តម្លៃ ($)</Label>
              <Input
                id="ticket-price"
                type="number" step="0.5" min="0" placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={!!editItem}
                className="text-lg font-semibold"
              />
              {editItem && (
                <p className="text-caption text-ink-soft">តម្លៃមិនអាចផ្លាស់ប្តូរ — លុបហើយបន្ថែមថ្មី</p>
              )}
            </div>

            {/* Facility multi-select */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">{t("prices.chooseFacilities")}</legend>
              <div className="grid grid-cols-1 gap-2">
                {facilities.map((f) => {
                  const checked = selectedIds.has(f.facility_id);
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
              {selectedIds.size === 0 && (
                <p className="text-caption text-void-deep">ជ្រើសរើសសេវាយ៉ាងហោចណាស់មួយ</p>
              )}
            </fieldset>

            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-label">ស្លាក <span className="font-normal text-ink-soft">({t("common.optional")})</span></Label>
              <Input
                id="ticket-label"
                placeholder="e.g. Day Pass, Morning, VIP"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {/* Age group */}
            <div className="space-y-1.5">
              <Label>ក្រុមអាយុ <span className="font-normal text-ink-soft">({t("common.optional")})</span></Label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map((ag) => (
                  <Choice key={ag} active={ageGroup === ag} onClick={() => setAgeGroup(ageGroup === ag ? "" : ag)}>
                    {ag}
                  </Choice>
                ))}
                <Input
                  className="h-8 w-32"
                  placeholder="ផ្សេងទៀត..."
                  aria-label="ក្រុមអាយុផ្សេងទៀត"
                  value={![...AGE_GROUPS, ""].includes(ageGroup) ? ageGroup : ""}
                  onChange={(e) => setAgeGroup(e.target.value)}
                />
              </div>
            </div>

            {/* Key image upload — shown to check-in staff so they know which key to give */}
            <div className="space-y-1.5">
              <Label>
                រូបកូនសោ <span className="font-normal text-ink-soft">({t("common.optional")})</span>
              </Label>
              {keyImage ? (
                <div className="relative inline-block">
                  <img src={keyImage} alt="key" className="h-24 w-24 rounded-lg border border-rule object-cover" />
                  <button
                    type="button"
                    onClick={() => setKeyImage("")}
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
                      if (file) setKeyImage(await fileToResizedDataUrl(file));
                    }}
                  />
                </label>
              )}
              <p className="text-caption text-ink-soft">
                បុគ្គលិក Check-In នឹងឃើញរូបនេះ ដើម្បីដឹងថាត្រូវផ្តល់កូនសោណា
              </p>
            </div>

            {/* Live preview — the tile as the cashier will see it */}
            {price && selectedIds.size > 0 && (
              <div className="flex items-center gap-4 rounded-lg border border-dashed border-rule bg-wash p-3">
                <PriceCard
                  className="w-44 shrink-0 bg-card"
                  price={parseFloat(price) || 0}
                  ageGroup={ageGroup}
                  caption={
                    <>
                      {ageGroup && <span className="font-medium text-ink">{ageGroup}</span>}
                      {ageGroup && label && " · "}
                      {label}
                      {!ageGroup && !label && t("price.oneEntry")}
                    </>
                  }
                  facilities={previewFacilities}
                  corner={keyImage ? <img src={keyImage} alt="" className="h-6 w-6 rounded border border-rule object-cover" /> : undefined}
                />
                <p className="text-caption text-ink-soft">{t("common.preview")}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>បោះបង់</Button>
            <Button onClick={handleSave} disabled={saving || selectedIds.size === 0}>
              {saving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
