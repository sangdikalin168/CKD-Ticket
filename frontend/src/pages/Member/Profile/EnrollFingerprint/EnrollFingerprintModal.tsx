import { useEffect, useRef, useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { gql, useMutation } from "@apollo/client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import Notifications from "@/components/Notification";
import { MagnetChip, MagnetDot } from "@/components/board/MagnetChip";
import { cn } from "@/lib/utils";

/**
 * Fingerprint enrollment modal for the member profile.
 *
 * Drives the Python ZKFinger sidecar through the Electron main process via
 * `window.electronAPI` (fpBegin / fpCancel / onFpEvent). On completion the merged
 * base64 template is saved with the existing `checkinSaveFingerprint` mutation.
 * Only works inside the Electron desktop app (the bridge is absent in a browser).
 */

const SAVE_FINGERPRINT = gql`
  mutation CheckinSaveFingerprint($customerId: Float!, $template: String!) {
    checkinSaveFingerprint(customer_id: $customerId, template: $template) {
      success
      message
    }
  }
`;

const TOTAL_SAMPLES = 3;

type Phase =
  | { kind: "starting" }
  | { kind: "capturing"; captured: number; total: number }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  customerId?: number;
  onSaved?: () => void;
}

export function EnrollFingerprintModal({ open, setOpen, customerId, onSaved }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "starting" });
  const [saveFingerprint] = useMutation(SAVE_FINGERPRINT);

  // Keep the latest onSaved without re-subscribing the event listener.
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  useEffect(() => {
    if (!open) return;

    const api = (window as any).electronAPI;
    if (!api?.fpBegin || !api?.onFpEvent) {
      setPhase({
        kind: "error",
        message: "មុខងារនេះដំណើរការតែក្នុងកម្មវិធី Desktop (CKD-Ticket) ប៉ុណ្ណោះ។",
      });
      return;
    }
    if (!customerId || customerId <= 0) {
      setPhase({ kind: "error", message: "រកអតិថិជនមិនឃើញ" });
      return;
    }

    setPhase({ kind: "starting" });

    const handle = async (evt: any) => {
      if (!evt) return;
      switch (evt.type) {
        case "enroll_progress":
          if (evt.captured >= evt.total) {
            setPhase({ kind: "saving" });
          } else {
            setPhase({ kind: "capturing", captured: evt.captured, total: evt.total });
          }
          break;
        case "enroll_complete": {
          setPhase({ kind: "saving" });
          try {
            const r = await saveFingerprint({
              variables: { customerId: evt.customer_id, template: evt.template },
            });
            if (r.data?.checkinSaveFingerprint?.success) {
              setPhase({ kind: "saved" });
              Notifications("ស្នាមម្រាមដៃបានរក្សាទុក", "success");
              onSavedRef.current?.();
            } else {
              setPhase({
                kind: "error",
                message: r.data?.checkinSaveFingerprint?.message || "រក្សាទុកមិនបានជោគជ័យ",
              });
            }
          } catch (e: any) {
            setPhase({ kind: "error", message: e?.message || "រក្សាទុកមិនបានជោគជ័យ" });
          }
          break;
        }
        case "enroll_error":
          setPhase({ kind: "error", message: evt.message || "ការចុះឯកសារបរាជ័យ" });
          break;
        // enroll_cancelled is the result of our own teardown — no UI change needed.
      }
    };

    const off = api.onFpEvent(handle);
    Promise.resolve(api.fpBegin(customerId)).then((res: any) => {
      if (res && res.ok === false) {
        setPhase({ kind: "error", message: res.error || "មិនអាចចាប់ផ្តើមបានទេ" });
      }
    });

    return () => {
      off?.();
      api.fpCancel?.();
    };
  }, [open, customerId, saveFingerprint]);

  const total = phase.kind === "capturing" ? phase.total : TOTAL_SAMPLES;
  const captured =
    phase.kind === "capturing"
      ? phase.captured
      : phase.kind === "saving" || phase.kind === "saved"
        ? total
        : 0;

  const done = phase.kind === "saved" || phase.kind === "error";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" aria-hidden="true" /> ចុះស្នាមម្រាមដៃ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-ink-soft">
            អតិថិជន{" "}
            <span className="font-semibold text-ink">{customerId ?? "—"}</span>
          </p>

          <ProgressMagnets captured={captured} total={total} />

          {phase.kind === "starting" && (
            <Hint icon={<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}>
              កំពុងចាប់ផ្តើម…
            </Hint>
          )}
          {phase.kind === "capturing" && (
            <Hint icon={<Fingerprint className="h-4 w-4" aria-hidden="true" />}>
              ដាក់ម្រាមដៃលើម៉ាស៊ីន — លើកទី {phase.captured + 1} / {phase.total}។ លើកម្រាមដៃរវាងការស្កេន។
            </Hint>
          )}
          {phase.kind === "saving" && (
            <Hint icon={<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}>
              កំពុងបញ្ចូល និងរក្សាទុក…
            </Hint>
          )}
          {phase.kind === "saved" && (
            <div className="flex items-start gap-2 rounded-md border border-rule bg-card px-3 py-2 text-sm text-ink" role="status">
              <MagnetDot tone="done" size="sm" className="mt-0.5" />
              <span>ស្នាមម្រាមដៃបានរក្សាទុក — អតិថិជននេះអាចចូលដោយម្រាមដៃបាន។</span>
            </div>
          )}
          {phase.kind === "error" && (
            <div className="flex items-start gap-2 rounded-md border border-magnet-rejected/40 bg-magnet-rejected/5 px-3 py-2 text-sm text-ink" role="alert">
              <MagnetDot tone="rejected" size="sm" className="mt-0.5" />
              <span>{phase.message}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button className="w-full sm:w-auto" variant={done ? "default" : "outline"} onClick={() => setOpen(false)}>
            {done ? "បិទ" : "បោះបង់"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** One magnet per sample: grey until the reader has it, green once captured. */
function ProgressMagnets({ captured, total }: { captured: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-4" aria-label={`${captured} / ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < captured;
        return (
          <div
            key={i}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border transition-colors",
              filled ? "border-magnet-done bg-magnet-done/10 text-ink" : "border-rule text-ink-soft"
            )}
          >
            <span className="relative">
              <Fingerprint className="h-6 w-6" aria-hidden="true" />
              <MagnetDot tone={filled ? "done" : "off"} size="xs" className="absolute -right-2 -top-1" />
            </span>
          </div>
        );
      })}
      <MagnetChip tone={captured >= total ? "done" : "pending"} className="sr-only">
        {captured} / {total}
      </MagnetChip>
    </div>
  );
}

function Hint({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-rule bg-tray px-3 py-2 text-sm text-ink">
      {icon}
      <span>{children}</span>
    </div>
  );
}
