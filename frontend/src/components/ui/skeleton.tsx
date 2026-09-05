import { cn } from '../../lib/utils';

/** A placeholder block on the tray while a figure is being fetched. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-tray', className)} {...props} />;
}

export { Skeleton };
