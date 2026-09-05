import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** A lucide icon, drawn in the system's one stroke weight. */
  icon?: ComponentType<{ className?: string }>;
  /** What is not here yet. */
  title: string;
  /** One line of why, in the product's own language. */
  description?: string;
  /** The next action: where the first row comes from. */
  action?: { label: string; to: string } | ReactNode;
  className?: string;
}

/**
 * An empty panel that teaches the next action rather than saying "no data".
 * Ported from CKD-POS: a round wash plate with a drawn icon, the missing thing
 * named, one line of annotation, and the action that fills it.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  const isLink =
    !!action && typeof action === 'object' && 'to' in (action as Record<string, unknown>);

  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-wash text-ink-soft">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-caption text-ink-soft">{description}</p>}
      {isLink ? (
        <Link
          to={(action as { to: string }).to}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-rule bg-card px-3 text-sm font-medium text-ink transition-colors hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {(action as { label: string }).label}
          <ArrowRight className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
        </Link>
      ) : (
        action && <div className="mt-4">{action as ReactNode}</div>
      )}
    </div>
  );
}

export default EmptyState;
