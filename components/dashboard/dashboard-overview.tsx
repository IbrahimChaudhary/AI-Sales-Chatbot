import { MetricCard } from "./metric-card";
import { DashboardCharts } from "./dashboard-charts";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import {
  getTotalRevenue,
  getSalesTransactions,
  getCategoryBreakdown,
  getRegionalSales,
  getSalesTrend,
} from "@/lib/database/queries";

export async function DashboardOverview() {
  // Fetch all dashboard data
  const [totalRevenue, transactions, categoryData, regionalData, trendData] =
    await Promise.all([
      getTotalRevenue(),
      getSalesTransactions(10),
      getCategoryBreakdown(),
      getRegionalSales(),
      getSalesTrend(undefined, undefined, 6),
    ]);

  const transactionCount = transactions.length;
  const avgOrderValue =
    transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Format trend data for chart
  const formattedTrendData = trendData.map((item) => ({
    month: new Date(item.month).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    revenue: parseFloat(totalRevenue),
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 bg-slate-700">
        <MetricCard
          title="Total Revenue"
          value={
            totalRevenue >= 1_00_000
              ? `$${(totalRevenue / 1_000_000).toFixed(2)}M`
              : totalRevenue >= 1_000
                ? `$${(totalRevenue / 1_000).toFixed(1)}K`
                : `$${totalRevenue.toFixed(2)}`
          }
          icon={DollarSign}
          description="All-time revenue"
        />
        <MetricCard
          title="Transactions"
          value={transactionCount.toLocaleString()}
          icon={ShoppingCart}
          description="Recent transactions"
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${avgOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Average per transaction"
        />
        <MetricCard
          title="Categories"
          value={categoryData.length}
          icon={Package}
          description="Product categories"
        />
      </div>

      {/* Charts Grid */}
      <DashboardCharts
        trendData={formattedTrendData}
        categoryData={categoryData}
        regionalData={regionalData}
        transactions={transactions}
      />
    </div>
  );
}
