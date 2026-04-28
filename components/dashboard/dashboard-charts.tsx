"use client";

import { Card } from "@/components/ui/card";
import { SalesTransaction } from "@/lib/types/database";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface SalesTrendData {
  month: string;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface RegionalData {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  trendData: SalesTrendData[];
  categoryData: CategoryData[];
  regionalData: RegionalData[];
  transactions: SalesTransaction[];
}

export function DashboardCharts({
  trendData,
  categoryData,
  regionalData,
  transactions,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Sales Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Sales Trend (Last {trendData.length - 1} Months)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={trendData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              strokeWidth={2}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Breakdown Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={categoryData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
            <Bar dataKey="value" fill="#8884d8" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Regional Sales Pie Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={regionalData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {regionalData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Transactions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {transactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="font-medium text-sm">
                  {transaction.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.region} • {transaction.category}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ${Number(transaction.total_amount).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
