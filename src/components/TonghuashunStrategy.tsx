"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, RefreshCw, TrendingUp, BarChart3, ChevronDown, ChevronUp } from "lucide-react";

interface TonghuashunStock {
  id: number;
  stock_code: string;
  stock_name: string;
  strategy_type: string;
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
  });

  const [fetchingName, setFetchingName] = useState(false);

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

  const fetchStockName = async (code: string) => {
    if (code.length !== 6) {
      // 如果长度不是6，清空名称
      setFormData(prev => ({ ...prev, name: "" }));
      return;
    }

    // 验证是否为纯数字
    if (!/^\d{6}$/.test(code)) {
      console.error("股票代码格式不正确:", code);
      setFormData(prev => ({ ...prev, name: "" }));
      alert("股票代码必须是6位数字");
      return;
    }

    setFetchingName(true);
    try {
      // 调用独立的股票信息API
      console.log("开始获取股票名称:", code);
      const response = await fetch(`/api/stock/info?code=${code}`);
      const result = await response.json();
      
      console.log("fetchStockName result", result);
      
      if (result.success && result.data) {
        console.log("获取成功:", result.data.name);
        setFormData(prev => ({ ...prev, name: result.data.name }));
      } else {
        console.error("获取股票名称失败:", result);
        setFormData(prev => ({ ...prev, name: "" }));
        alert(`未找到股票代码 ${code}，请检查代码是否正确`);
      }
    } catch (error) {
      console.error("获取股票名称失败:", error);
      setFormData(prev => ({ ...prev, name: "" }));
      alert("获取股票名称失败，请稍后重试");
    } finally {
      setFetchingName(false);
    }
  };

  const quickAddStock = async () => {
    if (!formData.code || !formData.name) {
      alert("请输入有效的股票代码");
      return;
    }
    
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
        setFormData({ code: "", name: "" });
        loadStocks();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("添加股票失败:", error);
      alert("添加失败");
    }
  };

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    await quickAddStock();
    setShowAddForm(false);
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
                {/* 学习评分 */}
                {analysisResult.learningScore !== undefined && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">学习评分</h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">自我评估学习效果</p>
                      </div>
                      <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {analysisResult.learningScore.toFixed(0)}
                        <span className="text-lg font-normal text-purple-700 dark:text-purple-300">/100</span>
                      </div>
                    </div>
                  </div>
                )}

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
                {/* 应用优化按钮 */}
                {analysisResult.recommendations.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={async () => {
                        if (confirm('确认应用这些优化建议吗？这将调整策略评分权重。')) {
                          try {
                            const response = await fetch('/api/tonghuashun/optimize', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                strategyType,
                                apply: true,
                              }),
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert('策略优化已应用！');
                              setShowAnalysis(false);
                            } else {
                              alert('应用优化失败：' + result.error);
                            }
                          } catch (error) {
                            alert('应用优化失败：' + error);
                          }
                        }
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      ✅ 应用优化建议
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAnalysis(false)}
                    >
                      稍后再说
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 快捷添加 */}
          {!showAddForm && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="输入6位股票代码（如：600519）自动获取名称..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && formData.code && formData.name) {
                      quickAddStock();
                    }
                  }}
                  onChange={(e) => {
                    // 只允许输入数字，最多6位
                    let newCode = e.target.value.replace(/\D/g, "");
                    if (newCode.length > 6) {
                      newCode = newCode.slice(0, 6);
                    }
                    
                    const shouldClearName = newCode.length < 6 && formData.name !== "";
                    
                    if (shouldClearName) {
                      setFormData(prev => ({ code: newCode, name: "" }));
                    } else {
                      setFormData(prev => ({ ...prev, code: newCode }));
                    }
                    
                    // 只有当输入长度为6时才获取股票名称
                    if (newCode.length === 6 && !fetchingName) {
                      fetchStockName(newCode);
                    }
                  }}
                  value={formData.code}
                  disabled={fetchingName}
                  maxLength={6}
                />
                {fetchingName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    获取中...
                  </div>
                )}
              </div>
              <Input
                placeholder="股票名称"
                value={formData.name}
                disabled
                className="w-32"
              />
              <Button
                onClick={quickAddStock}
                disabled={!formData.code || !formData.name || fetchingName}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                快速添加
              </Button>
              <Button onClick={loadStocks} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
              <Button onClick={() => setShowAddForm(true)} variant="outline">
                详细表单
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
                        placeholder="例如：600519"
                        value={formData.code}
                        onChange={(e) => {
                          // 只允许输入数字，最多6位
                          let newCode = e.target.value.replace(/\D/g, "");
                          if (newCode.length > 6) {
                            newCode = newCode.slice(0, 6);
                          }
                          
                          const shouldClearName = newCode.length < 6 && formData.name !== "";
                          
                          if (shouldClearName) {
                            setFormData(prev => ({ code: newCode, name: "" }));
                          } else {
                            setFormData(prev => ({ ...prev, code: newCode }));
                          }
                          
                          // 只有当输入长度为6时才获取股票名称
                          if (newCode.length === 6 && !fetchingName) {
                            fetchStockName(newCode);
                          }
                        }}
                        required
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">股票名称</Label>
                      <Input
                        id="name"
                        placeholder="自动获取或手动输入"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      保存
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
          🌸 同花顺策略管理
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          手动添加同花顺策略股票，支持任意股票，通过逆向分析优化自身选股策略
        </p>
      </div>

      {/* 策略面板 */}
      <div className="space-y-6">
        <StrategyPanel
          strategyType="5day-trend"
          title="5日趋势核心策略池"
          description="存储同花顺5日趋势策略的股票，可手动添加任意股票进行分析"
          icon={<TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          gradientClass="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
          borderClass="border-blue-200 dark:border-blue-800"
        />

        <StrategyPanel
          strategyType="5day-volume"
          title="5日容量核心策略池"
          description="存储同花顺5日容量策略的股票，可手动添加任意股票进行分析"
          icon={<BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          gradientClass="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950"
          borderClass="border-purple-200 dark:border-purple-800"
        />
      </div>
    </div>
  );
}
