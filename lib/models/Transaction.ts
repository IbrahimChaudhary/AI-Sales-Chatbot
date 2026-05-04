import mongoose, { Schema, Model, models } from "mongoose";

export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  transactionDate: Date;
  productId: mongoose.Types.ObjectId | null;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerSegment: string;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: [true, "Transaction date is required"],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    customerSegment: {
      type: String,
      required: [true, "Customer segment is required"],
      trim: true,
    },
    region: {
      type: String,
      required: [true, "Region is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "sales_transactions",
  }
);

// Compound indexes for common query patterns
TransactionSchema.index({ userId: 1, transactionDate: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, region: 1 });
TransactionSchema.index({ userId: 1, customerSegment: 1 });

export const Transaction: Model<ITransaction> =
  models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);