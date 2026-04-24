import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed sales analytics and insights
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
