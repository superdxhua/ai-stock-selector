"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Flame, TrendingUp, BarChart3, Crown, Sparkles, RefreshCw, Target, Zap, TrendingDown, Activity } from "lucide-react";
import Link from "next/link";

interface BullStockAnalysis {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number;
  bullScore: number;
  bullPotential: 'high' | 'medium' | 'low';
  recommendedStrategies: ('5day-trend' | '5day-volume' | 'leader')[];
  featureSummary: string;
  matchedFeatures: string[];
  trendScore: number;
  volumeScore: number;
  leaderScore: number;
}

interface Statistics {
  totalAnalyzed: number;
  bullPotentialCount: number;
  highPotential: number;
  mediumPotential: number;
  lowPotential: number;
  recommendedTrend: number;
  recommendedVolume: number;
  recommendedLeader: number;
}

export default function BullStockAnalysis() {
  const [stocks, setStocks] = useState<BullStockAnalysis[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [minScore, setMinScore] = useState(60);

  const fetchBullAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bull-analysis?minScore=${minScore}&limit=20`);
      const result = await response.json();

      if (result.success) {
        setStocks(result.data);
        setStatistics(result.statistics);
      }
    } catch (error) {
      console.error('获取大牛股分析失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBullAnalysis();
  }, [minScore]);

  const getPotentialColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'from-red-500 to-pink-500 bg-gradient-to-r text-white border-0';
      case 'medium':
        return 'from-orange-500 to-amber-500 bg-gradient-to-r text-white border-0';
      case 'low':
        return 'from-yellow-500 to-lime-500 bg-gradient-to-r text-white border-0';
      default:
        return 'from-gray-400 to-gray-500 bg-gradient-to-r text-white border-0';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case '5day-trend':
        return <TrendingUp className="w-3 h-3" />;
      case '5day-volume':
        return <BarChart3 className="w-3 h-3" />;
      case 'leader':
        return <Crown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case '5day-trend':
        return 'bg-blue-100/90 dark:bg-blue-900/50 text-blue-700 border-blue-500/30';
      case '5day-volume':
        return 'bg-purple-100/90 dark:bg-purple-900/50 text-purple-700 border-purple-500/30';
      case 'leader':
        return 'bg-amber-100/90 dark:bg-amber-900/50 text-amber-700 border-amber-500/30';
      default:
        return 'bg-gray-100/90 dark:bg-gray-900/50 text-gray-700';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(2)}亿`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(2)}万`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-100 mb-1">已分析股票</p>
                  <p className="text-2xl font-bold">{statistics.totalAnalyzed}</p>
                </div>
                <Activity className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-100 mb-1">大牛潜力股</p>
                  <p className="text-2xl font-bold">{statistics.bullPotentialCount}</p>
                </div>
                <Flame className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-100 mb-1">高潜力</p>
                  <p className="text-2xl font-bold">{statistics.highPotential}</p>
                </div>
                <Target className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-100 mb-1">推荐策略</p>
                  <p className="text-2xl font-bold">
                    {statistics.recommendedTrend + statistics.recommendedVolume + statistics.recommendedLeader}
                  </p>
                </div>
                <Sparkles className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 控制面板 */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-orange-50/80 via-red-50/80 to-pink-50/80 dark:from-orange-950/30 dark:via-red-950/30 dark:to-pink-950/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">大牛股筛选评分</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                调整最低评分以筛选不同潜力的股票
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">当前评分</span>
                  <Badge className={`px-3 py-1 text-sm font-semibold ${
                    minScore >= 80 ? 'from-red-500 to-pink-500 bg-gradient-to-r text-white border-0' :
                    minScore >= 70 ? 'from-orange-500 to-amber-500 bg-gradient-to-r text-white border-0' :
                    'from-yellow-500 to-lime-500 bg-gradient-to-r text-white border-0'
                  }`}>
                    ≥ {minScore} 分
                  </Badge>
                </div>
                <Slider
                  value={[minScore]}
                  onValueChange={(value) => setMinScore(value[0])}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>50分</span>
                  <span>75分</span>
                  <span>100分</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <Button
                onClick={fetchBullAnalysis}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    刷新分析
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 股票列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">正在分析大牛股潜力...</p>
          </Card>
        ) : stocks.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
            <Flame className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">暂无符合条件的大牛股</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              尝试调整评分阈值或稍后再试
            </p>
          </Card>
        ) : (
          stocks.map((stock, index) => (
            <Card
              key={stock.code}
              className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700"
            >
              <div className="relative overflow-hidden">
                {/* 顶部动态装饰条 */}
                <div className={`h-1.5 bg-gradient-to-r ${
                  index === 0 ? 'from-red-500 via-orange-500 to-yellow-500' :
                  index === 1 ? 'from-orange-500 via-yellow-500 to-green-500' :
                  index === 2 ? 'from-yellow-500 via-green-500 to-cyan-500' :
                  'from-slate-500 via-slate-400 to-slate-300'
                } animate-gradient bg-[length:200%_100%]`} />

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* 左侧：股票信息 */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        {/* 股票代码和名称 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                              {stock.name}
                            </h3>
                            <Badge variant="outline" className="font-mono text-sm bg-slate-100 dark:bg-slate-800">
                              {stock.code}
                            </Badge>
                            <Badge className={`${getPotentialColor(stock.bullPotential)} shadow-md`}>
                              <Flame className="w-3 h-3 mr-1" />
                              {stock.bullPotential === 'high' ? '高潜力' :
                               stock.bullPotential === 'medium' ? '中潜力' : '低潜力'}
                            </Badge>
                          </div>

                          {/* 价格和涨跌幅 */}
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                              ¥{stock.price.toFixed(2)}
                            </span>
                            <Badge className={`${
                              stock.changePercent >= 0
                                ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 font-semibold'
                                : 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 font-semibold'
                            } shadow-md`}>
                              {stock.changePercent >= 0 ? '+' : ''}
                              {stock.changePercent.toFixed(2)}%
                              {stock.changePercent >= 0 ? (
                                <TrendingUp className="w-3 h-3 ml-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 ml-1" />
                              )}
                            </Badge>
                          </div>

                          {/* 评分 */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200 dark:border-orange-800">
                              <Sparkles className="w-5 h-5 text-orange-600" />
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">大牛股评分</span>
                              <span className="text-2xl font-bold text-orange-600">
                                {stock.bullScore}
                              </span>
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              市值: {formatNumber(stock.marketCap)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 推荐策略 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {stock.recommendedStrategies.map((strategy) => (
                          <Badge
                            key={strategy}
                            className={`${getStrategyColor(strategy)} border shadow-sm backdrop-blur-sm`}
                          >
                            {getStrategyIcon(strategy)}
                            <span className="ml-1">
                              {strategy === '5day-trend' ? '5日趋势' :
                               strategy === '5day-volume' ? '5日容量' :
                               '龙头精选'}
                            </span>
                          </Badge>
                        ))}
                      </div>

                      {/* 特征总结 */}
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {stock.featureSummary}
                      </p>
                    </div>

                    {/* 右侧：详细指标 */}
                    <div className="lg:min-w-[250px] space-y-3">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        详细指标
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm">
                          <span className="text-sm text-slate-600 dark:text-slate-400">趋势评分</span>
                          <Badge className="bg-blue-100/90 dark:bg-blue-900/50 text-blue-700 border-blue-500/30">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {stock.trendScore}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm">
                          <span className="text-sm text-slate-600 dark:text-slate-400">容量评分</span>
                          <Badge className="bg-purple-100/90 dark:bg-purple-900/50 text-purple-700 border-purple-500/30">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            {stock.volumeScore}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm">
                          <span className="text-sm text-slate-600 dark:text-slate-400">龙头评分</span>
                          <Badge className="bg-amber-100/90 dark:bg-amber-900/50 text-amber-700 border-amber-500/30">
                            <Crown className="w-3 h-3 mr-1" />
                            {stock.leaderScore}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full mt-4 shadow-md hover:shadow-lg transition-shadow"
                        asChild
                      >
                        <Link href={`/stock/${stock.code}`}>查看详情</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
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
