"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame, TrendingUp, Clock, Activity } from "lucide-react";

interface ConsecutiveStock {
  stockCode: string;
  stockName: string;
  strategy: string;
  score: number;
  currentStreakDays: number;
  maxConsecutiveDays: number;
  latestDate: string;
}

export default function ConsecutiveStocks({ strategy }: { strategy: string }) {
  const [stocks, setStocks] = useState<ConsecutiveStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConsecutiveStocks();
  }, [strategy]);

  const fetchConsecutiveStocks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/strategy-consecutive?strategy=${strategy}`);
      const data = await response.json();

      if (data.success && data.data) {
        setStocks(data.data);
      }
    } catch (error) {
      console.error("Error fetching consecutive stocks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakColor = (days: number): string => {
    if (days >= 5) return "bg-red-100 text-red-700";
    if (days >= 3) return "bg-orange-100 text-orange-700";
    if (days >= 2) return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600" />
        连续上榜追踪
      </h3>

      {stocks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无连续上榜数据
        </div>
      ) : (
        <div className="space-y-3">
          {stocks
            .filter((s) => s.currentStreakDays >= 2)
            .map((stock) => (
              <div
                key={stock.stockCode}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {strategy === "5day-trend" ? (
                      <Flame className="w-5 h-5 text-red-600" />
                    ) : strategy === "cyc" ? (
                      <Activity className="w-5 h-5 text-purple-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    )}
                    <div>
                      <div className="font-medium">{stock.stockName}</div>
                      <div className="text-sm text-muted-foreground">{stock.stockCode}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getStreakColor(stock.currentStreakDays)}>
                    连续 {stock.currentStreakDays} 天
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-mono">
                      评分: {stock.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      最高: {stock.maxConsecutiveDays}天
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
