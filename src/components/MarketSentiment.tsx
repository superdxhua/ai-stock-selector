"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Flame, Activity, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketSentiment {
  overallSentiment: "extreme-bullish" | "bullish" | "neutral" | "bearish" | "extreme-bearish";
  sentimentScore: number;
  sentimentLabel: string;
  updateTime: string;
  indicators: {
    limitUp: number;
    limitDown: number;
    limitUpRatio: number;
    riseCount: number;
    fallCount: number;
    flatCount: number;
    riseRatio: number;
    hotSectors: Array<{
      name: string;
      code: string;
      changePercent: number;
      leadingStock: string;
    }>;
    shIndex: number;
    szIndex: number;
    changePercent: number;
    northboundMoney: {
      netInflow: number;
      status: "inflow" | "outflow";
    };
  };
}

export default function MarketSentiment() {
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchSentiment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sentiment");
      const data = await response.json();
      if (data.success) {
        setSentiment(data.data);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching sentiment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    // 每60秒自动刷新
    const interval = setInterval(fetchSentiment, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 100000000) {
      return `${(num / 100000000).toFixed(2)}亿`;
    }
    if (Math.abs(num) >= 10000) {
      return `${(num / 10000).toFixed(2)}万`;
    }
    return num.toString();
  };

  const getSentimentColor = (sentiment: string): string => {
    const colors = {
      "extreme-bullish": "bg-red-100 text-red-700 border-red-300",
      "bullish": "bg-orange-100 text-orange-700 border-orange-300",
      "neutral": "bg-gray-100 text-gray-700 border-gray-300",
      "bearish": "bg-green-100 text-green-700 border-green-300",
      "extreme-bearish": "bg-emerald-100 text-emerald-700 border-emerald-300",
    };
    return colors[sentiment as keyof typeof colors] || colors.neutral;
  };

  const getProgressColor = (score: number): string => {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-gray-500";
    if (score >= 20) return "bg-green-500";
    return "bg-emerald-500";
  };

  if (isLoading && !sentiment) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🌡️ 市场情绪风向
          <span className="text-sm font-normal text-muted-foreground">
            ({lastUpdate})
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSentiment}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* 整体情绪 */}
      {sentiment && (
        <Card className={`p-6 border-2 ${getSentimentColor(sentiment.overallSentiment)}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold mb-1">{sentiment.sentimentLabel}</div>
              <div className="text-sm text-muted-foreground">
                情绪指数: <span className="font-semibold text-lg">{sentiment.sentimentScore}</span>/100
              </div>
            </div>
            <div className="w-32">
              <div className="flex justify-between text-xs mb-1">
                <span>悲观</span>
                <span>乐观</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor(sentiment.sentimentScore)}`}
                  style={{ width: `${sentiment.sentimentScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* 指数涨跌 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground">上证指数</div>
              <div className="font-mono font-semibold">
                {sentiment.indicators.shIndex.toFixed(2)}
              </div>
              <div
                className={`text-sm flex items-center gap-1 ${
                  sentiment.indicators.changePercent >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {sentiment.indicators.changePercent >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {sentiment.indicators.changePercent >= 0 ? "+" : ""}
                {sentiment.indicators.changePercent.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">深证成指</div>
              <div className="font-mono font-semibold">
                {sentiment.indicators.szIndex.toFixed(2)}
              </div>
              <div
                className={`text-sm flex items-center gap-1 ${
                  sentiment.indicators.changePercent >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {sentiment.indicators.changePercent >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {sentiment.indicators.changePercent >= 0 ? "+" : ""}
                {sentiment.indicators.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 详细指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 涨停跌停 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">涨跌停统计</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">涨停</span>
              <Badge className="bg-red-100 text-red-700">
                {sentiment?.indicators.limitUp || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">跌停</span>
              <Badge className="bg-green-100 text-green-700">
                {sentiment?.indicators.limitDown || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">涨跌比</span>
              <span className="text-sm font-medium">
                {sentiment?.indicators.riseCount || 0} : {sentiment?.indicators.fallCount || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* 涨跌分布 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">涨跌分布</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">上涨</span>
              <Badge variant="default" className="bg-red-100 text-red-700">
                {sentiment?.indicators.riseCount || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">下跌</span>
              <Badge variant="default" className="bg-green-100 text-green-700">
                {sentiment?.indicators.fallCount || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">平盘</span>
              <Badge variant="secondary">
                {sentiment?.indicators.flatCount || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">上涨比例</span>
              <span className="font-medium">
                {((sentiment?.indicators.riseRatio || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        {/* 北向资金 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold">北向资金</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">净流入</span>
              <span
                className={`font-medium ${
                  sentiment?.indicators.northboundMoney.status === "inflow"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {sentiment?.indicators.northboundMoney.status === "inflow" ? "+" : ""}
                {formatNumber(sentiment?.indicators.northboundMoney.netInflow || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">状态</span>
              <Badge
                variant={
                  sentiment?.indicators.northboundMoney.status === "inflow"
                    ? "destructive"
                    : "default"
                }
                className={
                  sentiment?.indicators.northboundMoney.status === "inflow"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }
              >
                {sentiment?.indicators.northboundMoney.status === "inflow" ? "净流入" : "净流出"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* 热点板块 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold">热点板块</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {sentiment?.indicators.hotSectors.map((sector) => (
            <Card
              key={sector.code}
              className="p-3 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-sm font-medium mb-1">{sector.name}</div>
              <div
                className={`text-lg font-mono font-semibold ${
                  sector.changePercent >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {sector.changePercent >= 0 ? "+" : ""}
                {sector.changePercent.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                龙头: {sector.leadingStock}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
