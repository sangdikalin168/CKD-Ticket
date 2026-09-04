/**
 * Printer — choose which Windows printer this counter's CKD Ticket desktop app
 * prints receipts to, and fire a test slip. Mirrors CKD-POS's Settings →
 * Printers, but the printer lives on the till PC rather than the server, so
 * everything goes through the desktop host's bridge (window.electronAPI) and
 * the choice is saved in config.json next to the exe.
 *
 * In a plain browser there is no bridge; the page just says so.
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, FlaskConical, Printer, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface PrinterList {
  ok: boolean;
  error?: string;
  printers?: string[];
  default?: string | null;
  configured?: string | null;
}

interface Bridge {
  listPrinters: () => Promise<PrinterList>;
  setPrintSettings: (printer: string | null) => Promise<{ ok: boolean; error?: string }>;
  printTest: (printer: string) => Promise<{ ok: boolean; error?: string; route?: string }>;
}

function bridge(): Bridge | null {
  const w = window as unknown as { electronAPI?: Partial<Bridge> };
  const api = w.electronAPI;
  return api && api.listPrinters && api.setPrintSettings && api.printTest ? (api as Bridge) : null;
}

/**
 * The desktop host injects window.electronAPI once the document has loaded,
 * which is a beat after React's first paint when the app is launched straight
 * onto this page. Poll briefly before concluding there is no bridge at all.
 */
function useBridge(timeoutMs = 6000): { api: Bridge | null; waiting: boolean } {
  const [api, setApi] = useState<Bridge | null>(() => bridge());
  const [waiting, setWaiting] = useState<boolean>(() => bridge() === null);

  useEffect(() => {
    if (api) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const found = bridge();
      if (found) {
        setApi(found);
        setWaiting(false);
        window.clearInterval(timer);
      } else if (Date.now() - started >= timeoutMs) {
        setWaiting(false);
        window.clearInterval(timer);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [api, timeoutMs]);

  return { api, waiting };
}

export default function Printers() {
  const { t } = useTranslation();
  const [list, setList] = useState<PrinterList | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const { api, waiting } = useBridge();

  const load = useCallback(async () => {
    if (!api) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.listPrinters();
      setList(res);
      if (!res.ok) showErrorToast(res.error ?? t("settings.printers.loadError"));
    } catch (e) {
      showErrorToast(String(e));
      setList(null);
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const select = async (name: string) => {
    if (!api) return;
    setBusy(name);
    try {
      const res = await api.setPrintSettings(name);
      if (res.ok) {
        showSuccessToast(t("settings.printers.selectedToast", { name }));
        await load();
      } else {
        showErrorToast(res.error ?? t("settings.printers.selectError"));
      }
    } finally {
      setBusy(null);
    }
  };

  const testPrint = async (name: string) => {
    if (!api) return;
    setBusy(name);
    try {
      const res = await api.printTest(name);
      if (res.ok) showSuccessToast(t("settings.printers.testSent", { name }));
      else showErrorToast(res.error ?? t("settings.printers.testError"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Printer className="h-6 w-6" />
            {t("settings.printers.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.printers.subtitle")}</p>
        </div>
        {api && (
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("settings.printers.refresh")}
          </Button>
        )}
      </div>

      {!api && waiting && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {t("settings.printers.connecting")}
        </div>
      )}

      {!api && !waiting && (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {t("settings.printers.desktopOnly")}
        </div>
      )}

      {api && list?.ok && (
        <div className="overflow-hidden rounded-lg border">
          {(list.printers ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">{t("settings.printers.none")}</p>
          )}
          {(list.printers ?? []).map((name) => {
            const isSelected = list.configured === name;
            const isDefault = list.default === name;
            return (
              <div key={name} className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="truncate">{name}</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("settings.printers.selected")}
                      </span>
                    )}
                  </div>
                  {isDefault && (
                    <div className="text-xs text-muted-foreground">{t("settings.printers.default")}</div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void testPrint(name)}>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    {t("settings.printers.testPrint")}
                  </Button>
                  {!isSelected && (
                    <Button size="sm" disabled={busy !== null} onClick={() => void select(name)}>
                      {t("settings.printers.select")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
