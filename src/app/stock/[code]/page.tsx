"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, Activity } from "lucide-react";
import StockChart from "@/components/StockChart";

interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockDetail {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  kline: KLineData[];
  indicators: {
    ma5: number[];
    ma10: number[];
    ma20: number[];
    cyc5: number[];
    cyc21: number[];
    cyc34: number[];
    cycInf: number[];
    macd: { dif: number; dea: number; bar: number };
    kdj: { k: number; d: number; j: number };
    rsi: number;
  };
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStockDetail();
  }, [params.code]);

  const fetchStockDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stocks/${params.code}`);
      const data = await response.json();
      if (data.success) {
        setStock(data.data);
      }
    } catch (error) {
      console.error("Error fetching stock detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">未找到股票数据</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* 顶部导航 */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">
              {stock.name}（{stock.code}）
            </h1>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：价格信息和图表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 价格卡片 */}
            <Card className="p-6">
              <div className="flex items-end gap-6">
                <div>
                  <div className="text-4xl font-bold font-mono">
                    {stock.price.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {stock.change >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    )}
                    <span
                      className={`text-lg font-mono ${
                        stock.change >= 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change.toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        stock.changePercent >= 0 ? "destructive" : "default"
                      }
                      className={
                        stock.changePercent >= 0
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }
                    >
                      {stock.changePercent >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
                <div className="ml-auto text-right text-sm text-muted-foreground">
                  <div>成交量: {formatNumber(stock.volume)}</div>
                  <div>市值: {formatNumber(stock.marketCap)}</div>
                </div>
              </div>
            </Card>

            {/* K 线图 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">K 线走势图</h3>
              <StockChart data={stock.kline} ma5={stock.indicators.ma5} />
            </Card>
          </div>

          {/* 右侧：技术指标 */}
          <div className="space-y-6">
            {/* MACD */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">MACD 指标</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">DIF</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.macd.dif.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">DEA</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.macd.dea.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">BAR</span>
                  <span
                    className={`font-mono font-medium ${
                      stock.indicators.macd.bar >= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {stock.indicators.macd.bar >= 0 ? "+" : ""}
                    {stock.indicators.macd.bar.toFixed(4)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <Badge
                    variant={
                      stock.indicators.macd.bar >= 0
                        ? "destructive"
                        : "default"
                    }
                    className={
                      stock.indicators.macd.bar >= 0
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {stock.indicators.macd.bar >= 0 ? "多头" : "空头"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* KDJ */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">KDJ 指标</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">K</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.kdj.k.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">D</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.kdj.d.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">J</span>
                  <span
                    className={`font-mono font-medium ${
                      stock.indicators.kdj.j > 80
                        ? "text-red-600"
                        : stock.indicators.kdj.j < 20
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {stock.indicators.kdj.j.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  {stock.indicators.kdj.j > 80 && (
                    <Badge className="bg-red-100 text-red-700">超买</Badge>
                  )}
                  {stock.indicators.kdj.j < 20 && (
                    <Badge className="bg-green-100 text-green-700">超卖</Badge>
                  )}
                  {stock.indicators.kdj.j >= 20 &&
                    stock.indicators.kdj.j <= 80 && (
                      <Badge className="bg-blue-100 text-blue-700">中性</Badge>
                    )}
                </div>
              </div>
            </Card>

            {/* RSI */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">RSI 指标</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">RSI (14)</span>
                  <span
                    className={`font-mono font-medium text-2xl ${
                      stock.indicators.rsi > 70
                        ? "text-red-600"
                        : stock.indicators.rsi < 30
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {stock.indicators.rsi.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  {stock.indicators.rsi > 70 && (
                    <Badge className="bg-red-100 text-red-700">超买</Badge>
                  )}
                  {stock.indicators.rsi < 30 && (
                    <Badge className="bg-green-100 text-green-700">超卖</Badge>
                  )}
                  {stock.indicators.rsi >= 30 &&
                    stock.indicators.rsi <= 70 && (
                      <Badge className="bg-blue-100 text-blue-700">中性</Badge>
                    )}
                </div>
              </div>
            </Card>

            {/* 均线 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">移动平均线</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">MA5</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.ma5[stock.indicators.ma5.length - 1]
                      ? stock.indicators.ma5[
                          stock.indicators.ma5.length - 1
                        ].toFixed(2)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">MA10</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.ma10[stock.indicators.ma10.length - 1]
                      ? stock.indicators.ma10[
                          stock.indicators.ma10.length - 1
                        ].toFixed(2)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">MA20</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.ma20[stock.indicators.ma20.length - 1]
                      ? stock.indicators.ma20[
                          stock.indicators.ma20.length - 1
                        ].toFixed(2)
                      : "-"}
                  </span>
                </div>
              </div>
            </Card>

            {/* CYC成本均线 */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                CYC成本均线
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CYC5 (5日成本)</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.cyc5 && stock.indicators.cyc5[stock.indicators.cyc5.length - 1]
                      ? stock.indicators.cyc5[
                          stock.indicators.cyc5.length - 1
                        ].toFixed(2)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CYC21 (21日成本)</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.cyc21 && stock.indicators.cyc21[stock.indicators.cyc21.length - 1]
                      ? stock.indicators.cyc21[
                          stock.indicators.cyc21.length - 1
                        ].toFixed(2)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CYC34 (34日成本)</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.cyc34 && stock.indicators.cyc34[stock.indicators.cyc34.length - 1]
                      ? stock.indicators.cyc34[
                          stock.indicators.cyc34.length - 1
                        ].toFixed(2)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CYC∞ (无穷成本/240日)</span>
                  <span className="font-mono font-medium">
                    {stock.indicators.cycInf && stock.indicators.cycInf[stock.indicators.cycInf.length - 1]
                      ? stock.indicators.cycInf[
                          stock.indicators.cycInf.length - 1
                        ].toFixed(2)
                      : "-"}
                  </span>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  CYC反映市场平均持仓成本，价格在CYC上方表示多数投资者盈利。CYC∞反映长期平均成本（约一年）
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
