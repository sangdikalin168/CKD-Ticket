export type ProgressStatus = 'pending' | 'active' | 'done' | 'error';

/** Remote work reports no percentage, so status maps to a fixed fill. */
const PERCENT_BY_STATUS: Record<ProgressStatus, number> = {
  pending: 0,
  active: 60,
  done: 100,
  error: 100,
};

interface StatusProgressBarProps {
  status: ProgressStatus;
  /** Overrides the status-derived value when a real percentage is known. */
  percent?: number;
  /** Show the numeric percentage beside the bar. */
  showLabel?: boolean;
  className?: string;
}

/** A progress bar matching the main overlay bar: solid fill, eased width, no looping animation. */
export function StatusProgressBar({
  status,
  percent,
  showLabel = false,
  className = '',
}: StatusProgressBarProps) {
  const value = Math.min(100, Math.max(0, percent ?? PERCENT_BY_STATUS[status]));
  const fill =
    status === 'done' ? 'bg-paid'
      : status === 'error' ? 'bg-void'
        : 'bg-ink';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div
          className={`relative h-full overflow-hidden rounded-full transition-all duration-500 ease-out ${fill}`}
          style={{ width: `${value}%` }}
        >
          {/* Sheen over the filled portion while work is in flight. The width
              still reflects real state — this only signals "running", and
              matches the sync modal's main bar. */}
          {status === 'active' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer motion-reduce:hidden" />
          )}
        </div>
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right figure text-caption text-ink-soft">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

export default StatusProgressBar;
