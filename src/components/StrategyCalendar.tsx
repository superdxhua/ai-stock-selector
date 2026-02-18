"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Flame, BarChart3 } from "lucide-react";

interface CalendarDay {
  date: string;
  hasRecords: boolean;
  count: number;
}

export default function StrategyCalendar({ strategy }: { strategy: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDay>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<any[]>([]);

  useEffect(() => {
    fetchCalendarData();
  }, [strategy, currentDate]);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

      const response = await fetch(
        `/api/strategy-history?strategy=${strategy}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const dateMap: Record<string, CalendarDay> = {};

        data.data.forEach((record: any) => {
          const dateStr = record.date.split("T")[0];
          if (!dateMap[dateStr]) {
            dateMap[dateStr] = { date: dateStr, hasRecords: true, count: 0 };
          }
          dateMap[dateStr].count++;
        });

        setCalendarData(dateMap);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStocksByDate = async (date: string) => {
    try {
      const response = await fetch(
        `/api/strategy-history?strategy=${strategy}&date=${date}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setSelectedStocks(data.data);
      }
    } catch (error) {
      console.error("Error fetching stocks by date:", error);
    }
  };

  const handleDateClick = (date: string) => {
    if (calendarData[date]?.hasRecords) {
      setSelectedDate(date);
      fetchStocksByDate(date);
    }
  };

  const handleMonthChange = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedStocks([]);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // 空白格子
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // 日期格子
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayData = calendarData[dateStr];
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(dateStr)}
          className={`
            p-2 rounded-lg cursor-pointer transition-all
            ${dayData?.hasRecords
              ? "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800"
              : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }
            ${isSelected ? "ring-2 ring-blue-600" : ""}
          `}
        >
          <div className="text-sm font-medium">{day}</div>
          {dayData?.hasRecords && (
            <Badge
              variant="secondary"
              className="mt-1 text-xs w-full justify-center"
            >
              {dayData.count}只
            </Badge>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            历史入选日历
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleMonthChange(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-medium min-w-[120px] text-center">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </span>
            <Button variant="outline" size="icon" onClick={() => handleMonthChange(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {isLoading ? (
            <div className="col-span-7 text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : (
            renderCalendar()
          )}
        </div>
      </Card>

      {selectedDate && selectedStocks.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            {strategy === "5day-trend" ? (
              <Flame className="w-5 h-5 text-red-600" />
            ) : (
              <BarChart3 className="w-5 h-5 text-purple-600" />
            )}
            {selectedDate} 入选股票 ({selectedStocks.length}只)
          </h4>
          <div className="space-y-2">
            {selectedStocks.map((stock) => (
              <div
                key={stock.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{stock.stock_name}</span>
                  <span className="text-sm text-muted-foreground">{stock.stock_code}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      stock.score >= 85
                        ? "destructive"
                        : stock.score >= 70
                        ? "default"
                        : "secondary"
                    }
                    className={
                      stock.score >= 85
                        ? "bg-red-100 text-red-700"
                        : stock.score >= 70
                        ? "bg-orange-100 text-orange-700"
                        : ""
                    }
                  >
                    评分: {stock.score}
                  </Badge>
                  <span className="text-sm font-mono">
                    {Number(stock.price).toFixed(2)}元
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
