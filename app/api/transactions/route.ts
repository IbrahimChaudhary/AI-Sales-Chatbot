import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET all transactions with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from("sales_transactions")
      .select("*", { count: "exact" })
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
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

// POST - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transaction_date,
      product_id,
      product_name,
      category,
      quantity,
      unit_price,
      customer_segment,
      region,
    } = body;

    if (
      !transaction_date ||
      !product_name ||
      !category ||
      !quantity ||
      !unit_price ||
      !customer_segment ||
      !region
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const total_amount = quantity * unit_price;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sales_transactions")
      .insert([
        {
          transaction_date,
          product_id,
          product_name,
          category,
          quantity,
          unit_price,
          total_amount,
          customer_segment,
          region,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// PUT - Update transaction
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      transaction_date,
      product_id,
      product_name,
      category,
      quantity,
      unit_price,
      customer_segment,
      region,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const total_amount = quantity * unit_price;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sales_transactions")
      .update({
        transaction_date,
        product_id,
        product_name,
        category,
        quantity,
        unit_price,
        total_amount,
        customer_segment,
        region,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("sales_transactions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
