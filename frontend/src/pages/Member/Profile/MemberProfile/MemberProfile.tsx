import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  Camera,
  Clock,
  Fingerprint,
  GraduationCap,
  Hash,
  PauseCircle,
  Pencil,
  Phone,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Upload,
  UserRound,
} from "lucide-react";
import { CachedImage } from "@/components/ui/CachedImage";
import { useGetActiveHoldRequestV2Query } from "../../../../generated/holdV2";
import {
  useGetCustomerDetailQuery,
  useGetFruitPaymentQuery,
  useGetMemberPaymentQuery,
  useGetTrainningPaymentQuery,
} from "../../../../generated/graphql";
import { TrainingPaymentForm } from "../TrainningForm/TrainningForm";
import { MemberPayment } from "./MemberPayment";
import { TrainningPayment } from "./TrainningPayment";
import { CouponPayment } from "../CouponForm/CouponForm";
import { RenewForm } from "../RenewForm/RenewForm";
import FruitPaymentTable from "./FruitPaymentTable";
import { FruitPayment } from "../FruitPayment/FruitPayment";
import { UpdateProfile } from "./UpdateProfile";
import Notifications from "../../../../components/Notification";
import HoldForm from "../Hold/HoldForm";
import Transfer from "../Transfer/Transfer";
import WebcamCapture from "../../../../components/WebcamCapture/WebcamCapture";
import { useMutation } from "@apollo/client";
import { UPDATE_CUSTOMER_PHOTO } from "../../../../graphql/Customer/UpdateCustomerPhoto";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs-line";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { MagnetChip } from "@/components/board/MagnetChip";
import { EnrollFingerprintModal } from "../EnrollFingerprint/EnrollFingerprintModal";

const MemberProfile = ({ ID }: any) => {
  const { t } = useTranslation();
  const { data, loading: loading_member_detail, refetch: refetchMemberDetail } = useGetCustomerDetailQuery({
    variables: { customerId: ID },
    fetchPolicy: "no-cache",
  });

  const {
    data: member_payment,
    loading: loading_payment,
    refetch: refechMemberPayment,
  } = useGetMemberPaymentQuery({
    variables: { customerId: ID },
    fetchPolicy: "no-cache",
  });

  const {
    data: trainning_payment,
    loading: loading_trainning_payment,
    refetch: refetch_trainning_payment,
  } = useGetTrainningPaymentQuery({
    variables: { customerId: ID },
    fetchPolicy: "no-cache",
  });

  const { data: fruit_payment, loading: loading_fruit_payment, refetch: fruitPaymentRefetch } = useGetFruitPaymentQuery({
    variables: { customerId: ID },
    fetchPolicy: "no-cache",
  });

  const { data: request_data, refetch: refetchHoldRequest } = useGetActiveHoldRequestV2Query({
    variables: { customerId: ID },
    fetchPolicy: "no-cache",
  });

  const details = data?.GetCustomerDetail[0];

  const [open_coupon, setIsOpenCoupon] = useState(false);
  const [open_trainning, setOpenTrainning] = useState(false);
  const [open_member, setOpenMember] = useState(false);
  const [open_fruit, setOpenFruit] = useState(false);
  const [open_update, setOpenUpdate] = useState(false);
  const [open_hold, setOpenHold] = useState(false);
  const [open_transfer, setOpenTransfer] = useState(false);
  const [open_webcam, setOpenWebcam] = useState(false);
  const [open_preview, setOpenPreview] = useState(false);
  const [open_fingerprint, setOpenFingerprint] = useState(false);
  const [open_fingerprint_confirm, setOpenFingerprintConfirm] = useState(false);

  const [updateCustomerPhoto] = useMutation(UPDATE_CUSTOMER_PHOTO);

  const handlePhotoCapture = async (imageSrc: string) => {
    try {
      const result = await updateCustomerPhoto({
        variables: { customerId: ID, imagePath: imageSrc },
      });
      if (result.data?.UpdateCustomerPhoto?.success) {
        Notifications("រូបថតបានរក្សាទុកជោគជ័យ", "success");
        refetchMemberDetail();
      } else {
        Notifications("មានបញ្ហាក្នុងការរក្សាទុករូបថត", "error");
      }
    } catch (error) {
      Notifications("មានបញ្ហាក្នុងការរក្សាទុករូបថត", "error");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        Notifications("សូមជ្រើសរើសឯកសាររូបភាពតែប៉ុណ្ណោះ", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        Notifications("ទំហំឯកសារធំពេក! សូមជ្រើសរើសរូបភាពតូចជាង 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        await handlePhotoCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ShowTransferForm = (date: string) => {
    const currentDate = new Date();
    const end_date = new Date(date);
    if (end_date >= currentDate) {
      setOpenTransfer(true);
    } else {
      Notifications("សមាជិកផុតសុពលភាពហើយ", "info");
    }
  };

  const HandleHold = (date: string) => {
    const currentDate = new Date();
    const end_date = new Date(date);
    if (end_date >= currentDate) {
      // One live request per customer is enforced by the database
      // (uq_one_active); this is just the friendly message before the attempt.
      const active = request_data?.GetActiveHoldRequestV2?.[0];
      if (active) {
        Notifications(
          active.status === "APPROVED"
            ? "ការសុំច្បាប់បានឯកភាពរួច! សូមចូលមើលតារាងស្នើសុំ"
            : "សំណើបានដាក់រួចហើយ សូមអោយថ្នាក់លើពិនិត្យ",
          "info"
        );
        return;
      }
      setOpenHold(true);
    } else {
      Notifications("សមាជិកផុតសុពលភាពហើយ", "info");
    }
  };

  const isActive = details?.end_membership_date
    ? new Date(details.end_membership_date) >= new Date()
    : false;

  // Relative: /uploads is proxied to the backend (vite in dev, nginx in prod), so
  // this works on the LAN and behind the tunnel, where :4000 is not reachable.
  const photoSrc = details?.image_path
    ? details.image_path
    : null;

  const activeHold = request_data?.GetActiveHoldRequestV2?.[0];

  if (loading_fruit_payment && loading_member_detail && loading_trainning_payment && loading_payment)
    return <p className="text-sm text-ink-soft">{t("common.loading")}</p>;

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
      >
        <ArrowLeft aria-hidden="true" />
        ថយក្រោយ
      </Button>

      {/* ── The member's strip on the board: photo, name, magnets, then the marker tray ── */}
      <section className="rounded-xl border border-rule bg-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <button
            type="button"
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-rule bg-tray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            onClick={() => setOpenPreview(true)}
            aria-label="រូបភាព"
          >
            {photoSrc ? (
              <CachedImage
                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                src={photoSrc}
                alt={details?.customer_name || "Profile"}
              />
            ) : (
              <UserRound className="mx-auto mt-6 h-12 w-12 text-ink-soft" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate text-heading font-black leading-tight text-ink">{details?.customer_name}</h1>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-ink-soft"
                onClick={() => setOpenUpdate(true)}
                aria-label="កែលេខទូរស័ព្ទ"
              >
                <Pencil aria-hidden="true" />
              </Button>
              <MagnetChip tone={isActive ? "done" : "rejected"} size="md">
                {isActive ? "មានសុពលភាព" : "ផុតសុពលភាព"}
              </MagnetChip>
              <MagnetChip tone={details?.fingerprint ? "done" : "off"} size="md">
                {details?.fingerprint ? "មានម្រាមដៃ" : "គ្មានម្រាមដៃ"}
              </MagnetChip>
              {activeHold && (
                <MagnetChip tone={activeHold.status === "APPROVED" ? "info" : "pending"} size="md">
                  {activeHold.status === "APPROVED" ? "ច្បាប់បានឯកភាព" : "កំពុងសុំច្បាប់"}
                </MagnetChip>
              )}
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink">
              <div className="flex items-center gap-1.5">
                <dt className="flex items-center gap-1 text-ink-soft"><Hash className="h-4 w-4" aria-hidden="true" />ID</dt>
                <dd className="font-medium">{ID}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="flex items-center gap-1 text-ink-soft"><Phone className="h-4 w-4" aria-hidden="true" />ទូរស័ព្ទ</dt>
                <dd className="font-medium">{details?.phone || "—"}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="flex items-center gap-1 text-ink-soft"><CalendarDays className="h-4 w-4" aria-hidden="true" />ផុតថ្ងៃ</dt>
                <dd className="font-medium">{details?.end_membership_date || "—"}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="flex items-center gap-1 text-ink-soft"><Clock className="h-4 w-4" aria-hidden="true" />វេន</dt>
                <dd className="font-medium">{details?.shift || "—"}</dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpenWebcam(true)}
              >
                <Camera aria-hidden="true" />
                ថតរូប
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-rule bg-card px-2.5 text-sm font-medium text-ink transition-colors hover:bg-tray focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <Upload className="h-4 w-4" aria-hidden="true" />
                បញ្ចូលរូប
                <input type="file" className="sr-only" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* Marker tray: everything that can be sold to or done for this member */}
        <div className="marker-rule mx-4" />
        <div className="flex flex-wrap items-center gap-2 rounded-b-xl bg-tray px-4 py-3">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenMember(true)}>
            <RefreshCw aria-hidden="true" />
            សមាជិក
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsOpenCoupon(true)}>
            <Ticket aria-hidden="true" />
            គ៉ូប៉ុន
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenTrainning(true)}>
            <GraduationCap aria-hidden="true" />
            ហ្វឹកហាត់
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenFruit(true)}>
            <ShoppingBag aria-hidden="true" />
            ផ្សេងៗ
          </Button>
          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-rule sm:block" />
          <Button type="button" size="sm" variant="outline" onClick={() => HandleHold(details?.end_membership_date)}>
            <PauseCircle aria-hidden="true" />
            សុំច្បាប់
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => ShowTransferForm(details?.end_membership_date)}>
            <ArrowLeftRight aria-hidden="true" />
            ផ្ទេរ
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              details?.fingerprint
                ? setOpenFingerprintConfirm(true)
                : setOpenFingerprint(true)
            }
          >
            <Fingerprint aria-hidden="true" />
            {details?.fingerprint ? "ប្តូរម្រាមដៃ" : "ចុះម្រាមដៃ"}
          </Button>
        </div>
      </section>

      {/* ── The member's ledgers ── */}
      <Tabs defaultValue="member">
        <TabsList>
          {[
            { value: "member", label: "សមាជិក" },
            { value: "coupon", label: "គ៉ូប៉ុន" },
            { value: "training", label: "ហ្វឹកហាត់" },
            { value: "fruit", label: "តែជ្រក់" },
          ].map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="member">
          {!loading_payment ? (
            <MemberPayment member_payment={member_payment?.GetMemberPayment} />
          ) : (
            <p className="text-sm text-ink-soft">{t("common.loading")}</p>
          )}
        </TabsContent>

        <TabsContent value="coupon">
          <p className="py-8 text-center text-sm text-ink-soft">គ្មានទិន្នន័យ</p>
        </TabsContent>

        <TabsContent value="training">
          {!loading_trainning_payment ? (
            <TrainningPayment trainning_payment={trainning_payment} />
          ) : (
            <p className="text-sm text-ink-soft">{t("common.loading")}</p>
          )}
        </TabsContent>

        <TabsContent value="fruit">
          {!loading_fruit_payment ? (
            <FruitPaymentTable fruit_payment={fruit_payment} />
          ) : (
            <p className="text-sm text-ink-soft">{t("common.loading")}</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UpdateProfile
        open={open_update}
        setOpen={setOpenUpdate}
        customer_id={details?.customer_id}
        refetch={refetchMemberDetail}
      />

      <FruitPayment
        open={open_fruit}
        setOpen={setOpenFruit}
        details={details}
        refechFruitPayment={fruitPaymentRefetch}
        refetchMemberDetail={refetchMemberDetail}
      />

      <RenewForm
        open_member={open_member}
        setOpenMember={setOpenMember}
        details={details}
        refechMemberPayment={refechMemberPayment}
        refetchMemberDetail={refetchMemberDetail}
      />

      <CouponPayment
        open_coupon={open_coupon}
        setIsOpenCoupon={setIsOpenCoupon}
        customer_id={ID}
        user_id={parseInt(localStorage.getItem("user_id"))}
        customer_name={details?.customer_name}
        phone={details?.phone}
      />

      <TrainingPaymentForm
        open_trainning={open_trainning}
        setOpenTrainning={setOpenTrainning}
        customer_id={ID}
        user_id={parseInt(localStorage.getItem("user_id"))}
        customer_name={details?.customer_name}
        phone={details?.phone}
        refetch_trainning_payment={refetch_trainning_payment}
      />

      <HoldForm
        onSubmitted={() => refetchHoldRequest()}
        open_hold={open_hold}
        setOpenHold={setOpenHold}
        customer_id={ID}
        old_end={details?.end_membership_date}
      />

      <Transfer open={open_transfer} setOpen={setOpenTransfer} sender_data={details} />

      <Dialog open={open_fingerprint_confirm} onOpenChange={setOpenFingerprintConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ម្រាមដៃមានស្រាប់</DialogTitle>
            <DialogDescription>
              អតិថិជន <span className="font-semibold text-ink">{details?.customer_name}</span> មានស្នាមម្រាមដៃចុះឈ្មោះរួចហើយ។
              តើអ្នកចង់លុបចោល ហើយចុះម្រាមដៃថ្មីមែនទេ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenFingerprintConfirm(false)}
            >
              បោះបង់
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setOpenFingerprintConfirm(false);
                setOpenFingerprint(true);
              }}
            >
              លុប និងចុះថ្មី
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EnrollFingerprintModal
        open={open_fingerprint}
        setOpen={setOpenFingerprint}
        customerId={details?.customer_id ?? ID}
        onSaved={refetchMemberDetail}
      />

      <WebcamCapture
        open={open_webcam}
        setOpen={setOpenWebcam}
        onCapture={handlePhotoCapture}
        customerId={ID}
      />

      <Dialog open={open_preview} onOpenChange={setOpenPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{details?.customer_name}</DialogTitle>
          </DialogHeader>
          <div>
            {photoSrc ? (
              <CachedImage
                className="h-auto w-full rounded-lg border border-rule"
                src={photoSrc}
                alt={details?.customer_name || "Profile Preview"}
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg bg-tray">
                <UserRound className="h-24 w-24 text-ink-soft" aria-hidden="true" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberProfile;
