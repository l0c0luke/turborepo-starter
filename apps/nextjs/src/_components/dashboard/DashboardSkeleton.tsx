import { Card, CardContent, CardHeader } from "~/_components/ui/card";
import { Skeleton } from "~/_components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      {/* App Download Card Skeleton */}
      <Card className="w-full rounded-lg shadow">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Welcome Card Skeleton */}
      <Card className="w-full rounded-lg shadow">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </CardContent>
      </Card>

      {/* Getting Started Card Skeleton */}
      <Card className="w-full rounded-lg shadow">
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}
