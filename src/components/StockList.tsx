"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2, Flame, BarChart3, Crown, Sparkles, AlertCircle, Zap } from "lucide-react";
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
  technicalAnalysis?: {
    consecutiveRises?: number;
    price5DayChange?: number;
    hasLimitUp?: boolean;
    isOneSidedLimitUp?: boolean;
    macdGoldenCross?: boolean;
    volumeIncreasing?: boolean;
    priceVolumeCorrelation?: number;
  };
}

const strategies = [
  { id: "5day-trend", name: "5日趋势核心", description: "短期强势上涨股（评分≥50）" },
  { id: "5day-volume", name: "5日容量核心", description: "成交量活跃股（评分≥50）" },
  { id: "leader", name: "龙头精选", description: "从趋势+容量双池优中选优，精选3只龙头" },
];

export default function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState("5day-trend");
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
      const url = `/api/stocks/real?strategy=${strategy}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setStocks(result.data);
        console.log(`获取到 ${result.data?.length || 0} 只股票数据（来自东方财富）`);

        if (result.data && result.data.length > 0) {
          saveHistory(strategy, result.data);
        }
      } else {
        console.error("获取股票数据失败:", result.error);
        alert(`获取股票数据失败: ${result.error || "未知错误"}`);
        setStocks([]);
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
      alert(`获取股票数据失败: ${error instanceof Error ? error.message : "网络错误"}`);
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="space-y-6">
      {/* 策略选择卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strategy) => {
          const isSelected = selectedStrategy === strategy.id;
          
          const strategyConfig = {
            '5day-trend': {
              icon: <TrendingUp className="w-8 h-8" />,
              color: 'from-blue-500 via-cyan-500 to-teal-500',
              textColor: 'text-blue-600',
              bgColor: 'bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-teal-50/80 dark:from-blue-950/40 dark:via-cyan-950/40 dark:to-teal-950/40',
              borderColor: 'border-blue-500/50',
              ringColor: 'ring-blue-500/50',
              badgeColor: 'bg-blue-100/90 text-blue-700 border-blue-500/30',
              description: '短期强势上涨股',
              scoreText: '趋势评分'
            },
            '5day-volume': {
              icon: <BarChart3 className="w-8 h-8" />,
              color: 'from-purple-500 via-pink-500 to-rose-500',
              textColor: 'text-purple-600',
              bgColor: 'bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-rose-50/80 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-rose-950/40',
              borderColor: 'border-purple-500/50',
              ringColor: 'ring-purple-500/50',
              badgeColor: 'bg-purple-100/90 text-purple-700 border-purple-500/30',
              description: '成交量活跃股',
              scoreText: '容量评分'
            },
            'leader': {
              icon: <Crown className="w-8 h-8" />,
              color: 'from-amber-500 via-orange-500 to-red-500',
              textColor: 'text-amber-600',
              bgColor: 'bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-red-50/80 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-red-950/40',
              borderColor: 'border-amber-500/50',
              ringColor: 'ring-amber-500/50',
              badgeColor: 'bg-amber-100/90 text-amber-700 border-amber-500/30',
              description: '每天精选3只龙头',
              scoreText: '龙头评分'
            }
          };

          const config = strategyConfig[strategy.id as keyof typeof strategyConfig];

          return (
            <Card
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`
                relative overflow-hidden cursor-pointer transition-all duration-500
                hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]
                ${isSelected 
                  ? `ring-4 ${config.ringColor} ${config.bgColor} border-2 ${config.borderColor} shadow-xl` 
                  : 'border-2 border-slate-200/50 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600'
                }
              `}
            >
              {/* 动态背景装饰 */}
              <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${config.color} opacity-5 rounded-bl-full transition-opacity duration-500 ${isSelected ? 'opacity-10' : 'opacity-5'}`} />
              <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${config.color} opacity-5 rounded-tr-full transition-opacity duration-500 ${isSelected ? 'opacity-10' : 'opacity-5'}`} />
              
              <div className="relative p-6">
                {/* 图标和标题 */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`${config.textColor} p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg ${isSelected ? `ring-2 ${config.ringColor}` : ''}`}>
                    {config.icon}
                  </div>
                  {isSelected && (
                    <Badge className={`shrink-0 border ${config.badgeColor} shadow-md`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      已选择
                    </Badge>
                  )}
                </div>

                {/* 标题和描述 */}
                <div className="mb-4">
                  <h3 className={`text-xl font-bold mb-2 ${isSelected ? config.textColor : 'text-slate-800 dark:text-slate-100'}`}>
                    {strategy.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {strategy.description}
                  </p>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                      {config.scoreText}
                    </Badge>
                    <span>评分 ≥ 50</span>
                  </div>
                  {isSelected && (
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${config.color} animate-pulse shadow-lg`} />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 股票列表 */}
      <Card className="overflow-hidden shadow-2xl border-slate-200 dark:border-slate-700">
        <div className="relative overflow-hidden">
          {/* 顶部动态装饰条 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-amber-500 animate-gradient bg-[length:200%_100%]" />
          
          <div className="p-6 border-b bg-gradient-to-br from-slate-50/50 via-white/50 to-slate-50/50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* 策略图标 */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br shadow-2xl flex items-center justify-center text-white transition-transform duration-300 ${
                  selectedStrategy === '5day-trend' ? 'from-blue-500 via-cyan-500 to-teal-500 scale-105' :
                  selectedStrategy === '5day-volume' ? 'from-purple-500 via-pink-500 to-rose-500 scale-105' :
                  'from-amber-500 via-orange-500 to-red-500 scale-105'
                }`}>
                  {selectedStrategy === '5day-trend' && <TrendingUp className="w-7 h-7" />}
                  {selectedStrategy === '5day-volume' && <BarChart3 className="w-7 h-7" />}
                  {selectedStrategy === 'leader' && <Crown className="w-7 h-7" />}
                </div>
                
                {/* 标题信息 */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {currentStrategy?.name}
                    <Badge variant="secondary" className="text-xs shadow-md">
                      {stocks.length} 只
                    </Badge>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedStrategy === '5day-trend' && '短期强势上涨股筛选'}
                    {selectedStrategy === '5day-volume' && '成交量活跃股筛选'}
                    {selectedStrategy === 'leader' && '每天精选3只最优质龙头'}
                  </p>
                </div>
              </div>

              {/* 右侧徽章 */}
              <div className="flex items-center gap-2 flex-wrap">
                {showScore && (
                  <Badge className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    按评分排序
                  </Badge>
                )}
                <Badge className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white border-0 shadow-lg">
                  <span className="flex items-center gap-1">
                    ⚠️ 已过滤：科创板、北交所、ST、退市风险、停牌、特殊处理、市值40-700亿外、成交额30万以下
                  </span>
                </Badge>
                <Badge className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white border-0 shadow-lg">
                  <span className="flex items-center gap-1">
                    📡 东方财富实时数据
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            <p className="text-slate-500 dark:text-slate-400">正在加载股票数据...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
                  <TableHead className="font-semibold">代码</TableHead>
                  <TableHead className="font-semibold">名称</TableHead>
                  <TableHead className="text-right font-semibold">价格</TableHead>
                  <TableHead className="text-right font-semibold">涨跌额</TableHead>
                  <TableHead className="text-right font-semibold">涨跌幅</TableHead>
                  <TableHead className="text-right font-semibold">成交量</TableHead>
                  <TableHead className="text-right font-semibold">市值</TableHead>
                  {showScore && selectedStrategy === "leader" && (
                    <TableHead className="text-right font-semibold">趋势评分</TableHead>
                  )}
                  {showScore && selectedStrategy === "leader" && (
                    <TableHead className="text-right font-semibold">容量评分</TableHead>
                  )}
                  {showScore && (
                    <TableHead className="text-right font-semibold">综合评分</TableHead>
                  )}
                  <TableHead className="text-right font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.code} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${stock.technicalAnalysis?.isOneSidedLimitUp ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}`}>
                    <TableCell className="font-mono text-sm">{stock.code}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {stock.name}
                        {stock.technicalAnalysis?.isOneSidedLimitUp && (
                          <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 border-amber-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            一字板
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
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
                            ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 font-semibold"
                            : "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 font-semibold"
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
                    {showScore && selectedStrategy === "leader" && (
                      <TableCell className="text-right">
                        <Badge className={getScoreColor(stock.trendScore)}>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {stock.trendScore || 0}
                          </span>
                        </Badge>
                      </TableCell>
                    )}
                    {showScore && selectedStrategy === "leader" && (
                      <TableCell className="text-right">
                        <Badge className={getScoreColor(stock.volumeScore)}>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {stock.volumeScore || 0}
                          </span>
                        </Badge>
                      </TableCell>
                    )}
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
                      <Button variant="outline" size="sm" asChild className="shadow-md hover:shadow-lg transition-shadow">
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
      <Card className="overflow-hidden border-2 shadow-xl backdrop-blur-sm">
        <div className={`p-6 bg-gradient-to-r ${
          selectedStrategy === '5day-trend' ? 'from-blue-50/80 via-cyan-50/80 to-teal-50/80 dark:from-blue-950/40 dark:via-cyan-950/40 dark:to-teal-950/40 border-l-4 border-blue-500' :
          selectedStrategy === '5day-volume' ? 'from-purple-50/80 via-pink-50/80 to-rose-50/80 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-rose-950/40 border-l-4 border-purple-500' :
          'from-amber-50/80 via-orange-50/80 to-red-50/80 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-red-950/40 border-l-4 border-amber-500'
        }`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-xl backdrop-blur-sm ${
              selectedStrategy === '5day-trend' ? 'bg-blue-100/90 dark:bg-blue-900/50 text-blue-600' :
              selectedStrategy === '5day-volume' ? 'bg-purple-100/90 dark:bg-purple-900/50 text-purple-600' :
              'bg-amber-100/90 dark:bg-amber-900/50 text-amber-600'
            }`}>
              {selectedStrategy === '5day-trend' && <TrendingUp className="w-6 h-6" />}
              {selectedStrategy === '5day-volume' && <BarChart3 className="w-6 h-6" />}
              {selectedStrategy === 'leader' && <Crown className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                {selectedStrategy === '5day-trend' && '5日趋势核心策略说明'}
                {selectedStrategy === '5day-volume' && '5日容量核心策略说明'}
                {selectedStrategy === 'leader' && '龙头精选策略说明'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {selectedStrategy === '5day-trend' && '该策略专注于捕捉短期强势上涨的股票，通过分析过去5个交易日的价格走势、成交量变化和技术指标，筛选出趋势评分≥50的潜力股。适合短线交易。'}
                {selectedStrategy === '5day-volume' && '该策略专注于成交量活跃的股票，通过分析过去5个交易日的成交量、成交额和资金流向，筛选出容量评分≥50的活跃股。适合捕捉主力资金动向。'}
                {selectedStrategy === 'leader' && '该策略从趋势池（趋势评分≥50）和容量池（容量评分≥50）的并集中优中选优，综合计算评分后精选出3只最优质的龙头股票。龙头股同时具备趋势强劲和成交活跃的特点，适合稳健投资者。'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              从热点板块筛选
            </Badge>
            <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              过滤ST和退市风险股
            </Badge>
            <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              市值40-700亿
            </Badge>
            <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              成交额≥30万
            </Badge>
            {selectedStrategy === 'leader' && (
              <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                <Sparkles className="w-3 h-3 mr-1" />
                趋势池∩容量池
              </Badge>
            )}
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 border-amber-300 dark:border-amber-800 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              一字板降低评分
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              倾向成交额≥5亿
            </Badge>
          </div>
        </div>
      </Card>

      {/* 历史记录和连续涨停 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyCalendar strategy={selectedStrategy} />
        <ConsecutiveStocks />
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
