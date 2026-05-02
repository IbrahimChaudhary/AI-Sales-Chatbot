import { querySalesData } from "./query-engine";
import { describeToolFilters } from "@/lib/ai/tools-definition";
import {
  getSalesTransactions,
  getSalesTrend,
  getCategoryBreakdown,
  getRegionalSales,
  getTotalRevenue,
} from "@/lib/database/queries";

export interface HybridQueryResult {
  relevantData: any;
  sources: string[];
  filterDescription?: string;
  queryType: "semantic" | "filtered";
}

/**
 * Execute filtered query using AI-extracted parameters.
 * Called when the AI invokes the get_sales_data tool.
 */
export async function executeFilteredQuery(
  userId: string,
  toolArgs: any,
): Promise<HybridQueryResult> {
  const relevantData: any = {};
  const sources: string[] = [];

  console.log("Executing filtered query with AI-extracted params:", toolArgs);

  let {
    category,
    region,
    customer_segment,
    startDate,
    endDate,
    months,
    dataType,
  } = toolArgs;

  // Convert "months" to startDate/endDate if a date range isn't provided
  if (!startDate && !endDate && months) {
    const today = new Date();
    const calculatedStartDate = new Date();
    calculatedStartDate.setMonth(calculatedStartDate.getMonth() - months);
    endDate = toLocalISO(today);
    startDate = toLocalISO(calculatedStartDate);

    console.log(
      `Converted months (${months}) to date range: ${startDate} to ${endDate}`,
    );
  }

  // Map the AI's snake_case tool argument to the camelCase filter field
  const filters = {
    category,
    region,
    customerSegment: customer_segment,
    startDate,
    endDate,
  };

  try {
    if (dataType === "trend" || !dataType) {
      relevantData.sales_trend = await getSalesTrend(userId, category, region, months);
      sources.push("sales_trend");
    }

    if (dataType === "category_breakdown" || !dataType) {
      relevantData.category_breakdown = await getCategoryBreakdown(userId, {
        startDate,
        endDate,
      });
      sources.push("category_breakdown");
    }

    if (dataType === "regional_sales") {
      relevantData.regional_sales = await getRegionalSales(userId, {
        startDate,
        endDate,
      });
      sources.push("regional_sales");
    }

    if (dataType === "total_revenue") {
      relevantData.total_revenue = await getTotalRevenue(userId, {
        category,
        region,
        startDate,
        endDate,
      });
      console.log("Total revenue:", relevantData.total_revenue);
      sources.push("total_revenue");
    }

    if (dataType === "transactions") {
      relevantData.transactions = await getSalesTransactions(userId, undefined, filters);
      console.log("Transactions count:", relevantData.transactions.length);
      sources.push("transactions");
    }

    return {
      relevantData,
      sources,
      filterDescription: describeToolFilters(toolArgs),
      queryType: "filtered",
    };
  } catch (error) {
    console.error("Error executing filtered query:", error);
    throw error;
  }
}

// Local timezone-safe ISO date formatter (no UTC shift)
function toLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Execute semantic search using LlamaIndex.
 * Used for general queries without specific filters.
 */
export async function executeSemanticQuery(
  userId: string,
  userQuery: string,
): Promise<HybridQueryResult> {
  console.log("Executing semantic query with LlamaIndex");

  const llamaResult = await querySalesData(userId, userQuery);
  console.log("LLama Result:", llamaResult);
  if (!llamaResult) {
    throw new Error("Semantic query returned no results");
  }

  return {
    relevantData: llamaResult.relevantData,
    sources: llamaResult.sources,
    queryType: "semantic",
  };
}