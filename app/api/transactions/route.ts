import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb/mongodb";
import { Transaction } from "@/lib/models/Transaction";

// ──────────────────────────────────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────────────────────────────────

// Accepts an ObjectId string, null, or undefined
const optionalObjectId = z
  .union([z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid product ID"), z.null()])
  .optional();

const TransactionCreateSchema = z.object({
  transactionDate: z.coerce.date({ message: "Invalid transaction date" }),
  productId: optionalObjectId,
  productName: z.string().trim().min(1, "Product name is required").max(200),
  category: z.string().trim().min(1, "Category is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  customerSegment: z.string().trim().min(1, "Customer segment is required"),
  region: z.string().trim().min(1, "Region is required"),
});

const TransactionUpdateSchema = TransactionCreateSchema.partial().extend({
  id: z.string().min(1, "Transaction ID is required"),
});

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

// ──────────────────────────────────────────────────────────────────────────
// GET — paginated list of transactions for current user
// ──────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = PaginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid pagination" },
        { status: 400 }
      );
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const [data, total] = await Promise.all([
      Transaction.find({ userId })
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ userId }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// POST — create transaction
// ──────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = TransactionCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { quantity, unitPrice } = parsed.data;
    const totalAmount = quantity * unitPrice;

    await connectToDatabase();

    const transaction = await Transaction.create({
      ...parsed.data,
      totalAmount,
      userId,
    });

    return NextResponse.json(transaction.toObject(), { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// PUT — update transaction (only if it belongs to current user)
// ──────────────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = TransactionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    // Recompute totalAmount if either piece of it changed
    const finalUpdates: Record<string, unknown> = { ...updates };
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      const existing = await Transaction.findOne({ _id: id, userId }).lean();
      if (!existing) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }
      const quantity = updates.quantity ?? existing.quantity;
      const unitPrice = updates.unitPrice ?? existing.unitPrice;
      finalUpdates.totalAmount = quantity * unitPrice;
    }

    await connectToDatabase();

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      finalUpdates,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// DELETE — delete transaction (only if it belongs to current user)
// ──────────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Valid transaction ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await Transaction.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}