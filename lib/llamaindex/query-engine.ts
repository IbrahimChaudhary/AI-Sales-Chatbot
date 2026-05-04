import {
  VectorStoreIndex,
  Document,
  Settings,
} from "llamaindex";
import { OpenAI } from "@llamaindex/openai";
import { getEmbeddingModel } from "./vector-store";
import {
  getSalesTransactions,
  getSalesTrend,
  getCategoryBreakdown,
} from "@/lib/database/queries";

// Configure LlamaIndex settings
Settings.llm = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "google/gemini-3.1-flash-lite-preview",
  maxTokens: 2048,
  additionalSessionOptions: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

Settings.embedModel = getEmbeddingModel();

/**
 * Creates documents from a user's sales data for indexing.
 * Each document represents a different "view" of the data; the retriever
 * picks which view(s) are relevant to the user's natural-language query.
 */
export async function createSalesDocuments(userId: string) {
  const documents: Document[] = [];

  try {
    // Sales trend (last 12 months)
    const salesTrend = await getSalesTrend(userId, undefined, undefined, 12);
    if (salesTrend && salesTrend.length > 0) {
      const trendText = `Sales Trend Data (Last 12 Months):\n${salesTrend
        .map(
          (t) =>
            `Month: ${t.month.toISOString().slice(0, 7)}, Revenue: $${t.revenue}, Transactions: ${t.transactionCount}`
        )
        .join("\n")}`;

      documents.push(
        new Document({
          text: trendText + "\n\nRAW_DATA:" + JSON.stringify(salesTrend),
          metadata: {
            type: "sales_trend",
            period: "12_months",
            record_count: salesTrend.length,
          },
        })
      );
    }

    // Category breakdown
    const categories = await getCategoryBreakdown(userId);
    if (categories && categories.length > 0) {
      const categoryText = `Sales by Category:\n${categories
        .map((c) => `${c.name}: $${c.value}`)
        .join("\n")}`;

      documents.push(
        new Document({
          text: categoryText + "\n\nRAW_DATA:" + JSON.stringify(categories),
          metadata: {
            type: "category_breakdown",
            record_count: categories.length,
          },
        })
      );
    }

    // Recent transactions
    const transactions = await getSalesTransactions(userId, 50);
    if (transactions && transactions.length > 0) {
      const transactionText = `Recent Sales Transactions (${transactions.length} records):\n${transactions
        .slice(0, 10)
        .map(
          (t) =>
            `Date: ${t.transactionDate.toISOString().slice(0, 10)}, Product: ${t.productName}, Amount: $${t.totalAmount}, Region: ${t.region}`
        )
        .join("\n")}`;

      documents.push(
        new Document({
          text: transactionText + "\n\nRAW_DATA:" + JSON.stringify(transactions.slice(0, 20)),
          metadata: {
            type: "transactions",
            record_count: transactions.length,
          },
        })
      );
    }

    console.log(`Created ${documents.length} documents for indexing`);
    return documents;
  } catch (error) {
    console.error("Error creating sales documents:", error);
    return [];
  }
}

/**
 * Query the user's sales data using LlamaIndex semantic search.
 */
export async function querySalesData(userId: string, query: string) {
  try {
    const documents = await createSalesDocuments(userId);

    if (documents.length === 0) {
      console.warn("No documents created, falling back to direct queries");
      return null;
    }

    const index = await VectorStoreIndex.fromDocuments(documents);

    const retriever = index.asRetriever({
      similarityTopK: 3,
    });

    const nodes = await retriever.retrieve(query);

    const matchedTypes = new Set<string>();
    nodes.forEach((nodeWithScore) => {
      const metadata = nodeWithScore.node.metadata;
      if (metadata.type) {
        matchedTypes.add(metadata.type as string);
      }
    });

    console.log("Matched data types:", Array.from(matchedTypes));

    // Re-fetch fresh data for the matched types (avoids JSON truncation issues
    // and matches the original behavior).
    const relevantData: Record<string, unknown> = {};
    const sources: string[] = [];

    for (const type of Array.from(matchedTypes)) {
      if (type === "sales_trend") {
        relevantData.sales_trend = await getSalesTrend(userId, undefined, undefined, 12);
        sources.push("sales_trend");
      } else if (type === "category_breakdown") {
        relevantData.category_breakdown = await getCategoryBreakdown(userId);
        sources.push("category_breakdown");
      } else if (type === "transactions") {
        relevantData.transactions = await getSalesTransactions(userId, 20);
        sources.push("transactions");
      }
    }

    return {
      relevantData,
      sources,
    };
  } catch (error) {
    console.error("Error querying sales data:", error);
    return null;
  }
}