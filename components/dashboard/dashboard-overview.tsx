import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MetricCard } from "./metric-card";
import { DashboardCharts } from "./dashboard-charts";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import {
  getTotalRevenue,
  getSalesTransactions,
  getCategoryBreakdown,
  getRegionalSales,
  getSalesTrend,
  getTransactionCount,
} from "@/lib/database/queries";
import { SalesTransaction } from "@/lib/types/database";

export async function DashboardOverview() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  // Fetch all dashboard data in parallel
  const [
    totalRevenue,
    transactionCount,
    transactions,
    categoryData,
    regionalData,
    trendData,
  ] = await Promise.all([
    getTotalRevenue(userId),
    getTransactionCount(userId),
    getSalesTransactions(userId, 10),
    getCategoryBreakdown(userId),
    getRegionalSales(userId),
    getSalesTrend(userId, undefined, undefined, 6),
  ]);

  function serializeTransactions(
  transactions: Awaited<ReturnType<typeof getSalesTransactions>>
): SalesTransaction[] {
  return transactions.map((t) => ({
    _id: t._id.toString(),
    userId: t.userId.toString(),
    transactionDate: t.transactionDate.toISOString(),
    productId: t.productId ? t.productId.toString() : null,
    productName: t.productName,
    category: t.category,
    quantity: t.quantity,
    unitPrice: t.unitPrice,
    totalAmount: t.totalAmount,
    customerSegment: t.customerSegment,
    region: t.region,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

  const avgOrderValue =
    transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Format trend data for the chart — month label + per-month revenue
  const formattedTrendData = trendData.map((item) => ({
    month: item.month.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    revenue: item.revenue,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 bg-slate-700">
        <MetricCard
          title="Total Revenue"
          value={
            totalRevenue >= 1_000_000
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
          description="Total transactions"
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
        transactions={serializeTransactions(transactions)}
      />
    </div>
  );
}