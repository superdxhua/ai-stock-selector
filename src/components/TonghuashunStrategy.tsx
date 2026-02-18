"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, RefreshCw, TrendingUp, BarChart3 } from "lucide-react";

interface TonghuashunStock {
  id: number;
  stock_code: string;
  stock_name: string;
  strategy_type: string;
  reason?: string;
  source: string;
  price?: number;
  change_percent?: number;
  added_at: string;
  learned_features?: any;
}

export default function TonghuashunStrategy() {
  const [stocks, setStocks] = useState<TonghuashunStock[]>([]);
  const [strategyType, setStrategyType] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    strategyType: "5day-trend",
    reason: "",
  });

  // 加载股票列表
  const loadStocks = async () => {
    setLoading(true);
    try {
      const url = strategyType === "all" 
        ? "/api/tonghuashun/stocks"
        : `/api/tonghuashun/stocks?strategyType=${strategyType}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setStocks(result.data);
      }
    } catch (error) {
      console.error("加载股票失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 添加股票
  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/tonghuashun/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("股票添加成功");
        setShowAddForm(false);
        setFormData({ code: "", name: "", strategyType: "5day-trend", reason: "" });
        loadStocks();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("添加股票失败:", error);
      alert("添加失败");
    }
  };

  // 删除股票
  const deleteStock = async (code: string) => {
    if (!confirm("确定删除此股票？")) return;
    
    try {
      const response = await fetch(`/api/tonghuashun/stocks/${code}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadStocks();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  // 逆向分析
  const analyzeStrategy = async (type: string) => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/tonghuashun/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyType: type }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result.data);
        alert("分析完成！请查看分析结果");
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("分析失败:", error);
      alert("分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, [strategyType]);

  return (
    <div className="space-y-6">
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            🌸 同花顺策略
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            管理同花顺策略股票，逆向分析优化自身策略
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加股票
          </Button>
          <Button onClick={loadStocks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 添加股票表单 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>添加股票到同花顺策略</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">股票代码</Label>
                  <Input
                    id="code"
                    placeholder="例如：603466"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">股票名称</Label>
                  <Input
                    id="name"
                    placeholder="例如：风语筑"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="strategyType">策略类型</Label>
                <Select
                  value={formData.strategyType}
                  onValueChange={(value) => setFormData({ ...formData, strategyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5day-trend">5日趋势核心</SelectItem>
                    <SelectItem value="5day-volume">5日容量核心</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">添加原因（可选）</Label>
                <Textarea
                  id="reason"
                  placeholder="说明为什么添加此股票..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">添加</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 策略选择和分析按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>5日趋势核心</CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => analyzeStrategy("5day-trend")}
                disabled={analyzing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? "animate-spin" : ""}`} />
                分析
              </Button>
            </div>
            <CardDescription>
              重点关注连续上涨、均线多头排列的股票
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <CardTitle>5日容量核心</CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => analyzeStrategy("5day-volume")}
                disabled={analyzing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? "animate-spin" : ""}`} />
                分析
              </Button>
            </div>
            <CardDescription>
              重点关注成交量放大、换手率活跃的股票
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* 分析结果 */}
      {analysisResult && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle>📊 逆向分析结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">特征统计</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">分析股票数：</span>
                  <span className="font-semibold">{analysisResult.analyzedCount}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">平均连涨天数：</span>
                  <span className="font-semibold">{analysisResult.features.avgConsecutiveRises.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">平均5日涨幅：</span>
                  <span className="font-semibold">{analysisResult.features.avg5DayChange.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">涨停率：</span>
                  <span className="font-semibold">{(analysisResult.features.avgLimitUpRatio * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">平均量比：</span>
                  <span className="font-semibold">{analysisResult.features.avgVolumeRatio.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">高于CYC率：</span>
                  <span className="font-semibold">{(analysisResult.features.avgPriceAboveCYC * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">共同特征</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.features.commonFeatures.map((feature: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full text-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">优化建议</h4>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {analysisResult.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 股票列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>股票列表</CardTitle>
            <Select value={strategyType} onValueChange={setStrategyType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部策略</SelectItem>
                <SelectItem value="5day-trend">5日趋势核心</SelectItem>
                <SelectItem value="5day-volume">5日容量核心</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>代码</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>策略类型</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>涨跌幅</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>添加时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    暂无股票
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-semibold">{stock.stock_code}</TableCell>
                    <TableCell>{stock.stock_name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          stock.strategy_type === "5day-trend"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                        }`}
                      >
                        {stock.strategy_type === "5day-trend" ? "趋势核心" : "容量核心"}
                      </span>
                    </TableCell>
                    <TableCell>{stock.price?.toFixed(2)}</TableCell>
                    <TableCell className={stock.change_percent && stock.change_percent > 0 ? "text-red-500" : "text-green-500"}>
                      {stock.change_percent?.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500">{stock.source}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500">
                        {new Date(stock.added_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteStock(stock.stock_code)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
