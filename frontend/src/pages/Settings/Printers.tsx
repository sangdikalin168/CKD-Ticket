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
import { FlaskConical, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { BoardHeader } from "@/components/board/BoardHeader";
import { MagnetChip } from "@/components/board/MagnetChip";

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
    <div className="mx-auto max-w-3xl space-y-4">
      <BoardHeader
        titleKey="settings.printers.title"
        subtitle={t("settings.printers.subtitle")}
        actions={
          api ? (
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
              {t("settings.printers.refresh")}
            </Button>
          ) : undefined
        }
      />

      {!api && waiting && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-rule bg-card p-6 text-sm text-ink-soft" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t("settings.printers.connecting")}
        </div>
      )}

      {!api && !waiting && (
        <div className="rounded-lg border border-dashed border-rule bg-card p-6 text-sm text-ink-soft">
          {t("settings.printers.desktopOnly")}
        </div>
      )}

      {api && list?.ok && (
        <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-card">
          {(list.printers ?? []).length === 0 && (
            <li className="p-6 text-sm text-ink-soft">{t("settings.printers.none")}</li>
          )}
          {(list.printers ?? []).map((name) => {
            const isSelected = list.configured === name;
            const isDefault = list.default === name;
            return (
              <li key={name} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-ink">{name}</span>
                    <MagnetChip tone={isSelected ? "done" : "off"}>
                      {isSelected ? t("settings.printers.selected") : isDefault ? t("settings.printers.default") : "—"}
                    </MagnetChip>
                  </div>
                  {isSelected && isDefault && (
                    <div className="text-caption text-ink-soft">{t("settings.printers.default")}</div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void testPrint(name)}>
                    <FlaskConical aria-hidden="true" />
                    {t("settings.printers.testPrint")}
                  </Button>
                  {!isSelected && (
                    <Button size="sm" disabled={busy !== null} onClick={() => void select(name)}>
                      {t("settings.printers.select")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
