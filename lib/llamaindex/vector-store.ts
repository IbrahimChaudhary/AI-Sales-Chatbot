import { OpenAIEmbedding } from "@llamaindex/openai";

// Embedding model — uses OpenRouter as an OpenAI-compatible endpoint.
// This is used by query-engine.ts to embed documents for in-memory similarity search.
export function getEmbeddingModel() {
  return new OpenAIEmbedding({
    apiKey: process.env.GOOGLE_API_KEY, // OpenRouter key
    model: "text-embedding-3-small",
    baseURL: "https://openrouter.ai/api/v1",
  });
}