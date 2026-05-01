"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "./metric-card";
import { DashboardCharts } from "./dashboard-charts";
import {
  DateRangeSelector,
  DateRange,
  CustomDateRange,
  getDateRangeParams,
} from "./date-range-selector";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import Loader from "../Loader";
import { DashboardSkeleton } from "./dashboard-skeleton";

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
  const [customRange, setCustomRange] = useState<CustomDateRange>({});
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't fetch when "custom" is selected but the user hasn't picked dates yet —
    // wait until they finish selecting both start and end.
    if (dateRange === "custom" && (!customRange.from || !customRange.to)) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [dateRange, customRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = getDateRangeParams(dateRange, customRange);
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

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* Helpful prompt when in custom mode but dates not yet picked */}
      {dateRange === "custom" && (!customRange.from || !customRange.to) && (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          Pick a start and end date to see your data.
        </div>
      )}
      {loading && <DashboardSkeleton/>}
      {/* Only render dashboard contents when we have data */}
      {data &&
        !loading &&
        !(dateRange === "custom" && (!customRange.from || !customRange.to)) && (
          <>
            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={
                  data.totalRevenue >= 1_000_000
                    ? `$${(data.totalRevenue / 1_000_000).toFixed(2)}M`
                    : data.totalRevenue >= 1_000
                      ? `$${(data.totalRevenue / 1_000).toFixed(1)}K`
                      : `$${data.totalRevenue.toFixed(2)}`
                }
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
                value={`$${data.avgOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
          </>
        )}
    </div>
  );
}


