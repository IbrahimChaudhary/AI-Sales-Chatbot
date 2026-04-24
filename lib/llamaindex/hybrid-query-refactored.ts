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
 * Execute filtered query using AI-extracted parameters
 * This is called when the AI invokes the get_sales_data tool
 */
export async function executeFilteredQuery(toolArgs: any): Promise<HybridQueryResult> {
  const relevantData: any = {};
  const sources: string[] = [];

  console.log("Executing filtered query with AI-extracted params:", toolArgs);

  let {
    category,
    region,
    customer_segment,
    startDate,
    endDate,
    months = 12,
    dataType
  } = toolArgs;

  // CRITICAL FIX: Convert months to startDate/endDate if not provided
  if (!startDate && !endDate && months) {
    const today = new Date();
    endDate = today.toISOString().split("T")[0];
    const calculatedStartDate = new Date();
    calculatedStartDate.setMonth(calculatedStartDate.getMonth() - months);
    startDate = calculatedStartDate.toISOString().split("T")[0];
    console.log(`Converted months (${months}) to date range: ${startDate} to ${endDate}`);
  }

  try {
    // Fetch based on dataType or intelligently determine what to fetch
    if (dataType === "trend" || !dataType) {
      relevantData.sales_trend = await getSalesTrend(category, region, months);
      sources.push("sales_trend");
    }

    if (dataType === "category_breakdown" || !dataType) {
      relevantData.category_breakdown = await getCategoryBreakdown({
        startDate,
        endDate,
      });
      sources.push("category_breakdown");
    }

    if (dataType === "regional_sales") {
      relevantData.regional_sales = await getRegionalSales({
        startDate,
        endDate,
      });
      sources.push("regional_sales");
    }

    if (dataType === "total_revenue") {
      relevantData.total_revenue = await getTotalRevenue({
        category,
        region,
        startDate,
        endDate,
      });
      sources.push("total_revenue");
    }

    if (dataType === "transactions") {
      relevantData.transactions = await getSalesTransactions(50, {
        category,
        region,
        customer_segment,
        startDate,
        endDate,
      });
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

/**
 * Execute semantic search using LlamaIndex
 * This is used for general queries without specific filters
 */
export async function executeSemanticQuery(userQuery: string): Promise<HybridQueryResult> {
  console.log("Executing semantic query with LlamaIndex");

  const llamaResult = await querySalesData(userQuery);

  if (!llamaResult) {
    throw new Error("Semantic query returned no results");
  }

  return {
    relevantData: llamaResult.relevantData,
    sources: llamaResult.sources,
    queryType: "semantic",
  };
}
