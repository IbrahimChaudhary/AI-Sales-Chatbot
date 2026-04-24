"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import type { ChartData } from "@/lib/types/database";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: ChartData | null;
}

export function ChartModal({ isOpen, onClose, chartData }: ChartModalProps) {
  if (!chartData) return null;

  const { type, title, data, xKey, yKey, description } = chartData;

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: COLORS[0],
    },
    value: {
      label: "Value",
      color: COLORS[1],
    },
  };

  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xKey || "month"}
                className="text-sm"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
              />
              <YAxis className="text-sm" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey={yKey || "revenue"}
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={{ fill: COLORS[0], r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xKey || "name"}
                className="text-sm"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis className="text-sm" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey={yKey || "value"} fill={COLORS[0]} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={500}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenueModal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xKey || "month"}
                className="text-sm"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
              />
              <YAxis className="text-sm" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type="monotone"
                dataKey={yKey || "revenue"}
                stroke={COLORS[0]}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenueModal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey || "month"} className="text-sm" />
              <YAxis dataKey={yKey || "revenue"} className="text-sm" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Scatter name="Sales" data={data} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title || "Chart"}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
        </DialogHeader>
        <div className="py-6">
          <ChartContainer config={chartConfig}>{renderChart()}</ChartContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
