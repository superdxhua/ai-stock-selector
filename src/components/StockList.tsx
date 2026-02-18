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
  { id: "5day-trend", name: "5日趋势核心", description: "短期强势上涨股（评分≥50）" },
  { id: "5day-volume", name: "5日容量核心", description: "成交量活跃股（评分≥50）" },
  { id: "leader", name: "龙头精选", description: "每天精选3只最优质龙头（评分≥50）" },
];

export default function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState("5day-trend");
  const [isLoading, setIsLoading] = useState(false);

  // 生成模拟股票数据
  // ====== 模拟数据生成函数 ======
  // 注意：此函数仅用于离线测试或开发调试
  // 生产环境默认使用东方财富真实数据源
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
      // 使用东方财富真实数据API（策略筛选）
      const url = `/api/stocks/real?strategy=${strategy}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setStocks(result.data);
        console.log(`获取到 ${result.data?.length || 0} 只股票数据（来自东方财富）`);

        // 自动保存历史记录
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
    <div className="flex flex-col gap-6">
      {/* 策略选择 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strategy) => {
          const isSelected = selectedStrategy === strategy.id;
          
          // 定义每个策略的主题色和样式
          const strategyConfig = {
            '5day-trend': {
              icon: <TrendingUp className="w-8 h-8" />,
              color: 'from-blue-500 to-cyan-500',
              textColor: 'text-blue-600',
              bgColor: 'bg-blue-50 dark:bg-blue-950/30',
              borderColor: 'border-blue-500',
              ringColor: 'ring-blue-500',
              badgeColor: 'bg-blue-100 text-blue-700',
              description: '短期强势上涨股',
              scoreText: '趋势评分'
            },
            '5day-volume': {
              icon: <BarChart3 className="w-8 h-8" />,
              color: 'from-purple-500 to-pink-500',
              textColor: 'text-purple-600',
              bgColor: 'bg-purple-50 dark:bg-purple-950/30',
              borderColor: 'border-purple-500',
              ringColor: 'ring-purple-500',
              badgeColor: 'bg-purple-100 text-purple-700',
              description: '成交量活跃股',
              scoreText: '容量评分'
            },
            'leader': {
              icon: <Crown className="w-8 h-8" />,
              color: 'from-yellow-500 to-orange-500',
              textColor: 'text-yellow-600',
              bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
              borderColor: 'border-yellow-500',
              ringColor: 'ring-yellow-500',
              badgeColor: 'bg-yellow-100 text-yellow-700',
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
                relative overflow-hidden cursor-pointer transition-all duration-300
                hover:shadow-2xl hover:-translate-y-1
                ${isSelected 
                  ? `ring-4 ${config.ringColor} ${config.bgColor} border-2 ${config.borderColor}` 
                  : 'border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }
              `}
            >
              {/* 背景渐变装饰 */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.color} opacity-10 rounded-bl-full`} />
              
              <div className="relative p-6">
                {/* 图标和标题 */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`${config.textColor} p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm`}>
                    {config.icon}
                  </div>
                  {isSelected && (
                    <Badge className={`shrink-0 ${config.badgeColor}`}>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        已选择
                      </span>
                    </Badge>
                  )}
                </div>

                {/* 标题和描述 */}
                <div className="mb-4">
                  <h3 className={`text-lg font-bold mb-2 ${isSelected ? config.textColor : 'text-slate-800 dark:text-slate-100'}`}>
                    {strategy.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {strategy.description}
                  </p>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Badge variant="outline" className="text-xs">
                      {config.scoreText}
                    </Badge>
                    <span>评分 ≥ 50</span>
                  </div>
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color} animate-pulse`} />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 股票列表 */}
      <Card className="overflow-hidden shadow-lg">
        <div className="relative overflow-hidden">
          {/* 顶部装饰渐变 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500" />
          
          <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* 策略图标 */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  selectedStrategy === '5day-trend' ? 'from-blue-500 to-cyan-500' :
                  selectedStrategy === '5day-volume' ? 'from-purple-500 to-pink-500' :
                  'from-yellow-500 to-orange-500'
                } flex items-center justify-center text-white shadow-lg`}>
                  {selectedStrategy === '5day-trend' && <TrendingUp className="w-6 h-6" />}
                  {selectedStrategy === '5day-volume' && <BarChart3 className="w-6 h-6" />}
                  {selectedStrategy === 'leader' && <Crown className="w-6 h-6" />}
                </div>
                
                {/* 标题信息 */}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {currentStrategy?.name}
                    <Badge variant="secondary" className="text-xs">
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
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      按评分排序
                    </span>
                  </Badge>
                )}
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
                  <span className="flex items-center gap-1">
                    ⚠️ 已过滤：科创板、北交所、ST、退市整理期、停牌、特殊处理、市值40-700亿外、成交额30万以下
                  </span>
                </Badge>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                  <span className="flex items-center gap-1">
                    📡 东方财富实时数据
                  </span>
                </Badge>
              </div>
            </div>
          </div>
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
      <Card className="overflow-hidden border-2 shadow-md">
        <div className={`p-5 bg-gradient-to-r ${
          selectedStrategy === '5day-trend' ? 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-l-4 border-blue-500' :
          selectedStrategy === '5day-volume' ? 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-l-4 border-purple-500' :
          'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-l-4 border-yellow-500'
        }`}>
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              selectedStrategy === '5day-trend' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' :
              selectedStrategy === '5day-volume' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600' :
              'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600'
            }`}>
              {selectedStrategy === '5day-trend' && <TrendingUp className="w-5 h-5" />}
              {selectedStrategy === '5day-volume' && <BarChart3 className="w-5 h-5" />}
              {selectedStrategy === 'leader' && <Crown className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-1 ${
                selectedStrategy === '5day-trend' ? 'text-blue-800 dark:text-blue-200' :
                selectedStrategy === '5day-volume' ? 'text-purple-800 dark:text-purple-200' :
                'text-yellow-800 dark:text-yellow-200'
              }`}>
                {currentStrategy?.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                智能选股策略说明
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedStrategy === "5day-trend" && (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">✨ 筛选条件</p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 ml-4">
                    <li>• <strong>5日内至少有一个涨停板（必选）</strong></li>
                    <li>• 连续3天以上上涨</li>
                    <li>• 5日涨幅 &gt; 3%</li>
                    <li>• 价格在MA5上方</li>
                    <li>• MACD金叉（DIF &gt; DEA）</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">📊 评分规则</p>
                  <p className="text-slate-600 dark:text-slate-400">连阳天数(30分) + 5日涨幅(25分) + 技术形态(25分) + MACD金叉(20分)</p>
                </div>
              </div>
            )}
            {selectedStrategy === "5day-volume" && (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">✨ 筛选条件</p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 ml-4">
                    <li>• <strong>5日内至少有一个涨停板（必选）</strong></li>
                    <li>• 5日均量 &gt; 10日均量的1.2倍</li>
                    <li>• 换手率 &gt; 3%</li>
                    <li>• 成交量递增趋势</li>
                    <li>• 量价配合良好</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">📊 评分规则</p>
                  <p className="text-slate-600 dark:text-slate-400">均量倍数(35分) + 换手率(25分) + 成交量递增(20分) + 量价配合(20分)</p>
                </div>
              </div>
            )}
            {selectedStrategy === "leader" && (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">✨ 筛选条件</p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 ml-4">
                    <li>• <strong>5日内至少有一个涨停板（必选）</strong></li>
                    <li>• 板块龙头：涨跌幅和成交量在板块中排名前列</li>
                    <li>• 成交量堆积：连续放量</li>
                    <li>• 人气爆棚：连续大涨或涨停天数多</li>
                    <li>• 量价齐升：价格上涨且成交量增加</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">📊 评分规则</p>
                  <p className="text-slate-600 dark:text-slate-400">板块龙头(30分) + 成交量堆积(25分) + 人气爆棚(25分) + 量价齐升(20分)</p>
                </div>
                <div className={`p-3 rounded-lg ${selectedStrategy === 'leader' ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                    💡 每天仅筛选出3只综合评分最高的龙头股票，关注短期大幅上涨机会
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 日历和连续上榜 */}
      <StrategyCalendar strategy={selectedStrategy} />
      <ConsecutiveStocks strategy={selectedStrategy} />
    </div>
  );
}
