"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import Link from "next/link";

interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

const strategies = [
  { id: "all", name: "全部股票", description: "查看所有股票" },
  { id: "bullish", name: "看涨策略", description: "涨幅 > 2% 的股票" },
  { id: "value", name: "价值投资", description: "价格 < 50 且市值 > 1000亿" },
  { id: "growth", name: "成长策略", description: "涨幅 > 0 且成交量 > 5000万" },
  { id: "large-cap", name: "大盘蓝筹", description: "市值 > 5000亿" },
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

  return (
    <div className="flex flex-col gap-4">
      {/* 策略选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
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
            <h3 className="font-semibold text-sm mb-1">{strategy.name}</h3>
            <p className="text-xs text-muted-foreground">
              {strategy.description}
            </p>
          </Card>
        ))}
      </div>

      {/* 股票列表 */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {strategies.find((s) => s.id === selectedStrategy)?.name}
            <span className="text-sm font-normal text-muted-foreground">
              ({stocks.length} 只)
            </span>
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

      {/* 提示信息 */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>选股策略说明：</strong>
          <br />
          • 看涨策略：筛选当日涨幅超过 2% 的强势股票
          <br />
          • 价值投资：寻找价格合理、市值较大的优质股票
          <br />
          • 成长策略：关注成交活跃且走势向好的成长股
          <br />
          • 大盘蓝筹：聚焦市值超 5000 亿的权重股
        </p>
      </Card>
    </div>
  );
}
