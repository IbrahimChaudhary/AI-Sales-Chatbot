import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your sales performance and insights
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
