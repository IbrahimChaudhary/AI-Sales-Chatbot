-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Products table (per-user)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales transactions table (per-user)
CREATE TABLE IF NOT EXISTS sales_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  customer_segment TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document embeddings table for RAG (shared across users)
CREATE TABLE IF NOT EXISTS document_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Google Gemini embedding dimension
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_user_id ON sales_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales_transactions(category);
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales_transactions(region);
CREATE INDEX IF NOT EXISTS idx_sales_segment ON sales_transactions(customer_segment);

-- HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON document_embeddings
USING hnsw (embedding vector_cosine_ops);

-- Insert shared document embeddings (RAG context, not per-user)
INSERT INTO document_embeddings (content, metadata) VALUES
('Our company specializes in office supplies, electronics, and furniture. We serve enterprise, SMB, individual, and education customers across four major regions.',
 '{"type": "company_info", "category": "general"}'),
('Sales typically peak during Q4 (October-December) due to holiday shopping and end-of-year budgets. Q1 shows slower growth as customers recover from holiday spending.',
 '{"type": "sales_pattern", "category": "trends"}'),
('Electronics category shows highest revenue, followed by furniture and stationery.',
 '{"type": "product_performance", "category": "products"}'),
('Enterprise customers contribute 40% of revenue, SMB 30%, Individual 20%, and Education 10%. Enterprise deals are larger but less frequent.',
 '{"type": "customer_insights", "category": "segments"}'),
('North America is our largest market (45%), followed by Europe (30%), Asia Pacific (15%), and Latin America (10%).',
 '{"type": "regional_breakdown", "category": "geography"}');

-- View for quick analytics (filtered by RLS at query time, so per-user automatically)
CREATE OR REPLACE VIEW sales_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', transaction_date) AS month,
  category,
  region,
  customer_segment,
  COUNT(*) AS transaction_count,
  SUM(quantity) AS total_units_sold,
  SUM(total_amount) AS total_revenue,
  AVG(total_amount) AS avg_transaction_value
FROM sales_transactions
GROUP BY user_id, DATE_TRUNC('month', transaction_date), category, region, customer_segment
ORDER BY month DESC, total_revenue DESC;

-- Function for sales forecasting (filtered to current user)
CREATE OR REPLACE FUNCTION get_sales_trend(
  p_category TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month DATE,
  revenue DECIMAL,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', transaction_date)::DATE AS month,
    SUM(total_amount) AS revenue,
    COUNT(*) AS transaction_count
  FROM sales_transactions
  WHERE
    user_id = auth.uid()
    AND (p_category IS NULL OR category = p_category)
    AND (p_region IS NULL OR region = p_region)
    AND transaction_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', transaction_date)
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Comments for documentation
COMMENT ON TABLE sales_transactions IS 'Per-user sales transaction data for analytics';
COMMENT ON TABLE products IS 'Per-user product catalog';
COMMENT ON TABLE document_embeddings IS 'Shared vector embeddings for RAG-based chat context';
COMMENT ON VIEW sales_summary IS 'Aggregated per-user sales data by month, category, region, and segment';
COMMENT ON FUNCTION get_sales_trend IS 'Returns per-user sales trend data for forecasting';

-- NOTE: RLS policies for products and sales_transactions are added in Step 10/11.
-- Until policies are in place, those tables should remain RLS-disabled for development.