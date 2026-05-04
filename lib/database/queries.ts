import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/mongodb";
import { Transaction } from "@/lib/models/Transaction";

// ──────────────────────────────────────────────────────────────────────────
// Shared filter type
// ──────────────────────────────────────────────────────────────────────────

export interface SalesFilters {
  category?: string;
  region?: string;
  customerSegment?: string;
  startDate?: string;
  endDate?: string;
}

// Builds the $match stage shared across every query.
// Every aggregation MUST start with this so userId scoping is enforced.
function buildMatchStage(userId: string, filters?: SalesFilters) {
  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (filters?.category) match.category = filters.category;
  if (filters?.region) match.region = filters.region;
  if (filters?.customerSegment) match.customerSegment = filters.customerSegment;

  if (filters?.startDate || filters?.endDate) {
    const dateFilter: Record<string, Date> = {};

    if (filters.startDate) {
      // Start of day
      dateFilter.$gte = new Date(filters.startDate);
    }

    if (filters.endDate) {
      // End of day — push to 23:59:59.999 so we capture the entire day
      const end = new Date(filters.endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    match.transactionDate = dateFilter;
  }

  return match;
}

// ──────────────────────────────────────────────────────────────────────────
// Sales transactions list
// ──────────────────────────────────────────────────────────────────────────

export async function getSalesTransactions(
  userId: string,
  limit?: number,
  filters?: SalesFilters
) {
  await connectToDatabase();

  const match = buildMatchStage(userId, filters);

  let query = Transaction.find(match).sort({ transactionDate: -1 });
  if (limit !== undefined) {
    query = query.limit(limit);
  }

  return query.lean();
}

// ──────────────────────────────────────────────────────────────────────────
// Total revenue (single number)
// ──────────────────────────────────────────────────────────────────────────

export async function getTotalRevenue(userId: string, filters?: SalesFilters) {
  await connectToDatabase();

  const match = buildMatchStage(userId, filters);

  const result = await Transaction.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  return result[0]?.total ?? 0;
}

// ──────────────────────────────────────────────────────────────────────────
// Transaction count (single number)
// ──────────────────────────────────────────────────────────────────────────

export async function getTransactionCount(
  userId: string,
  filters?: SalesFilters
) {
  await connectToDatabase();
  return Transaction.countDocuments(buildMatchStage(userId, filters));
}

// ──────────────────────────────────────────────────────────────────────────
// Category breakdown
// ──────────────────────────────────────────────────────────────────────────

export async function getCategoryBreakdown(
  userId: string,
  filters?: SalesFilters
) {
  await connectToDatabase();

  const match = buildMatchStage(userId, filters);

  const result = await Transaction.aggregate<{ name: string; value: number }>([
    { $match: match },
    {
      $group: {
        _id: "$category",
        value: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        value: 1,
      },
    },
    { $sort: { value: -1 } },
  ]);

  return result;
}

// ──────────────────────────────────────────────────────────────────────────
// Regional sales
// ──────────────────────────────────────────────────────────────────────────

export async function getRegionalSales(
  userId: string,
  filters?: SalesFilters
) {
  await connectToDatabase();

  const match = buildMatchStage(userId, filters);

  const result = await Transaction.aggregate<{ name: string; value: number }>([
    { $match: match },
    {
      $group: {
        _id: "$region",
        value: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        value: 1,
      },
    },
    { $sort: { value: -1 } },
  ]);

  return result;
}

// ──────────────────────────────────────────────────────────────────────────
// Sales trend (monthly revenue series)
// Replaces the get_sales_trend Postgres function.
// ──────────────────────────────────────────────────────────────────────────

export interface SalesTrendPoint {
  month: Date;
  revenue: number;
  transactionCount: number;
}

export async function getSalesTrend(
  userId: string,
  category?: string,
  region?: string,
  months: number = 12
) {
  await connectToDatabase();

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    transactionDate: { $gte: cutoff },
  };
  if (category) match.category = category;
  if (region) match.region = region;

  const result = await Transaction.aggregate<SalesTrendPoint>([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
        },
        revenue: { $sum: "$totalAmount" },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: 1,
          },
        },
        revenue: 1,
        transactionCount: 1,
      },
    },
    { $sort: { month: 1 } },
  ]);

  return result;
}

// ──────────────────────────────────────────────────────────────────────────
// Sales summary (replaces the sales_summary view)
// Used by the chatbot for richer breakdowns.
// ──────────────────────────────────────────────────────────────────────────

export interface SalesSummaryRow {
  month: Date;
  category: string;
  region: string;
  customerSegment: string;
  transactionCount: number;
  totalUnitsSold: number;
  totalRevenue: number;
  avgTransactionValue: number;
}

export async function getSalesSummary(userId: string, limit: number = 50) {
  await connectToDatabase();

  const result = await Transaction.aggregate<SalesSummaryRow>([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
          category: "$category",
          region: "$region",
          customerSegment: "$customerSegment",
        },
        transactionCount: { $sum: 1 },
        totalUnitsSold: { $sum: "$quantity" },
        totalRevenue: { $sum: "$totalAmount" },
        avgTransactionValue: { $avg: "$totalAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        month: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: 1,
          },
        },
        category: "$_id.category",
        region: "$_id.region",
        customerSegment: "$_id.customerSegment",
        transactionCount: 1,
        totalUnitsSold: 1,
        totalRevenue: 1,
        avgTransactionValue: 1,
      },
    },
    { $sort: { month: -1, totalRevenue: -1 } },
    { $limit: limit },
  ]);

  return result;
}