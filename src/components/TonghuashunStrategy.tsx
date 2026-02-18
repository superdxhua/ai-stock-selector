"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, RefreshCw, TrendingUp, BarChart3, ChevronDown, ChevronUp } from "lucide-react";

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

interface StrategyPanelProps {
  strategyType: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientClass: string;
  borderClass: string;
}

function StrategyPanel({ 
  strategyType, 
  title, 
  description, 
  icon, 
  gradientClass, 
  borderClass 
}: StrategyPanelProps) {
  const [stocks, setStocks] = useState<TonghuashunStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [expanded, setExpanded] = useState(true);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    reason: "",
  });

  const loadStocks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tonghuashun/stocks?strategyType=${strategyType}`);
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

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/tonghuashun/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          strategyType,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert("股票添加成功");
        setShowAddForm(false);
        setFormData({ code: "", name: "", reason: "" });
        loadStocks();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("添加股票失败:", error);
      alert("添加失败");
    }
  };

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

  const analyzeStrategy = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch("/api/tonghuashun/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyType }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result.data);
        setShowAnalysis(true);
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
  }, []);

  return (
    <Card className={`border-2 ${borderClass} shadow-lg`}>
      <CardHeader className={`${gradientClass} cursor-pointer`} onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {icon}
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                {description} · {stocks.length} 只股票
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                analyzeStrategy();
              }}
              disabled={analyzing}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? "animate-spin" : ""}`} />
              分析
            </Button>
            {expanded ? (
              <ChevronUp className="w-5 h-5" onClick={(e) => { e.stopPropagation(); setExpanded(false); }} />
            ) : (
              <ChevronDown className="w-5 h-5" onClick={(e) => { e.stopPropagation(); setExpanded(true); }} />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* 分析结果 */}
          {showAnalysis && analysisResult && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-900 dark:text-amber-100">
                    📊 逆向分析结果
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalysis(false)}
                  >
                    ✕
                  </Button>
                </div>
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

          {/* 快捷添加 */}
          {!showAddForm && (
            <div className="flex gap-2">
              <Input
                placeholder="输入股票代码（如：603466）快速添加..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && formData.code) {
                    setShowAddForm(true);
                  }
                }}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <Button
                onClick={() => setShowAddForm(true)}
                disabled={!formData.code}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加
              </Button>
              <Button onClick={loadStocks} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
          )}

          {/* 添加表单 */}
          {showAddForm && (
            <Card className="bg-slate-50 dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <Plus className="w-4 h-4 inline mr-2" />
                    添加股票到 {title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    ✕
                  </Button>
                </div>
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
                    <Label htmlFor="reason">添加原因（可选）</Label>
                    <Textarea
                      id="reason"
                      placeholder="说明为什么添加此股票..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加股票
                    </Button>
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

          {/* 股票列表 */}
          {stocks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              暂无股票，点击上方按钮添加
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>代码</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>涨跌幅</TableHead>
                    <TableHead>添加原因</TableHead>
                    <TableHead>添加时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-semibold">{stock.stock_code}</TableCell>
                      <TableCell>{stock.stock_name}</TableCell>
                      <TableCell>{stock.price?.toFixed(2)}</TableCell>
                      <TableCell className={stock.change_percent && stock.change_percent > 0 ? "text-red-500" : "text-green-500"}>
                        {stock.change_percent?.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-500 max-w-32 truncate block">
                          {stock.reason || "-"}
                        </span>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function TonghuashunStrategy() {
  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          🌸 同花顺策略
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          管理同花顺策略股票，逆向分析优化自身策略
        </p>
      </div>

      {/* 策略面板 */}
      <div className="space-y-6">
        <StrategyPanel
          strategyType="5day-trend"
          title="5日趋势核心"
          description="重点关注连续上涨、均线多头排列的股票"
          icon={<TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          gradientClass="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
          borderClass="border-blue-200 dark:border-blue-800"
        />

        <StrategyPanel
          strategyType="5day-volume"
          title="5日容量核心"
          description="重点关注成交量放大、换手率活跃的股票"
          icon={<BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          gradientClass="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950"
          borderClass="border-purple-200 dark:border-purple-800"
        />
      </div>
    </div>
  );
}
