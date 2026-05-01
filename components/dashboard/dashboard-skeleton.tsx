import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">

      {/* Metric Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <DashboardChartsSkeleton />
    </div>
  );
}

{/* DASHBOARD SKELETON */}
export function DashboardChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Sales Trend skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="h-[300px] flex items-end gap-2 px-2 pb-6">
          {/* Mimic line chart with rising bars of varying heights */}
          <Skeleton className="flex-1 h-[20%]" />
          <Skeleton className="flex-1 h-[40%]" />
          <Skeleton className="flex-1 h-[55%]" />
          <Skeleton className="flex-1 h-[70%]" />
          <Skeleton className="flex-1 h-[60%]" />
          <Skeleton className="flex-1 h-[85%]" />
        </div>
      </Card>

      {/* Sales by Category skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="h-[300px] flex items-end gap-3 px-2 pb-6">
          {/* Mimic bar chart with varying-height bars */}
          <Skeleton className="flex-1 h-[80%]" />
          <Skeleton className="flex-1 h-[60%]" />
          <Skeleton className="flex-1 h-[45%]" />
          <Skeleton className="flex-1 h-[30%]" />
        </div>
      </Card>

      {/* Regional Pie Chart skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="h-[300px] flex items-center justify-center">
          {/* Circular skeleton mimicking the pie */}
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </Card>

      {/* Recent Transactions skeleton */}
      <Card className="p-6">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center border-b pb-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2 items-end flex flex-col">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}