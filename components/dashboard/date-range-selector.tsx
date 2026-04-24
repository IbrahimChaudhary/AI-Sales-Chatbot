"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRange = "3m" | "6m" | "1y" | "2y" | "all";

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

const dateRangeOptions = [
  { value: "3m" as DateRange, label: "Last 3 Months" },
  { value: "6m" as DateRange, label: "Last 6 Months" },
  { value: "1y" as DateRange, label: "Last Year" },
  { value: "2y" as DateRange, label: "Last 2 Years" },
  { value: "all" as DateRange, label: "All Time" },
];

export function getDateRangeParams(range: DateRange): { startDate?: string; endDate?: string; months?: number } {
  const today = new Date();
  const endDate = today.toISOString().split("T")[0];

  switch (range) {
    case "3m": {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      return {
        months: 3,
        startDate: startDate.toISOString().split("T")[0],
        endDate,
      };
    }
    case "6m": {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      return {
        months: 6,
        startDate: startDate.toISOString().split("T")[0],
        endDate,
      };
    }
    case "1y": {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      return {
        months: 12,
        startDate: startDate.toISOString().split("T")[0],
        endDate,
      };
    }
    case "2y": {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      return {
        months: 24,
        startDate: startDate.toISOString().split("T")[0],
        endDate,
      };
    }
    case "all":
      return {
        months: 36,
        startDate: "2024-01-01",
        endDate,
      };
    default:
      return { months: 6 };
  }
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
