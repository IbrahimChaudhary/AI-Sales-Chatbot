"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, SalesTransaction } from "@/lib/types/database";
import { TransactionsSkeleton } from "@/components/transactions/transactions-skeleton";


const SEGMENTS = ["Enterprise", "SMB", "Individual", "Education"];
const REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America"];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<SalesTransaction | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state — note product_id replaces product_name as the source of truth
  const [formData, setFormData] = useState({
    transaction_date: "",
    product_id: "",
    quantity: "",
    unit_price: "",
    customer_segment: "",
    region: "",
  });

  const { toast } = useToast();

  // Derive selected product from product_id (avoids storing redundant state)
  const selectedProduct = products.find(
    (p) => p._id.toString() === formData.product_id,
  );

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  // Fetch products once on mount — they're needed for the form
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions?page=${page}&limit=20`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const result = await response.json();
      setTransactions(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const result = await response.json();
      setProducts(result);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = (transaction?: SalesTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        transaction_date: transaction.transactionDate,
        product_id: transaction.productId?.toString() ?? "",
        quantity: transaction.quantity.toString(),
        unit_price: transaction.unitPrice.toString(),
        customer_segment: transaction.customerSegment,
        region: transaction.region,
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        transaction_date: new Date().toISOString().split("T")[0],
        product_id: "",
        quantity: "",
        unit_price: "",
        customer_segment: "",
        region: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  // When the product changes, auto-fill price (but only for new transactions —
  // leave existing transactions alone so users can preserve historical prices)
  const handleProductChange = (product_id: string) => {
    const product = products.find((p) => p._id.toString() === product_id);

    setFormData((prev) => ({
      ...prev,
      product_id,
      // Auto-fill price only if not already set or we're creating a new transaction
      unit_price:
        product && !editingTransaction
          ? product.price.toString()
          : prev.unit_price,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = "/api/transactions";
      const method = editingTransaction ? "PUT" : "POST";
      const body = {
        ...(editingTransaction && { id: editingTransaction._id }),
        transaction_date: formData.transaction_date,
        product_id: selectedProduct._id,
        product_name: selectedProduct.name,
        category: selectedProduct.category,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        customer_segment: formData.customer_segment,
        region: formData.region,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save transaction");

      toast({
        title: "Success",
        description: `Transaction ${editingTransaction ? "updated" : "created"} successfully`,
      });

      handleCloseDialog();
      fetchTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete transaction");

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });

      fetchTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const hasNoProducts = products.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage sales transactions</p>
        </div>
        <Button onClick={() => handleOpenDialog()} disabled={hasNoProducts}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {hasNoProducts && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            You need to add at least one product before creating a transaction.{" "}
            <Link href="/products" className="font-medium underline">
              Add a product
            </Link>
          </p>
        </Card>
      )}

      <Card>
        {loading ? (
          <TransactionsSkeleton />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {new Date(
                        transaction.transactionDate,
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.productName}
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>
                      ${transaction.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>{transaction.customerSegment}</TableCell>
                    <TableCell>{transaction.region}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Date</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transaction_date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={handleProductChange}
                  required
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem
                        key={product._id}
                        value={product._id.toString()}
                      >
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={selectedProduct?.category ?? ""}
                  disabled
                  placeholder="Auto-filled from product"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_price: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_segment">Customer Segment</Label>
                <Select
                  value={formData.customer_segment}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customer_segment: value })
                  }
                  required
                >
                  <SelectTrigger id="customer_segment">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((seg) => (
                      <SelectItem key={seg} value={seg}>
                        {seg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) =>
                    setFormData({ ...formData, region: value })
                  }
                  required
                >
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((reg) => (
                      <SelectItem key={reg} value={reg}>
                        {reg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingTransaction ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}