import { Skeleton } from "~/_components/ui/skeleton";

/**
 * Root loading UI — shown instantly on every navigation until the route
 * renders, so no click ever leaves the user staring at a frozen page. Routes
 * that fetch data add their own `loading.tsx` shaped like their content (see
 * `app/admin/loading.tsx`); `pnpm check:conventions` enforces that.
 */
export default function Loading() {
  return (
    <div className="container mx-auto flex flex-col gap-6 py-8" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
