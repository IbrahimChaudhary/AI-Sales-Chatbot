"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange as RDPRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DateRange = "custom" | "3m" | "6m" | "1y" | "2y" | "all";

export interface CustomDateRange {
  from?: Date;
  to?: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  customRange?: CustomDateRange;
  onCustomRangeChange?: (range: CustomDateRange) => void;
}

const dateRangeOptions = [
  { value: "3m" as DateRange, label: "Last 3 Months" },
  { value: "6m" as DateRange, label: "Last 6 Months" },
  { value: "1y" as DateRange, label: "Last Year" },
  { value: "2y" as DateRange, label: "Last 2 Years" },
  { value: "all" as DateRange, label: "All Time" },
  { value: "custom" as DateRange, label: "Custom Range" },
];

function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateRangeParams(
  range: DateRange,
  customRange?: CustomDateRange,
): {
  startDate?: string;
  endDate?: string;
  months?: number;
} {
  const today = new Date();
  const endDate = toISO(today);

  switch (range) {
    case "custom": {
      if (!customRange?.from || !customRange?.to) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        return { months: 6, startDate: toISO(startDate), endDate };
      }
      const months =
        (customRange.to.getFullYear() - customRange.from.getFullYear()) * 12 +
        (customRange.to.getMonth() - customRange.from.getMonth()) +
        1;
      return {
        months: Math.max(1, months),
        startDate: toISO(customRange.from),
        endDate: toISO(customRange.to),
      };
    }
    case "3m": {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      return { months: 3, startDate: toISO(startDate), endDate };
    }
    case "6m": {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      return { months: 6, startDate: toISO(startDate), endDate };
    }
    case "1y": {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      return { months: 12, startDate: toISO(startDate), endDate };
    }
    case "2y": {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      return { months: 24, startDate: toISO(startDate), endDate };
    }
    case "all": {
      return { months: 60, startDate: "2000-01-01", endDate };
    }
    default:
      return { months: 6 };
  }
}

export function DateRangeSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false);

  // Pending range — what the user is staging in the calendar but hasn't committed
  const [pendingRange, setPendingRange] = useState<RDPRange | undefined>(
    customRange?.from && customRange?.to
      ? { from: customRange.from, to: customRange.to }
      : undefined,
  );

  // When the popover opens, sync pending with the currently committed range
  useEffect(() => {
    if (open) {
      setPendingRange(
        customRange?.from && customRange?.to
          ? { from: customRange.from, to: customRange.to }
          : undefined,
      );
    }
  }, [open, customRange]);

  function handleApply() {
    if (pendingRange?.from && pendingRange?.to && onCustomRangeChange) {
      onCustomRangeChange({ from: pendingRange.from, to: pendingRange.to });
      setOpen(false);
    }
  }

  function handleClear() {
    setPendingRange(undefined);
  }

  const canApply = !!(pendingRange?.from && pendingRange?.to);

  return (
    <div className="flex items-center gap-2">
      <CalendarIcon className="h-4 w-4 text-muted-foreground" />

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

      {value === "custom" && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !customRange?.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange?.from && customRange?.to ? (
                <>
                  {format(customRange.from, "LLL dd, y")} —{" "}
                  {format(customRange.to, "LLL dd, y")}
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={pendingRange}
              onSelect={setPendingRange}
              numberOfMonths={2}
              initialFocus
            />
            <div className="flex items-center justify-between border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!pendingRange?.from && !pendingRange?.to}
              >
                Clear
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApply} disabled={!canApply}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
