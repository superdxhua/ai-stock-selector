"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame, TrendingUp, BarChart3, Crown, Sparkles, RefreshCw } from "lucide-react";
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
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700';
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
        return 'bg-blue-100 text-blue-700';
      case '5day-volume':
        return 'bg-purple-100 text-purple-700';
      case 'leader':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 100000000000) {
      return `${(num / 100000000000).toFixed(2)}万亿`;
    }
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(2)}亿`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* 标题和控制栏 */}
      <Card className="p-6 border-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                大牛股潜力分析
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                自主复盘优化，识别大牛股潜力特征
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">最低评分：</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="40">40分</option>
                <option value="60">60分</option>
                <option value="80">80分</option>
              </select>
            </div>
            <Button
              onClick={fetchBullAnalysis}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              刷新分析
            </Button>
          </div>
        </div>
      </Card>

      {/* 统计信息 */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">已分析股票</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.totalAnalyzed}</div>
          </Card>
          <Card className="p-4 border-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">大牛股潜力</div>
            <div className="text-2xl font-bold text-purple-600">{statistics.bullPotentialCount}</div>
          </Card>
          <Card className="p-4 border-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">高潜力</div>
            <div className="text-2xl font-bold text-red-600">{statistics.highPotential}</div>
          </Card>
          <Card className="p-4 border-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">中潜力</div>
            <div className="text-2xl font-bold text-orange-600">{statistics.mediumPotential}</div>
          </Card>
        </div>
      )}

      {/* 策略推荐统计 */}
      {statistics && (
        <Card className="p-4 border-2">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            策略推荐统计
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700">
              <TrendingUp className="w-3 h-3 mr-1" />
              5日趋势核心: {statistics.recommendedTrend}
            </Badge>
            <Badge className="bg-purple-100 text-purple-700">
              <BarChart3 className="w-3 h-3 mr-1" />
              5日容量核心: {statistics.recommendedVolume}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-700">
              <Crown className="w-3 h-3 mr-1" />
              龙头精选: {statistics.recommendedLeader}
            </Badge>
          </div>
        </Card>
      )}

      {/* 股票列表 */}
      {isLoading ? (
        <Card className="p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600 dark:text-gray-400">正在分析大牛股潜力...</p>
          </div>
        </Card>
      ) : stocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock) => (
            <Card
              key={stock.code}
              className="p-5 border-2 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* 评分徽章 */}
              <div className="flex items-center justify-between mb-3">
                <Badge
                  className={`${getPotentialColor(stock.bullPotential)} border-2`}
                >
                  <Flame className="w-3 h-3 mr-1" />
                  {stock.bullScore}分 - {stock.bullPotential === 'high' ? '高潜力' : stock.bullPotential === 'medium' ? '中潜力' : '低潜力'}
                </Badge>
              </div>

              {/* 股票信息 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{stock.name}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stock.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stock.price.toFixed(2)}</div>
                    <div className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  市值：{formatNumber(stock.marketCap)}
                </div>
              </div>

              {/* 特征摘要 */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  大牛股特征：
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stock.featureSummary}
                </div>
              </div>

              {/* 策略评分 */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400">趋势</div>
                  <div className="text-lg font-bold text-blue-600">{stock.trendScore}</div>
                </div>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400">容量</div>
                  <div className="text-lg font-bold text-purple-600">{stock.volumeScore}</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400">龙头</div>
                  <div className="text-lg font-bold text-yellow-600">{stock.leaderScore}</div>
                </div>
              </div>

              {/* 推荐策略 */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  推荐策略：
                </div>
                <div className="flex flex-wrap gap-2">
                  {stock.recommendedStrategies.map((strategy) => (
                    <Badge key={strategy} className={getStrategyColor(strategy)}>
                      {getStrategyIcon(strategy)}
                      <span className="ml-1">
                        {strategy === '5day-trend' ? '5日趋势核心' :
                         strategy === '5day-volume' ? '5日容量核心' : '龙头精选'}
                      </span>
                    </Badge>
                  ))}
                  {stock.recommendedStrategies.length === 0 && (
                    <span className="text-sm text-gray-500">暂无推荐</span>
                  )}
                </div>
              </div>

              {/* 详情按钮 */}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/stock/${stock.code}`}>
                  查看详情
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              未找到符合条件的大牛股潜力股票
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              尝试降低最低评分或稍后再试
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
