import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getTotalRevenue,
  getCategoryBreakdown,
  getRegionalSales,
  getSalesTrend,
  getSalesTransactions,
} from "@/lib/database/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const months = parseInt(searchParams.get("months") || "6");

    const supabase = await createClient();

    // Use the same database functions that the AI uses - these work correctly
    const filters = {
      startDate,
      endDate,
    };

    // Fetch data using the working database functions
    const [totalRevenue, categoryData, regionalData, trendData, transactionsResult] = await Promise.all([
      getTotalRevenue(filters),
      getCategoryBreakdown(filters),
      getRegionalSales(filters),
      getSalesTrend(undefined, undefined, months),
      getSalesTransactions(10, filters),
    ]);

    console.log('Dashboard API - Date Range:', { startDate, endDate, months });
    console.log('Dashboard API - Category data:', categoryData);
    console.log('Dashboard API - Total Revenue:', totalRevenue);

    // Format trend data
    const formattedTrendData = (trendData || []).map((item: any) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: parseFloat(item.total_revenue || item.revenue),
    }));

    // Get transaction count
    const { count: transactionCount } = await supabase
      .from("sales_transactions")
      .select("id", { count: "exact", head: true })
      .gte("transaction_date", startDate || "2024-01-01")
      .lte("transaction_date", endDate || new Date().toISOString().split("T")[0]);

    return NextResponse.json({
      totalRevenue,
      transactionCount: transactionCount || 0,
      avgOrderValue: transactionCount ? totalRevenue / transactionCount : 0,
      categoryCount: categoryData.length,
      trendData: formattedTrendData,
      categoryData,
      regionalData,
      transactions: transactionsResult || [],
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
