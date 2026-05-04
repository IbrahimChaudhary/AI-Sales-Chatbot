import { connectToDatabase } from "@/lib/mongodb/mongodb";
import { Product } from "@/lib/models/Product";
import { Transaction } from "@/lib/models/Transaction";

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

function randomDateInLastMonths(months: number): Date {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - months);
  const randomTimestamp =
    past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTimestamp);
}

function pickRandomSubset<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Seed sample data for a freshly-created user.
 * Caller must pass a verified user id — this function does NOT check auth.
 *
 * Idempotency note: if called twice for the same user, you'll get duplicate
 * data. The signup flow should guarantee single-call semantics.
 */
export async function seedSampleDataForUser(userId: string) {
  await connectToDatabase();

  // Step 1: Pick a random subset of products for this user
  const productCount = randomInt(5, 10);
  const selectedProducts = pickRandomSubset(PRODUCT_CATALOG, productCount);

  const productDocs = selectedProducts.map((p) => ({
    ...p,
    userId,
  }));

  const insertedProducts = await Product.insertMany(productDocs, {
    ordered: true,
  });

  if (insertedProducts.length === 0) {
    throw new Error("No products were inserted");
  }

  // Step 2: Generate a random number of transactions referencing this user's products
  const transactionCount = randomInt(200, 1000);
  const monthsBack = randomInt(20, 24);

  const transactionDocs = Array.from({ length: transactionCount }, () => {
    const product = pickRandom(insertedProducts);
    const quantity = randomInt(1, 10);
    const unitPrice = product.price;

    return {
      userId,
      transactionDate: randomDateInLastMonths(monthsBack),
      productId: product._id,
      productName: product.name,
      category: product.category,
      quantity,
      unitPrice,
      totalAmount: Number((quantity * unitPrice).toFixed(2)),
      customerSegment: pickRandom(CUSTOMER_SEGMENTS),
      region: pickRandom(REGIONS),
    };
  });

  // Insert in chunks to stay under MongoDB's BSON document size limits
  // and to avoid blocking the event loop on a single huge insert
  const CHUNK_SIZE = 200;
  for (let i = 0; i < transactionDocs.length; i += CHUNK_SIZE) {
    const chunk = transactionDocs.slice(i, i + CHUNK_SIZE);
    await Transaction.insertMany(chunk, { ordered: true });
  }

  return {
    productsCount: insertedProducts.length,
    transactionsCount: transactionDocs.length,
    monthsBack,
  };
}