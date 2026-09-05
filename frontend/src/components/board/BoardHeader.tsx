import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatBoardDate, todayIso } from "@/lib/money";

export interface BoardHeaderProps {
  /**
   * i18n key of the page's board title. Rendered in both scripts, Khmer first
   * ("ការលក់សំបុត្រ · Tickets"), because the counter reads Khmer and the owner
   * reads either.
   */
  titleKey: string;
  /** Right-hand slot beside the title: the page's primary action or a filter. */
  actions?: ReactNode;
  /** A line under the title in the soft ink: counts, a date range, a note. */
  subtitle?: ReactNode;
  className?: string;
}

/**
 * The board's top strip: the club's name in marker caps, today's date, the
 * page's board title, and a 2px marker rule beneath.
 */
export function BoardHeader({ titleKey, actions, subtitle, className }: BoardHeaderProps) {
  const { t, i18n } = useTranslation();
  const km = i18n.getFixedT("km")(titleKey);
  const en = i18n.getFixedT("en")(titleKey);
  const bilingual = km !== en;

  return (
    <header className={cn("mb-4", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="marker-caps truncate text-ink">{t("board.club")}</span>
        <time dateTime={todayIso()} className="marker-caps shrink-0 text-ink-soft">
          <span className="hidden sm:inline">{formatBoardDate(i18n.resolvedLanguage ?? i18n.language)}</span>
          <span className="sm:hidden">{todayIso()}</span>
        </time>
      </div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-heading font-black leading-tight text-ink">
            {bilingual ? (
              <>
                {km} <span className="text-ink-soft">· {en}</span>
              </>
            ) : (
              km
            )}
          </h1>
          {subtitle && <div className="mt-1 text-sm text-ink-soft">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="marker-rule mt-3" />
    </header>
  );
}
