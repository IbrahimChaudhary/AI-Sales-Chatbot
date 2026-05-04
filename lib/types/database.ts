// Frontend-facing types for API responses.
// Mirror the Mongoose schemas but with string IDs (since JSON has no ObjectId).

export interface Product {
  _id: string;
  userId: string;
  name: string;
  category: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesTransaction {
  _id: string;
  userId: string;
  transactionDate: string;
  productId: string | null;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerSegment: string;
  region: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesTrend {
  month: string;        // ISO date string when serialized over JSON
  revenue: number;
  transactionCount: number;
}

export interface SalesSummary {
  month: string;
  category: string;
  region: string;
  customerSegment: string;
  transactionCount: number;
  totalUnitsSold: number;
  totalRevenue: number;
  avgTransactionValue: number;
}

// Document embeddings — kept for the chatbot/RAG (Phase 4).
// Will be migrated to Atlas Vector Search later.
export interface DocumentEmbedding {
  _id: string;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Chart types — unchanged from before, used by the chatbot's chart-rendering UI.
export type ChartType = "line" | "bar" | "area" | "pie" | "scatter";

export interface ChartData {
  type: ChartType;
  title: string;
  data: unknown[];
  xKey?: string;
  yKey?: string;
  description?: string;
}