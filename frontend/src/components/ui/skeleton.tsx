import { cn } from '../../lib/utils';

/** A loading placeholder: a wash block with a shimmer sweep. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-md bg-wash', className)}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-card/60" />
    </div>
  );
}

/** Rows of skeletons shaped like a compact ledger body, so nothing reflows. */
function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('divide-y divide-rule/60', className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/6" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonRows };
