"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, Target, BarChart3, Eye, Sparkles, Flame, Zap } from "lucide-react";

interface TrackingRecord {
  id: number;
  stockCode: string;
  stockName: string;
  strategy: string;
  bullScore: number;
  potentialLevel: string;
  price: number;
  changePercent: number;
  trackingStatus: string;
  expectedGain: number;
  t1Gain?: number;
  t3Gain?: number;
  maxGain?: number;
  result?: string;
  screenedAt: string;
  completedAt?: string;
  createdAt: string;
}

interface TrackingStats {
  total: number;
  pending: number;
  tracking: number;
  completed: number;
  success: number;
  failed: number;
}

export default function StockTrackingManager() {
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "tracking" | "completed" | "success" | "failed">("all");
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (tab: string = activeTab) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'records',
        limit: '50',
      });

      if (tab !== 'all') {
        if (tab === 'success' || tab === 'failed') {
          params.append('result', tab);
        } else {
          params.append('status', tab);
        }
      }

      const response = await fetch(`/api/experience?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('获取跟踪记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/experience?type=stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value as any);
    fetchData(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'from-slate-400 to-slate-500 bg-gradient-to-r text-white border-0';
      case 'tracking':
        return 'from-blue-500 to-cyan-500 bg-gradient-to-r text-white border-0';
      case 'completed':
        return 'from-gray-400 to-gray-500 bg-gradient-to-r text-white border-0';
      default:
        return 'from-slate-400 to-slate-500 bg-gradient-to-r text-white border-0';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'from-emerald-500 to-green-500 bg-gradient-to-r text-white border-0';
      case 'failed':
        return 'from-red-500 to-rose-500 bg-gradient-to-r text-white border-0';
      case 'hold':
        return 'from-amber-500 to-orange-500 bg-gradient-to-r text-white border-0';
      default:
        return 'from-gray-400 to-gray-500 bg-gradient-to-r text-white border-0';
    }
  };

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
        return <TrendingUp className="w-4 h-4" />;
      case '5day-volume':
        return <BarChart3 className="w-4 h-4" />;
      case 'leader':
        return <Target className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const formatNumber = (num: number): string => {
    return num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-100 mb-1">总跟踪数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Eye className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-slate-400 to-slate-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-100 mb-1">待开始</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-100 mb-1">跟踪中</p>
                  <p className="text-2xl font-bold">{stats.tracking}</p>
                </div>
                <Target className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-100 mb-1">已完成</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-100 mb-1">成功</p>
                  <p className="text-2xl font-bold">{stats.success}</p>
                </div>
                <Sparkles className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-100 mb-1">失败</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
                <XCircle className="w-10 h-10 opacity-20" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 跟踪记录 */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="relative overflow-hidden">
          {/* 顶部装饰条 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-gradient bg-[length:200%_100%]" />
          
          <div className="p-6 border-b bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-red-50/80 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-red-950/30 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    股票跟踪管理
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    实时跟踪和评估选股策略表现
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  fetchData(activeTab);
                  fetchStats();
                }}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white shadow-lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    刷新中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    刷新
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="p-6">
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              全部
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              待开始
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              跟踪中
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              已完成
            </TabsTrigger>
            <TabsTrigger value="success" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              成功
            </TabsTrigger>
            <TabsTrigger value="failed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-sm">
              失败
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">正在加载跟踪记录...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-16">
                <Target className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">暂无跟踪记录</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  策略筛选后会自动创建跟踪记录
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
                      <TableHead className="font-semibold">股票</TableHead>
                      <TableHead className="font-semibold">策略</TableHead>
                      <TableHead className="font-semibold">大牛评分</TableHead>
                      <TableHead className="font-semibold">潜力</TableHead>
                      <TableHead className="font-semibold">状态</TableHead>
                      <TableHead className="font-semibold">T+1</TableHead>
                      <TableHead className="font-semibold">T+3</TableHead>
                      <TableHead className="font-semibold">结果</TableHead>
                      <TableHead className="font-semibold">筛选日期</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell>
                          <div>
                            <div className="font-semibold">{record.stockName}</div>
                            <div className="text-xs text-slate-500 font-mono">{record.stockCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100/90 dark:bg-blue-900/50 text-blue-700 border-blue-500/30">
                            {getStrategyIcon(record.strategy)}
                            <span className="ml-1">
                              {record.strategy === '5day-trend' ? '5日趋势' :
                               record.strategy === '5day-volume' ? '5日容量' :
                               '龙头精选'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                            <Flame className="w-4 h-4 text-orange-600" />
                            <span className="font-bold text-orange-600">{record.bullScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPotentialColor(record.potentialLevel)} shadow-md`}>
                            <Zap className="w-3 h-3 mr-1" />
                            {record.potentialLevel === 'high' ? '高' :
                             record.potentialLevel === 'medium' ? '中' : '低'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(record.trackingStatus)} shadow-md`}>
                            {record.trackingStatus === 'pending' ? '待开始' :
                             record.trackingStatus === 'tracking' ? '跟踪中' : '已完成'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.t1Gain !== undefined && record.t1Gain !== null ? (
                            <Badge className={`${
                              record.t1Gain >= 0
                                ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 font-semibold'
                                : 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 font-semibold'
                            } shadow-sm`}>
                              {formatNumber(record.t1Gain)}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.t3Gain !== undefined && record.t3Gain !== null ? (
                            <Badge className={`${
                              record.t3Gain >= 0
                                ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 font-semibold'
                                : 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 font-semibold'
                            } shadow-sm`}>
                              {formatNumber(record.t3Gain)}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.result ? (
                            <Badge className={`${getResultColor(record.result)} shadow-md`}>
                              {record.result === 'success' ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {record.result === 'success' ? '成功' :
                               record.result === 'failed' ? '失败' : '持有'}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(record.screenedAt).toLocaleDateString('zh-CN')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

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
