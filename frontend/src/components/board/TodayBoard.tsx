import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { facilityOfSet, type FacilityRef } from "@/lib/facility";
import { formatMoney, formatTime } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { BoardSection } from "./BoardSection";
import { FacilityMarks } from "./FacilityMark";
import { MagnetDot } from "./MagnetChip";

/** One line on today's board: a ticket sold at this counter. */
export interface BoardLine {
  id: string;
  /** ISO timestamp of the sale. */
  at: string;
  seller: string;
  /** The ticket code printed on the slip. */
  code: string;
  facilities: FacilityRef[];
  amount: number;
  printed: boolean;
}

/** Today's tally for one price, from the server: how many sold, at what price. */
export interface TallyRow {
  price: number;
  qty: number;
  facilities: FacilityRef[];
}

export interface TodayBoardProps {
  lines: BoardLine[];
  tally: TallyRow[];
  tallyLoading?: boolean;
  /** Reprints the newest line's slip. */
  onPrintAgain?: (line: BoardLine) => void;
  className?: string;
}

/**
 * The register of today's sales, written under the tiles. The tally comes from
 * the server (every counter, all day); the lines are the ones written at this
 * counter since the page opened. A new line slides in at the top — the one
 * authored motion of the board.
 */
export function TodayBoard({ lines, tally, tallyLoading, onPrintAgain, className }: TodayBoardProps) {
  const { t } = useTranslation();
  const soldToday = tally.reduce((n, r) => n + Number(r.qty), 0);
  const totalToday = tally.reduce((n, r) => n + Number(r.qty) * Number(r.price), 0);
  const newest = lines[0];

  return (
    <BoardSection
      className={className}
      title={
        <>
          {t("board.todayBoard")}{" "}
          <span className="text-caption font-medium text-ink-soft">· {t("board.thisCounter")}</span>
        </>
      }
      aside={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-caption text-ink-soft">{t("board.allCounters")}</span>
          {tallyLoading && tally.length === 0 ? (
            <span className="text-ink-soft">{t("common.loading")}</span>
          ) : (
            <>
              {tally.map((row) => {
                const meta = facilityOfSet(row.facilities);
                return (
                  <span key={row.price} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span className={cn("font-black", meta.text)}>{formatMoney(row.price)}</span>
                    <span className="text-ink-soft">×</span>
                    <span className="font-medium text-ink">{row.qty}</span>
                  </span>
                );
              })}
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap border-l border-rule pl-4">
                <span className="text-caption text-ink-soft">{t("board.soldToday")}</span>
                <span className="font-black text-ink">{soldToday}</span>
                <span className="text-caption text-ink-soft">{t("common.total")}</span>
                <span className="font-black text-ink">{formatMoney(totalToday)}</span>
              </span>
            </>
          )}
        </div>
      }
    >
      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-rule bg-card px-4 py-6 text-center text-sm text-ink-soft">
          {t("board.noLinesYet")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[560px] text-caption">
            <thead className="bg-tray text-left text-ink-soft">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-medium">{t("board.time")}</th>
                <th scope="col" className="px-3 py-1.5 font-medium">{t("board.customer")}</th>
                <th scope="col" className="px-3 py-1.5 font-medium">{t("board.facility")}</th>
                <th scope="col" className="px-3 py-1.5 text-right font-medium">{t("common.amount")}</th>
                <th scope="col" className="px-3 py-1.5 font-medium">{t("board.printed")}</th>
                <th scope="col" className="w-px px-3 py-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/60">
              {lines.map((line, i) => (
                <tr
                  key={line.id}
                  className={cn("leading-[19px] text-ink", i === 0 && "animate-board-line-in")}
                >
                  <td className="whitespace-nowrap px-3 py-[3px]">{formatTime(line.at)}</td>
                  <td className="whitespace-nowrap px-3 py-[3px]">
                    <span className="font-medium">{t("board.walkIn")}</span>
                    <span className="ml-2 text-ink-soft">{line.code.slice(0, 8)}</span>
                    <span className="ml-2 text-ink-soft">· {line.seller}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-[3px]">
                    <FacilityMarks facilities={line.facilities} size={10} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-[3px] text-right font-medium">
                    {formatMoney(line.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-[3px]">
                    <MagnetDot tone={line.printed ? "done" : "off"} size="sm" title={line.printed ? t("board.printed") : undefined} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-[3px] text-right">
                    {onPrintAgain && line === newest && (
                      <Button
                        type="button"
                        variant="commitOutline"
                        size="sm"
                        className="h-6 px-2 text-caption"
                        onClick={() => onPrintAgain(line)}
                      >
                        <Printer aria-hidden="true" />
                        {t("board.printAgain")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BoardSection>
  );
}
