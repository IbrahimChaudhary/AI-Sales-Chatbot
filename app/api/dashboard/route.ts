import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getTotalRevenue,
  getCategoryBreakdown,
  getRegionalSales,
  getSalesTrend,
  getSalesTransactions,
  getTransactionCount,
} from "@/lib/database/queries";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const months = parseInt(searchParams.get("months") || "6");

    const filters = { startDate, endDate };

    const [
      totalRevenue,
      categoryData,
      regionalData,
      trendData,
      transactionsResult,
      transactionCount,
    ] = await Promise.all([
      getTotalRevenue(userId, filters),
      getCategoryBreakdown(userId, filters),
      getRegionalSales(userId, filters),
      getSalesTrend(userId, undefined, undefined, months),
      getSalesTransactions(userId, 10, filters),
      getTransactionCount(userId, filters),
    ]);

    // Format trend data for the chart (month -> "Jan 25" string)
    const formattedTrendData = trendData.map((item) => ({
      month: item.month.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      revenue: item.revenue,
    }));

    return NextResponse.json({
      totalRevenue,
      transactionCount,
      avgOrderValue: transactionCount ? totalRevenue / transactionCount : 0,
      categoryCount: categoryData.length,
      trendData: formattedTrendData,
      categoryData,
      regionalData,
      transactions: transactionsResult,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}