import { createClient } from "@/lib/supabase/server";

const PRODUCT_CATALOG = [
  { name: "Wireless Headphones", category: "Electronics", price: 129.99 },
  { name: "Mechanical Keyboard", category: "Electronics", price: 89.99 },
  { name: "USB-C Hub", category: "Electronics", price: 49.99 },
  { name: "Wireless Mouse", category: "Electronics", price: 39.99 },
  { name: "27-inch Monitor", category: "Electronics", price: 329.99 },
  { name: "Webcam HD", category: "Electronics", price: 79.99 },
  { name: "Standing Desk", category: "Furniture", price: 499.99 },
  { name: "Ergonomic Chair", category: "Furniture", price: 349.99 },
  { name: "Desk Lamp", category: "Furniture", price: 59.99 },
  { name: "Bookshelf", category: "Furniture", price: 189.99 },
  { name: "Filing Cabinet", category: "Furniture", price: 159.99 },
  { name: "Notebook Set", category: "Stationery", price: 14.99 },
  { name: "Premium Pen", category: "Stationery", price: 24.99 },
  { name: "Sticky Notes Bundle", category: "Stationery", price: 9.99 },
  { name: "Whiteboard", category: "Stationery", price: 69.99 },
];

const CUSTOMER_SEGMENTS = ["Enterprise", "SMB", "Individual", "Education"];
const REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America"];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInLastMonths(months: number): string {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - months);
  const randomTimestamp =
    past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTimestamp).toISOString().split("T")[0];
}

// Pick N random items from an array (no duplicates)
function pickRandomSubset<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function seedSampleDataForCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Step 1: Pick a random subset of products for this user
  // Each user gets between 5 and 10 products from the catalog of 15
  const productCount = randomInt(5, 10);
  const selectedProducts = pickRandomSubset(PRODUCT_CATALOG, productCount);

  const productsToInsert = selectedProducts.map((p) => ({
    ...p,
    user_id: user.id,
  }));

  const { data: insertedProducts, error: productsError } = await supabase
    .from("products")
    .insert(productsToInsert)
    .select();

  if (productsError) {
    throw new Error(`Failed to seed products: ${productsError.message}`);
  }

  if (!insertedProducts || insertedProducts.length === 0) {
    throw new Error("No products were inserted");
  }

  // Step 2: Generate a random number of transactions (200–1000) over a random
  // time window (6–18 months), referencing only this user's products
  const transactionCount = randomInt(200, 1000);
  const monthsBack = randomInt(6, 18);

  const transactionsToInsert = Array.from({ length: transactionCount }, () => {
    const product = pickRandom(insertedProducts);
    const quantity = randomInt(1, 10);
    const unit_price = Number(product.price);

    return {
      user_id: user.id,
      transaction_date: randomDateInLastMonths(monthsBack),
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      quantity,
      unit_price,
      total_amount: Number((quantity * unit_price).toFixed(2)),
      customer_segment: pickRandom(CUSTOMER_SEGMENTS),
      region: pickRandom(REGIONS),
    };
  });

  // Insert in chunks of 100 to stay well under request size limits
  const CHUNK_SIZE = 100;
  for (let i = 0; i < transactionsToInsert.length; i += CHUNK_SIZE) {
    const chunk = transactionsToInsert.slice(i, i + CHUNK_SIZE);
    const { error: transactionsError } = await supabase
      .from("sales_transactions")
      .insert(chunk);

    if (transactionsError) {
      throw new Error(
        `Failed to seed transactions: ${transactionsError.message}`,
      );
    }
  }

  return {
    productsCount: insertedProducts.length,
    transactionsCount: transactionsToInsert.length,
    monthsBack,
  };
}
