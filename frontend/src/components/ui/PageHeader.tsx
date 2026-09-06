import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { formatLongDate, todayIso } from '@/lib/money';

export interface PageHeaderProps {
  /**
   * i18n key of the page title. Rendered in both scripts, Khmer first
   * ("ការលក់សំបុត្រ · Tickets"), because the counter reads Khmer and the owner
   * reads either.
   */
  titleKey: string;
  /** Right-hand slot beside the title: the page's primary action or a filter. */
  actions?: ReactNode;
  /** A line under the title in the soft ink: counts, a date range, a scope. */
  subtitle?: ReactNode;
  /** Show the club and today's date above the title (the counter's own pages). */
  showDate?: boolean;
  className?: string;
}

/**
 * The page header every screen opens with: the club and the date, then the
 * title at 20px/600, an optional line of scope, and the page's actions on the
 * trailing edge. No rule beneath — spacing separates it from the content.
 */
export function PageHeader({
  titleKey,
  actions,
  subtitle,
  showDate = true,
  className,
}: PageHeaderProps) {
  const { t, i18n } = useTranslation();
  const km = i18n.getFixedT('km')(titleKey);
  const en = i18n.getFixedT('en')(titleKey);
  const bilingual = km !== en;

  return (
    <header className={cn('mb-4', className)}>
      {showDate && (
        <div className="flex items-baseline justify-between gap-4 text-caption text-ink-soft">
          <span className="truncate">{t('app.club')}</span>
          <time dateTime={todayIso()} className="shrink-0">
            <span className="hidden sm:inline">
              {formatLongDate(i18n.resolvedLanguage ?? i18n.language)}
            </span>
            <span className="figure sm:hidden">{todayIso()}</span>
          </time>
        </div>
      )}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight text-ink">
            {bilingual ? (
              <>
                {km} <span className="font-normal text-ink-soft">· {en}</span>
              </>
            ) : (
              km
            )}
          </h1>
          {subtitle && <div className="mt-1 text-sm text-ink-soft">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export default PageHeader;
