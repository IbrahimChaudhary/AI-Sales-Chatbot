"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "./metric-card";
import { DashboardCharts } from "./dashboard-charts";
import { DateRangeSelector, DateRange, getDateRangeParams } from "./date-range-selector";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { Loader2 } from "lucide-react";

interface DashboardData {
  totalRevenue: number;
  transactionCount: number;
  avgOrderValue: number;
  categoryCount: number;
  trendData: Array<{ month: string; revenue: number }>;
  categoryData: Array<{ name: string; value: number }>;
  regionalData: Array<{ name: string; value: number }>;
  transactions: Array<any>;
}

export function DashboardClient() {
  const [dateRange, setDateRange] = useState<DateRange>("6m");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = getDateRangeParams(dateRange);
      const queryParams = new URLSearchParams();

      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      if (params.months) queryParams.append("months", params.months.toString());

      const response = await fetch(`/api/dashboard?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Selected period"
        />
        <MetricCard
          title="Transactions"
          value={data.transactionCount.toLocaleString()}
          icon={ShoppingCart}
          description="Total transactions"
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${data.avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Average per transaction"
        />
        <MetricCard
          title="Categories"
          value={data.categoryCount}
          icon={Package}
          description="Product categories"
        />
      </div>

      {/* Charts Grid */}
      <DashboardCharts
        trendData={data.trendData}
        categoryData={data.categoryData}
        regionalData={data.regionalData}
        transactions={data.transactions}
      />
    </div>
  );
}
