"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2, Flame, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  trendScore?: number;
  volumeScore?: number;
}

const strategies = [
  { id: "all", name: "全部股票", description: "查看所有股票" },
  { id: "5day-trend", name: "5日趋势核心", description: "短期强势上涨股（评分≥50）" },
  { id: "5day-volume", name: "5日容量核心", description: "成交量活跃股（评分≥50）" },
];

export default function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const fetchStocks = async (strategy: string) => {
    setIsLoading(true);
    try {
      const url = strategy === "all"
        ? "/api/stocks"
        : `/api/stocks?strategy=${strategy}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setStocks(data.data);
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks(selectedStrategy);
  }, [selectedStrategy]);

  const formatNumber = (num: number): string => {
    if (num >= 100000000000) {
      return `${(num / 100000000000).toFixed(2)}万亿`;
    }
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(2)}亿`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(2)}万`;
    }
    return num.toLocaleString();
  };

  const getScoreColor = (score: number | undefined): string => {
    if (!score) return "bg-gray-100 text-gray-700";
    if (score >= 85) return "bg-red-100 text-red-700";
    if (score >= 70) return "bg-orange-100 text-orange-700";
    if (score >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const currentStrategy = strategies.find((s) => s.id === selectedStrategy);
  const showScore = selectedStrategy === "5day-trend" || selectedStrategy === "5day-volume";

  return (
    <div className="flex flex-col gap-4">
      {/* 策略选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {strategies.map((strategy) => (
          <Card
            key={strategy.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedStrategy === strategy.id
                ? "ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950/30"
                : ""
            }`}
            onClick={() => setSelectedStrategy(strategy.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              {strategy.id === "5day-trend" && <TrendingUp className="w-4 h-4 text-blue-600" />}
              {strategy.id === "5day-volume" && <BarChart3 className="w-4 h-4 text-purple-600" />}
              <h3 className="font-semibold text-sm">{strategy.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{strategy.description}</p>
          </Card>
        ))}
      </div>

      {/* 股票列表 */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {currentStrategy?.name}
            <span className="text-sm font-normal text-muted-foreground">
              ({stocks.length} 只)
            </span>
            {showScore && (
              <Badge className="bg-blue-100 text-blue-700">
                按评分排序
              </Badge>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>代码</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="text-right">价格</TableHead>
                  <TableHead className="text-right">涨跌额</TableHead>
                  <TableHead className="text-right">涨跌幅</TableHead>
                  <TableHead className="text-right">成交量</TableHead>
                  <TableHead className="text-right">市值</TableHead>
                  {showScore && (
                    <TableHead className="text-right">评分</TableHead>
                  )}
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.code}>
                    <TableCell className="font-mono text-sm">{stock.code}</TableCell>
                    <TableCell className="font-medium">{stock.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {stock.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className={`flex items-center justify-end gap-1 ${
                          stock.change >= 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {stock.change >= 0 ? "+" : ""}
                        {stock.change.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          stock.changePercent >= 0 ? "destructive" : "default"
                        }
                        className={
                          stock.changePercent >= 0
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }
                      >
                        {stock.changePercent >= 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(stock.volume)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(stock.marketCap)}
                    </TableCell>
                    {showScore && (
                      <TableCell className="text-right">
                        <Badge className={getScoreColor(
                          selectedStrategy === "5day-trend" ? stock.trendScore : stock.volumeScore
                        )}>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {selectedStrategy === "5day-trend"
                              ? (stock.trendScore || 0)
                              : (stock.volumeScore || 0)}
                          </span>
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/stock/${stock.code}`}>详情</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 策略说明 */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
          📊 {currentStrategy?.name} - 策略说明
        </h3>
        {selectedStrategy === "5day-trend" && (
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>筛选条件：</strong></p>
            <p>• 连续3天以上上涨</p>
            <p>• 5日涨幅 > 3%</p>
            <p>• 价格在MA5上方</p>
            <p>• MACD金叉（DIF > DEA）</p>
            <p><strong>评分规则：</strong>连阳天数(30分) + 5日涨幅(25分) + 技术形态(25分) + MACD金叉(20分)</p>
          </div>
        )}
        {selectedStrategy === "5day-volume" && (
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>筛选条件：</strong></p>
            <p>• 5日均量 > 10日均量的1.2倍</p>
            <p>• 换手率 > 3%</p>
            <p>• 成交量递增趋势</p>
            <p>• 量价配合良好</p>
            <p><strong>评分规则：</strong>均量倍数(35分) + 换手率(25分) + 成交量递增(20分) + 量价配合(20分)</p>
          </div>
        )}
        {selectedStrategy !== "5day-trend" && selectedStrategy !== "5day-volume" && (
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {currentStrategy?.description}
          </p>
        )}
      </Card>
    </div>
  );
}
