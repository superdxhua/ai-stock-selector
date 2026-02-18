"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2, Flame, BarChart3, Crown } from "lucide-react";
import Link from "next/link";
import StrategyCalendar from "./StrategyCalendar";
import ConsecutiveStocks from "./ConsecutiveStocks";

interface Stock {
  code: string;
  name: string;
  sector?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  trendScore?: number;
  volumeScore?: number;
  leaderScore?: number;
}

const strategies = [
  { id: "all", name: "全部股票", description: "查看所有股票" },
  { id: "5day-trend", name: "5日趋势核心", description: "短期强势上涨股（评分≥50）" },
  { id: "5day-volume", name: "5日容量核心", description: "成交量活跃股（评分≥50）" },
  { id: "leader", name: "龙头精选", description: "每天精选3只最优质龙头（评分≥50）" },
];

export default function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // 生成模拟股票数据
  const generateMockStocks = (strategy: string): Stock[] => {
    const stockNames = [
      { code: "600519", name: "贵州茅台", sector: "白酒" },
      { code: "000858", name: "五粮液", sector: "白酒" },
      { code: "603259", name: "药明康德", sector: "医药" },
      { code: "300750", name: "宁德时代", sector: "新能源" },
      { code: "002594", name: "比亚迪", sector: "新能源" },
      { code: "600030", name: "中信证券", sector: "券商" },
      { code: "601318", name: "中国平安", sector: "保险" },
      { code: "002415", name: "海康威视", sector: "电子" },
      { code: "600036", name: "招商银行", sector: "银行" },
      { code: "000001", name: "平安银行", sector: "银行" },
      { code: "601888", name: "中国中免", sector: "消费" },
      { code: "300059", name: "东方财富", sector: "券商" },
      { code: "688981", name: "中芯国际", sector: "科技" },
      { code: "600276", name: "恒瑞医药", sector: "医药" },
      { code: "002142", name: "宁波银行", sector: "银行" },
    ];

    return stockNames.map((stock) => {
      const basePrice = Math.random() * 50 + 10;
      const change = (Math.random() - 0.5) * 5;
      const changePercent = (change / basePrice) * 100;
      const volume = Math.floor(Math.random() * 500000000) + 10000000;
      const marketCap = basePrice * (Math.random() * 100000000 + 50000000);

      let trendScore = 0;
      let volumeScore = 0;
      let leaderScore = 0;

      if (strategy === "5day-trend") {
        trendScore = Math.floor(Math.random() * 50) + 50;
        volumeScore = Math.floor(Math.random() * 100);
        leaderScore = Math.floor(Math.random() * 100);
      } else if (strategy === "5day-volume") {
        volumeScore = Math.floor(Math.random() * 50) + 50;
        trendScore = Math.floor(Math.random() * 100);
        leaderScore = Math.floor(Math.random() * 100);
      } else if (strategy === "leader") {
        leaderScore = Math.floor(Math.random() * 50) + 50;
        trendScore = Math.floor(Math.random() * 100);
        volumeScore = Math.floor(Math.random() * 100);
      }

      return {
        code: stock.code,
        name: stock.name,
        sector: stock.sector,
        price: Number(basePrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume,
        marketCap: Math.floor(marketCap),
        trendScore,
        volumeScore,
        leaderScore,
      };
    });
  };

  const fetchStocks = async (strategy: string) => {
    setIsLoading(true);
    try {
      // 使用真实数据API
      const url = strategy === "all"
        ? "/api/stocks/real"
        : `/api/stocks/real?strategy=${strategy}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setStocks(result.data);
        console.log(`获取到 ${result.data?.length || 0} 只股票数据`);

        // 如果是策略筛选，自动保存历史记录
        if (strategy !== "all" && result.data && result.data.length > 0) {
          saveHistory(strategy, result.data);
        }
      } else {
        console.error("获取股票数据失败:", result.error);
        // 如果真实数据获取失败，使用模拟数据
        console.log("使用模拟数据");
        let mockStocks = generateMockStocks(strategy);

        if (strategy === "5day-trend") {
          mockStocks.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
        } else if (strategy === "5day-volume") {
          mockStocks.sort((a, b) => (b.volumeScore || 0) - (a.volumeScore || 0));
        } else if (strategy === "leader") {
          mockStocks.sort((a, b) => (b.leaderScore || 0) - (a.leaderScore || 0));
          mockStocks = mockStocks.slice(0, 3);
        }

        setStocks(mockStocks);
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
      // 出错时使用模拟数据
      console.log("出错，使用模拟数据");
      let mockStocks = generateMockStocks(strategy);

      if (strategy === "5day-trend") {
        mockStocks.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
      } else if (strategy === "5day-volume") {
        mockStocks.sort((a, b) => (b.volumeScore || 0) - (a.volumeScore || 0));
      } else if (strategy === "leader") {
        mockStocks.sort((a, b) => (b.leaderScore || 0) - (a.leaderScore || 0));
        mockStocks = mockStocks.slice(0, 3);
      }

      setStocks(mockStocks);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存历史记录
  const saveHistory = async (strategy: string, stocks: any[]) => {
    try {
      await fetch("/api/strategy-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy, stocks }),
      });
    } catch (error) {
      console.error("Error saving history:", error);
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
  const showScore = selectedStrategy === "5day-trend" || selectedStrategy === "5day-volume" || selectedStrategy === "leader";

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
              {strategy.id === "leader" && <Crown className="w-4 h-4 text-yellow-600" />}
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
                          selectedStrategy === "5day-trend" ? stock.trendScore :
                          selectedStrategy === "5day-volume" ? stock.volumeScore :
                          stock.leaderScore
                        )}>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {selectedStrategy === "5day-trend"
                              ? (stock.trendScore || 0)
                              : selectedStrategy === "5day-volume"
                              ? (stock.volumeScore || 0)
                              : (stock.leaderScore || 0)}
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
            <p>• <strong>5日内至少有一个涨停板（必选）</strong></p>
            <p>• 连续3天以上上涨</p>
            <p>• 5日涨幅 &gt; 3%</p>
            <p>• 价格在MA5上方</p>
            <p>• MACD金叉（DIF &gt; DEA）</p>
            <p><strong>评分规则：</strong>连阳天数(30分) + 5日涨幅(25分) + 技术形态(25分) + MACD金叉(20分)</p>
          </div>
        )}
        {selectedStrategy === "5day-volume" && (
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>筛选条件：</strong></p>
            <p>• <strong>5日内至少有一个涨停板（必选）</strong></p>
            <p>• 5日均量 &gt; 10日均量的1.2倍</p>
            <p>• 换手率 &gt; 3%</p>
            <p>• 成交量递增趋势</p>
            <p>• 量价配合良好</p>
            <p><strong>评分规则：</strong>均量倍数(35分) + 换手率(25分) + 成交量递增(20分) + 量价配合(20分)</p>
          </div>
        )}
        {selectedStrategy === "leader" && (
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>👑 龙头精选 - 每天只选3只最优质龙头</strong></p>
            <p><strong>筛选条件：</strong></p>
            <p>• <strong>5日内至少有一个涨停板（必选）</strong></p>
            <p>• 板块龙头：涨跌幅和成交量在板块中排名前列</p>
            <p>• 成交量堆积：连续放量</p>
            <p>• 人气爆棚：连续大涨或涨停天数多</p>
            <p>• 量价齐升：价格上涨且成交量增加</p>
            <p><strong>评分规则：</strong>板块龙头(30分) + 成交量堆积(25分) + 人气爆棚(25分) + 量价齐升(20分)</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">💡 每天仅筛选出3只综合评分最高的龙头股票，关注短期大幅上涨机会</p>
          </div>
        )}
        {selectedStrategy !== "5day-trend" && selectedStrategy !== "5day-volume" && selectedStrategy !== "leader" && (
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {currentStrategy?.description}
          </p>
        )}
      </Card>

      {/* 日历和连续上榜（仅策略模式下显示） */}
      {(selectedStrategy === "5day-trend" || selectedStrategy === "5day-volume" || selectedStrategy === "leader") && (
        <>
          <StrategyCalendar strategy={selectedStrategy} />
          <ConsecutiveStocks strategy={selectedStrategy} />
        </>
      )}
    </div>
  );
}
