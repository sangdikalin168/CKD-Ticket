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
import { FlaskConical, Printer as PrinterIcon, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/skeleton";

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

/** One printer's row: the name, what it is to this PC, and the two actions. */
function PrinterRow({
  name,
  selected,
  isDefault,
  busy,
  onSelect,
  onTest,
  selectedLabel,
  defaultLabel,
  selectLabel,
  testLabel,
}: {
  name: string;
  selected: boolean;
  isDefault: boolean;
  busy: boolean;
  onSelect: () => void;
  onTest: () => void;
  selectedLabel: string;
  defaultLabel: string;
  selectLabel: string;
  testLabel: string;
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-wash/60">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{name}</span>
          {selected && <Chip tone="paid">{selectedLabel}</Chip>}
        </div>
        {isDefault && <p className="mt-0.5 text-caption text-ink-soft">{defaultLabel}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={onTest}>
          <FlaskConical aria-hidden="true" />
          {testLabel}
        </Button>
        {!selected && (
          <Button size="sm" disabled={busy} onClick={onSelect}>
            {selectLabel}
          </Button>
        )}
      </div>
    </li>
  );
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

  const printers = list?.printers ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
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

      {/* Still waiting for the desktop host to inject its bridge: say so, and
          hold the shape of the list rather than spinning over an empty box. */}
      {!api && waiting && (
        <div className="overflow-hidden rounded-lg border border-rule bg-card" role="status" aria-live="polite">
          <p className="border-b border-rule bg-wash px-4 py-2 text-caption text-ink-soft">
            {t("settings.printers.connecting")}
          </p>
          <SkeletonRows rows={3} className="p-2" />
        </div>
      )}

      {!api && !waiting && (
        <div className="rounded-lg border border-rule bg-card px-4 py-6 text-sm text-ink-soft">
          {t("settings.printers.desktopOnly")}
        </div>
      )}

      {api && loading && (
        <div className="overflow-hidden rounded-lg border border-rule bg-card" role="status" aria-live="polite">
          <SkeletonRows rows={4} className="p-2" />
        </div>
      )}

      {api && !loading && list && !list.ok && (
        <div className="rounded-lg border border-rule bg-card">
          <EmptyState
            icon={PrinterIcon}
            title={t("settings.printers.loadError")}
            description={list.error ?? undefined}
            action={
              <Button variant="outline" size="sm" onClick={() => void load()}>
                {t("settings.printers.refresh")}
              </Button>
            }
          />
        </div>
      )}

      {api && !loading && list?.ok && (
        <div className="overflow-hidden rounded-lg border border-rule bg-card">
          {printers.length === 0 ? (
            <EmptyState
              icon={PrinterIcon}
              title={t("settings.printers.none")}
              action={
                <Button variant="outline" size="sm" onClick={() => void load()}>
                  {t("settings.printers.refresh")}
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-rule">
              {printers.map((name) => (
                <PrinterRow
                  key={name}
                  name={name}
                  selected={list.configured === name}
                  isDefault={list.default === name}
                  busy={busy !== null}
                  onSelect={() => void select(name)}
                  onTest={() => void testPrint(name)}
                  selectedLabel={t("settings.printers.selected")}
                  defaultLabel={t("settings.printers.default")}
                  selectLabel={t("settings.printers.select")}
                  testLabel={t("settings.printers.testPrint")}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
