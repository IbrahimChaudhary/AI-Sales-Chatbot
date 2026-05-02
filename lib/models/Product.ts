import mongoose, { Schema, Model, models } from "mongoose";

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  {
    timestamps: true,
    collection: "products",
  }
);

// Compound index — most product queries filter by userId, often plus category
ProductSchema.index({ userId: 1, category: 1 });

export const Product: Model<IProduct> =
  models.Product || mongoose.model<IProduct>("Product", ProductSchema);