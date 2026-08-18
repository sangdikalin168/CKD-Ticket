import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Fingerprint, Loader2, XCircle } from "lucide-react";
import { gql, useMutation } from "@apollo/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import Notifications from "@/components/Notification";

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
            <Fingerprint className="h-5 w-5" /> ចុះស្នាមម្រាមដៃ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            អតិថិជន:{" "}
            <span className="font-mono font-semibold text-foreground">{customerId ?? "—"}</span>
          </div>

          <ProgressDots captured={captured} total={total} />

          {phase.kind === "starting" && (
            <Hint icon={<Loader2 className="h-4 w-4 animate-spin" />}>
              កំពុងចាប់ផ្តើម…
            </Hint>
          )}
          {phase.kind === "capturing" && (
            <Hint icon={<Fingerprint className="h-4 w-4" />}>
              ដាក់ម្រាមដៃលើម៉ាស៊ីន — លើកទី {phase.captured + 1} / {phase.total}។ លើកម្រាមដៃរវាងការស្កេន។
            </Hint>
          )}
          {phase.kind === "saving" && (
            <Hint icon={<Loader2 className="h-4 w-4 animate-spin" />}>
              កំពុងបញ្ចូល និងរក្សាទុក…
            </Hint>
          )}
          {phase.kind === "saved" && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>ស្នាមម្រាមដៃបានរក្សាទុក — អតិថិជននេះអាចចូលដោយម្រាមដៃបាន។</span>
            </div>
          )}
          {phase.kind === "error" && (
            <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{phase.message}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button className="flex-1" variant={done ? "default" : "outline"} onClick={() => setOpen(false)}>
              {done ? "បិទ" : "បោះបង់"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProgressDots({ captured, total }: { captured: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < captured;
        return (
          <div
            key={i}
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${
              filled
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                : "border-gray-300 text-gray-400"
            }`}
          >
            <Fingerprint className="h-6 w-6" />
          </div>
        );
      })}
    </div>
  );
}

function Hint({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
      {icon}
      <span>{children}</span>
    </div>
  );
}
